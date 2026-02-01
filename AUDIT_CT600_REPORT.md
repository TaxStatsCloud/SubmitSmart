# SubmitSmart CT600 & Companies House Audit Report

**Date:** 2026-02-01
**Auditor:** Claude Code (Opus 4.5)
**Repository:** TaxStatsCloud/SubmitSmart
**Branch:** claude/setup-ct600-audit-bGORg

---

## Executive Summary

SubmitSmart is a substantial codebase (~95 React components, 59 pages, 31 server services) built on Express/React/PostgreSQL. It has real HMRC vendor credentials (Vendor ID 9233), a working GovTalk XML envelope builder, iXBRL generation from scratch using FRC 2025 taxonomy, and Companies House XML Gateway integration. **However, it has never been successfully tested against HMRC or Companies House gateways.** The app's own documentation (`HMRC_IMPLEMENTATION_STATUS.md`, dated Oct 2025) admits IRmark and iXBRL attachment handling are incomplete. There are zero automated tests.

**Verdict: Grade C — Core logic is salvageable, but significant fixes are needed before any real filing can occur.**

---

## 1. CT600 Submission Capability

### Can it build valid GovTalk XML? **Partial**

The `hmrcCTService.ts` (747 lines) builds a GovTalkMessage envelope with:
- Correct namespace: `http://www.govtalk.gov.uk/CM/envelope`
- EnvelopeVersion 2.0
- MessageDetails with Class `HMRC-CT-CT600`, qualifier `request`
- SenderDetails with IDAuthentication (clear text password, Role: "Principal")
- GovTalkDetails with ChannelRouting containing Vendor ID
- Body containing IRenvelope with `http://www.govtalk.gov.uk/taxation/CT/5` namespace
- CompanyTaxReturn with CompanyInformation, ReturnInfoSummary, CompanyTaxCalculation, Declaration

**Issues found:**
1. **Duplicate code paths.** `hmrcCTService.ts` builds XML using `fast-xml-parser` XMLBuilder while `govtalk/HMRCAuthService.ts` builds via `xmlbuilder2` with IRmarkService. These two paths produce different XML and aren't synchronized. The main route (`/ct600/submit`) uses hmrcCTService directly and ignores HMRCAuthService entirely.
2. **Hardcoded test UTR.** The test UTR `8596148860` is hardcoded in hmrcCTService and used for all submissions (`server/services/hmrcCTService.ts:29`). Real submissions need the company's actual UTR.
3. **GatewayTest flag hardcoded to '1'.** (`hmrcCTService.ts:140`). No mechanism to switch to live mode in this code path. The `HMRCAuthService` code path has no GatewayTest field at all.
4. **Missing fields.** The CT600 XML only covers basic fields (turnover, trading profit, losses, tax). Missing: Box 145 (associated companies), Box 435-440 (loan relationships), R&D, capital allowances, group relief, and many others that a real CT600 requires.
5. **Authentication sends password in clear text.** Method is `clear` which HMRC accepts for test, but production may require MD5.

### Does it calculate IRmark correctly? **No — two broken implementations**

**Implementation A** (`hmrcCTService.ts:605-661`):
- Uses `xpath` + `C14nCanonicalization` from `xml-crypto`
- Strips IRmark elements, extracts Body, adds GovTalk namespace to Body
- Applies C14N canonicalization, SHA-1 hash, base64 encode
- **CRITICAL BUG:** On any error, falls back to `HMRC-CT-${timestamp}` which is NOT a valid IRmark and will silently produce submissions that HMRC will reject (`hmrcCTService.ts:658-660`)
- Uses `xml-crypto`'s `C14nCanonicalization` which is Exclusive C14N, but HMRC requires Inclusive C14N (`http://www.w3.org/TR/2001/REC-xml-c14n-20010315`)

**Implementation B** (`govtalk/IRmarkService.ts:20-61`):
- Uses `xml-c14n` library with correct canonicalization algorithm (`http://www.w3.org/TR/2001/REC-xml-c14n-20010315`)
- Async/promise-based, proper error propagation (no silent fallback)
- Extracts Body by GovTalk namespace (more correct)
- **This implementation is more likely to produce correct IRmarks**, but it's NOT used by the main submission route

**Bottom line:** The main CT600 submission uses the wrong IRmark implementation. The correct one exists but is wired into the unused HMRCAuthService code path.

### Does it handle iXBRL attachments? **No**

iXBRL accounts and computations are embedded as CDATA within `<Accounts>` and `<Computations>` elements (`hmrcCTService.ts:278-293`):
```xml
<Accounts type="iXBRL"><![CDATA[...raw iXBRL...]]></Accounts>
```

HMRC requires base64-encoded attachments with a proper manifest in IRheader:
```xml
<Manifest><Contains><Reference><AttachmentID>1</AttachmentID></Reference></Contains></Manifest>
<Attachment><ID>1</ID><Data encoding="base64">...base64...</Data></Attachment>
```

The app's own docs acknowledge this: `HMRC_IMPLEMENTATION_STATUS.md:67-101`.

### Is the submission endpoint configured? **Test only (main path)**

- `hmrcCTService.ts:33` → `https://secure.dev.gateway.gov.uk/submission` (test, hardcoded)
- `HMRCAuthService.ts:87-89` → test and live endpoints available, but this code path is unused by routes
- `shared/constants.ts:9-10` → Different test endpoints (`https://test-api.service.hmrc.gov.uk/ct/submit`) that don't match what the service actually uses — dead config

### Response polling? **Yes, implemented**

`hmrcCTService.ts:411-546` properly handles poll requests with acknowledgement/response/error qualifiers.

---

## 2. Fraud Prevention Headers

### Status: **Not Applicable / Partial**

CT600 uses the XML Gateway (GovTalk), not MTD. The XML Gateway doesn't use HTTP-level `Gov-Client-*` / `Gov-Vendor-*` headers. Instead, vendor identification is embedded in the GovTalk XML envelope:

```xml
<ChannelRouting>
  <Channel>
    <URI>9233</URI>                    <!-- Vendor ID -->
    <Product>PromptSubmissions</Product>  <!-- Product name -->
    <Version>1.0.0</Version>           <!-- Product version -->
  </Channel>
</ChannelRouting>
```

This is present in `hmrcCTService.ts:165-171` and is the correct approach for the XML Gateway.

**However:**
- No Gov-Vendor-License-IDs equivalent (not strictly required for GovTalk but recommended)
- If this app ever needed to support MTD (e.g., for VAT), fraud prevention headers would need to be built from scratch
- The HTTP request only sends `Content-Type`, `SOAPAction`, and `User-Agent` headers (`hmrcCTService.ts:331-335`)

---

## 3. iXBRL Handling

### Generates iXBRL: **Yes — substantial implementation**

The app has a complete iXBRL generation pipeline in `server/services/ixbrl/`:

| Module | File | Purpose |
|--------|------|---------|
| IXBRLGenerator | `IXBRLGenerator.ts` (345 lines) | Base generator: namespaces, contexts, tagging functions |
| BalanceSheetGenerator | `BalanceSheetGenerator.ts` (652 lines) | Full balance sheet with comparatives |
| ProfitLossGenerator | `ProfitLossGenerator.ts` | P&L statement with format variants |
| DirectorsReportGenerator | `DirectorsReportGenerator.ts` | Directors' report with iXBRL tags |
| AccountingPoliciesGenerator | `AccountingPoliciesGenerator.ts` | Accounting policies and notes |
| CashFlowStatementGenerator | `CashFlowStatementGenerator.ts` | Cash flow (medium/large only) |
| StrategicReportGenerator | `StrategicReportGenerator.ts` | Strategic report (large only) |
| EntitySizeDetector | `EntitySizeDetector.ts` (243 lines) | Companies Act 2006 size classification |
| IXBRLPackagingService | `IXBRLPackagingService.ts` (233 lines) | ZIP packaging for CH submission |

**Taxonomy:** FRC 2025 (2025-01-01 entry points)
- Micro: `uk-gaap-frs-105-2025-01-01.xsd`
- Small/Medium: `uk-gaap-frs-102-2025-01-01.xsd`
- Large: `uk-ifrs-2025-01-01.xsd`

**Issues found:**
1. **Namespace collision.** `IXBRLGenerator.ts:51-55` — `ukGAAP`, `core`, and `bus` namespaces all map to the same URL (`http://xbrl.frc.org.uk/cd/2025-01-01/business`). The `uk-gaap` prefix should point to `http://xbrl.frc.org.uk/fr/2025-01-01/core` or the FRS entry point, not the business namespace. Tags like `uk-gaap:IntangibleAssets` will resolve to the wrong schema.
2. **SEC transformation namespace.** `IXBRLGenerator.ts:47` uses `http://www.sec.gov/inlineXBRL/transformation/2015-08-31` which is the US SEC's iXBRL transformation registry. UK filings should use the HMRC/FRC transformation registry.
3. **Never validated against real validators.** No evidence that output has been run through the Companies House iXBRL validator, HMRC's IRenvelopeValidator, or the FRC's XBRL validator.
4. **Hardcoded approval date.** `BalanceSheetGenerator.ts:641` uses `new Date().toISOString()` as the balance sheet approval date rather than the actual board approval date.

### Accepts uploaded iXBRL: **Yes**

The CT600 routes accept `ixbrlAccounts` and `ixbrlComputations` as string parameters in the request body. These go through enhanced validation before embedding.

### Validates iXBRL: **Yes — two validation services**

1. `ixbrlValidationService.ts` — Checks namespace declarations, context/unit presence, required tags by entity size
2. `ixbrlEnhancedValidationService.ts` (36KB) — DOM/XPath-based validation, placeholder detection, tag counting

These validate structural requirements (namespaces, contexts, units, required elements) but cannot validate:
- Taxonomy element names against the actual schema
- Calculation linkbase consistency
- Presentation linkbase compliance
- Whether the output would pass Companies House or HMRC validators

---

## 4. Companies House Integration

### CS01 Supported: **Yes — full implementation**

- `CS01XMLGenerator.ts` (275 lines): Generates complete CS01 XML body with company details, SIC codes, directors, PSCs, shareholders, share classes, statement of capital, statutory registers, declarations
- `CS01FilingService.ts` (208 lines): End-to-end submission with Stripe payment (£34), Companies House XML Gateway submission via GovTalkEnvelopeBuilder, response parsing
- `ConfirmationStatementWizard.tsx` (71KB): Multi-step UI wizard
- Route: `POST /api/confirmation-statement/submit`

### Accounts Filing Supported: **Yes — full implementation**

- `AnnualAccountsFilingService.ts` (325 lines): Generates iXBRL, packages into ZIP, submits via GovTalk envelope
- `AnnualAccountsWizard.tsx` (137KB): Multi-step accounts filing wizard
- Route: `POST /api/annual-accounts/submit`
- Supports entity sizes: MicroEntity, SmallFull, MediumFull, FullAccounts

### API Integration Working: **Unknown — never tested against live gateway**

- Companies House REST API: `companiesHouseApiService.ts` uses Basic auth with API key for lookups (company search, filing history, officers). This likely works.
- Companies House XML Gateway: `CompaniesHouseAuthService.ts` uses CHMD5 authentication. Has correct gateway URL (`https://xmlgw.companieshouse.gov.uk/v1-0/xmlgw/Gateway`). **But test and live endpoints point to the same URL** (`CompaniesHouseAuthService.ts:53-55`) — no separate test gateway.
- Presenter credentials come from env vars (`COMPANIES_HOUSE_PRESENTER_ID`, `COMPANIES_HOUSE_PASSWORD`). These must be registered with Companies House before any filings work.

**Issue:** Companies House requires a registered software filing agent with approved Presenter ID. The docs include an email template for requesting XML Gateway access (`COMPANIES_HOUSE_XML_GATEWAY_EMAIL_TEMPLATE.md`) which suggests this hasn't been done yet.

---

## 5. Code Quality & Portability

### Replit Coupling: **Heavy**

| Coupling Point | File | Impact |
|----------------|------|--------|
| `.replit` config | `.replit` | Build/deploy configuration |
| Vite plugins | `vite.config.ts:4,11,13` | `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-runtime-error-modal` |
| Auth system | `server/replitAuth.ts` | Full Replit OIDC authentication |
| Environment detection | `FilingAuthConfig.ts:13` | `REPLIT_DEPLOYMENT === '1'` for production check |
| Hardcoded URLs | `emailTemplates.ts` | `promptsubmissions.replit.app` in emails |
| Package deps | `package.json:106-107` | Replit dev dependencies |

**Removing Replit would require:** Replacing auth system, removing vite plugins, changing environment detection, updating all hardcoded URLs, reconfiguring deployment.

### Security Issues

| Severity | Issue | Location |
|----------|-------|----------|
| **HIGH** | Admin password `Admin123!` in plaintext | `ADMIN_CREDENTIALS.md:18-19`, `create-admin-user.js:18` |
| **HIGH** | HMRC test password fallback in code | `hmrcCTService.ts:30` — `'fGuR34fAOEJf'` as default |
| **MEDIUM** | Vendor ID 9233 hardcoded (not secret but shouldn't be in source) | `hmrcCTService.ts:27`, `FilingAuthConfig.ts:45` |
| **LOW** | No rate limiting on HMRC submission endpoints | `hmrcRoutes.ts` — no auth middleware |

### Testing: **None**

- Zero `.test.ts` or `.spec.ts` files
- No test runner configured (no jest, vitest, mocha)
- No CI/CD (no GitHub Actions, no Docker)
- The only "testing" is manual via `/hmrc-test` page

### Positive Quality Indicators

- TypeScript strict mode enabled
- Drizzle ORM with proper schema and relations (1,289 lines of schema)
- Zod validation schemas
- Scrypt password hashing with timing-safe comparison
- PostgreSQL-backed sessions
- AI rate limiting with atomic transactions
- Role-based access control (director/accountant/admin/auditor)
- Proper error tracking middleware

---

## 6. Overall Assessment

### Grade: **C**

> Core logic salvageable, significant refactoring needed

### Recommendation: **Salvage specific modules**

The iXBRL generation pipeline and Companies House integration are worth keeping. The CT600 submission needs significant rework — primarily consolidating the two competing code paths and fixing IRmark + attachment handling. The Replit coupling needs to be removed for any production deployment outside Replit.

### Blocking Issues

1. **IRmark uses wrong canonicalization algorithm** in the main code path (Exclusive C14N vs required Inclusive C14N). The correct implementation exists but is unused.
2. **iXBRL attachments embedded incorrectly** (CDATA instead of base64 with manifest). HMRC will reject submissions with accounts/computations.
3. **Two competing submission architectures** that aren't connected. `hmrcCTService.ts` and `govtalk/HMRCAuthService.ts` do the same thing differently.
4. **No Companies House Presenter ID** — XML Gateway access hasn't been registered.
5. **Zero tests** — nothing verified against real HMRC/CH gateways.
6. **iXBRL namespace errors** — uk-gaap/core/bus point to same URL; SEC transformation namespace used instead of UK.

### What's Actually Salvageable

| Module | Quality | Verdict |
|--------|---------|---------|
| GovTalk envelope builder (`govtalk/`) | Good | Keep — well-structured, correct approach |
| IRmarkService (`govtalk/IRmarkService.ts`) | Good | Keep — correct algorithm, proper C14N |
| CS01 XML Generator | Good | Keep — comprehensive data model and XML output |
| iXBRL generation pipeline (`ixbrl/`) | Medium | Keep with fixes — substantial work, needs namespace corrections |
| Entity size detector | Good | Keep — correct Companies Act 2006 thresholds |
| Companies House API service | Good | Keep — standard REST API wrapper |
| `hmrcCTService.ts` | Poor | Rewrite — consolidate into govtalk/ architecture |
| Database schema | Good | Keep — comprehensive, well-designed |
| React UI wizards | Good | Keep — substantial UI work (260KB+ of wizard pages) |

---

## 7. Specific Fixes Required

### Critical (Must fix before any real filing)

1. **Consolidate CT600 submission to use govtalk/ architecture** — Wire `HMRCAuthService.ts` + `IRmarkService.ts` into the actual submission routes instead of the inline hmrcCTService implementation. Remove the fallback IRmark that produces garbage.

2. **Fix iXBRL attachment format for HMRC** — Implement proper IRheader manifest with base64-encoded attachments per HMRC CT600 Technical Pack specification.

3. **Fix iXBRL namespaces** — Correct `uk-gaap`, `core`, `bus` to point to their actual schema URLs. Replace SEC transformation namespace with UK equivalent.

4. **Register with Companies House XML Gateway** — Send the registration email, get Presenter ID and authentication code.

5. **Make UTR configurable per company** — Remove hardcoded test UTR from hmrcCTService. Accept UTR from the company record.

6. **Add authentication to HMRC routes** — `hmrcRoutes.ts` has no `isAuthenticated` middleware. Anyone can submit CT600s.

### High Priority

7. **Remove hardcoded passwords** — Delete `ADMIN_CREDENTIALS.md`, remove fallback password from `hmrcCTService.ts:30`.

8. **Add GatewayTest toggle** — Wire to environment config so test vs live is controlled by deployment, not hardcoded.

9. **Validate iXBRL output against HMRC/CH validators** — Run generated documents through the HMRC IRenvelopeValidator and Companies House online filing validator.

10. **Add integration tests** — At minimum: IRmark calculation against known test vectors, GovTalk envelope schema validation, iXBRL namespace validation.

### Medium Priority

11. **Remove Replit coupling** — Replace Replit auth with standard OAuth/OIDC provider, remove vite plugins, update environment detection.

12. **Expand CT600 box coverage** — Currently only covers basic trading profit/loss. Needs capital allowances, loan relationships, R&D credits, group relief, associated companies, etc.

13. **Add balance sheet approval date** — Currently hardcoded to `new Date()` in BalanceSheetGenerator. Should use actual director approval date.

14. **Dead config cleanup** — `shared/constants.ts` has HMRC endpoints that don't match what the services use. Remove or consolidate.

---

## Appendix: Key File Locations

| Purpose | File |
|---------|------|
| Main CT600 service | `server/services/hmrcCTService.ts` |
| HMRC routes | `server/routes/hmrcRoutes.ts` |
| GovTalk envelope | `server/services/govtalk/GovTalkEnvelopeBuilder.ts` |
| IRmark (correct impl) | `server/services/govtalk/IRmarkService.ts` |
| HMRC auth service | `server/services/govtalk/HMRCAuthService.ts` |
| Filing auth config | `server/services/govtalk/FilingAuthConfig.ts` |
| CH XML Gateway | `server/services/companiesHouseXMLGatewayService.ts` |
| CH auth service | `server/services/govtalk/CompaniesHouseAuthService.ts` |
| CS01 generator | `server/services/filing/CS01XMLGenerator.ts` |
| CS01 filing service | `server/services/filing/CS01FilingService.ts` |
| Annual accounts filing | `server/services/filing/AnnualAccountsFilingService.ts` |
| iXBRL base generator | `server/services/ixbrl/IXBRLGenerator.ts` |
| Balance sheet generator | `server/services/ixbrl/BalanceSheetGenerator.ts` |
| iXBRL packaging | `server/services/ixbrl/IXBRLPackagingService.ts` |
| Entity size detector | `server/services/ixbrl/EntitySizeDetector.ts` |
| iXBRL validation | `server/services/ixbrlValidationService.ts` |
| Enhanced validation | `server/services/ixbrlEnhancedValidationService.ts` |
| Database schema | `shared/schema.ts` |
| CT600 box mapping | `shared/ct600BoxMapping.ts` |
| CT600 validation | `shared/ct600Validation.ts` |
| Constants/config | `shared/constants.ts` |
| HMRC impl status doc | `docs/HMRC_IMPLEMENTATION_STATUS.md` |
| Production readiness doc | `docs/PRODUCTION_FILING_READINESS_STATUS.md` |
