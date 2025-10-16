# Companies House XML Gateway - Production Credentials Request
## Email Template for Requesting Production Access

---

## 📧 Email Template

**To:** xml@companieshouse.gov.uk

**Subject:** Request for Companies House XML Gateway Production Credentials - [Your Company Name]

---

### Email Body:

```
Dear Companies House XML Gateway Team,

I am writing to request production credentials for the Companies House XML Gateway to enable electronic filing of company accounts and confirmation statements.

COMPANY/ORGANISATION DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Presenter Name: [Your Full Name or Organisation Name]
Company/Organisation: [Your Company Name]
Company Registration Number (if applicable): [Your CRN if filing for your own company]

CONTACT INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primary Contact: [Your Full Name]
Email Address: [Your Email - this will receive credentials]
Telephone Number: [Your Phone Number]
Address: [Your Full Business Address including Postcode]

SOFTWARE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Software/Platform Name: PromptSubmissions
Software Version: [Current version - e.g., 1.0]
Filing Types Required: 
  ☑ Annual Accounts (iXBRL)
  ☑ Confirmation Statements (CS01)

TESTING STATUS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test Environment Setup: [Completed / In Progress / Not Started]
Test Submissions Status: [Completed / In Progress / Not Started]

[If completed testing:]
Test Presenter ID Used: [Your test presenter ID]
Test Submission References: [List any successful test submission IDs]

REQUEST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I would like to request:
☐ Test credentials (for initial testing)
☐ Production credentials (after successful testing)

[If requesting production credentials:]
I confirm that I have successfully completed testing in the test environment and 
am ready to proceed with live filings.

TECHNICAL IMPLEMENTATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Our implementation includes:
- iXBRL generation using FRC 2025 taxonomies
- GovTalk envelope XML structure
- MD5 authentication
- Companies House business rules validation
- Comprehensive error handling and logging

COMPLIANCE CONFIRMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I confirm that:
✓ All submissions will comply with Companies House technical specifications
✓ iXBRL documents will be properly tagged using current FRC taxonomies
✓ All filings will include required authentication and validation
✓ We understand the difference between test (package 0012) and production submissions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please let me know if you require any additional information to process this request.

I look forward to receiving the credentials and contributing to the digital transformation 
of Companies House filings.

Kind regards,

[Your Full Name]
[Your Position/Title]
[Your Company Name]
[Your Email Address]
[Your Phone Number]
```

---

## 📝 Instructions for Completing the Email

### 1. **Presenter Details**
Fill in exactly as it should appear on Companies House records:
- **Presenter Name:** Your name or software provider name
- **Company/Organisation:** Your business trading name
- **CRN:** Your Companies House registration number (if applicable)

### 2. **Contact Information**
Provide accurate, monitored contact details:
- **Email:** Use a monitored business email (credentials will be sent here)
- **Phone:** Include country code if outside UK (+44 for UK)
- **Address:** Full postal address for verification purposes

### 3. **Testing Status**
Be honest about your testing progress:
- **Test credentials first:** Always request test access before production
- **Document test submissions:** Keep records of successful test filings
- **Wait for approval:** Don't request production until testing is complete

---

## ⏱️ Expected Timeline

### For Test Credentials
- **Request to Receipt:** 1-2 business days
- **What you receive:** Test Presenter ID and Authentication Code
- **Valid for:** Unlimited testing submissions with test flag

### For Production Credentials
- **Requirement:** Must complete successful test submissions first
- **Request to Receipt:** 2-5 business days
- **What you receive:** Production Presenter ID and Authentication Code
- **Valid for:** Live company filings

---

## 🔑 What You'll Receive

### Test Credentials Email Will Include:
```
Presenter ID Number: E1234567890 (11 alphanumeric characters)
Presenter Authentication Code: [Your authentication code]
Test Mode Package Number: 0012
Gateway URL: https://xmlgw.companieshouse.gov.uk/v1-0/xmlgw/Gateway
```

### Production Credentials Email Will Include:
```
Presenter ID Number: [Your production ID]
Presenter Authentication Code: [Your authentication code]
Gateway URL: https://xmlgw.companieshouse.gov.uk/v1-0/xmlgw/Gateway
Additional Instructions: [Specific to your account]
```

---

## ✅ Pre-Submission Checklist

Before sending your email, ensure:

- [ ] All contact information is accurate and monitored
- [ ] You have a clear understanding of XML Gateway requirements
- [ ] Your software can generate valid iXBRL documents
- [ ] You understand the difference between test and production environments
- [ ] You're prepared to complete testing before requesting production access
- [ ] You have technical capability to implement MD5 authentication
- [ ] You understand Companies House business rules and validation requirements

---

## 🧪 Testing Requirements Before Production

### What You Must Test:

1. **iXBRL Generation**
   - Valid UK GAAP/IFRS tagging
   - FRC 2025 taxonomy compliance
   - Human and machine-readable format

2. **XML Gateway Submission**
   - GovTalk envelope structure
   - MD5 authentication
   - Test package flag (0012)
   - Correct transaction IDs

3. **Response Handling**
   - Successful submission acknowledgment
   - Error parsing and handling
   - Status polling (if applicable)

4. **Validation**
   - Companies House business rules
   - Required field completion
   - Company authentication code validation

### Successful Test Criteria:
- ✅ At least 2-3 successful test submissions
- ✅ Proper error handling demonstrated
- ✅ All validation rules passed
- ✅ Authentication working correctly
- ✅ Response parsing functional

---

## 🔐 Security Best Practices

### Credential Management:
1. **Store securely:** Never commit credentials to version control
2. **Encrypt in transit:** Use HTTPS for all communications
3. **Limit access:** Only authorized personnel should have credentials
4. **Regular rotation:** Change authentication codes periodically
5. **Monitor usage:** Log all filing attempts for audit trails

### In PromptSubmissions:
- Credentials stored encrypted in database
- Environment variables for sensitive data
- Audit logging for all submission attempts
- Separate test and production credential management

---

## 📞 Companies House XML Gateway Support

### Technical Support Contact:
- **Email:** xml@companieshouse.gov.uk
- **Response Time:** Usually within 1-2 business days
- **Type of Queries:** Technical integration, credentials, validation errors

### What They Can Help With:
- ✅ Credential issuance and resets
- ✅ Technical specification clarification
- ✅ Validation error interpretation
- ✅ Testing environment support
- ✅ Production migration guidance

### What to Include in Support Requests:
- Your Presenter ID
- Transaction ID (for specific submissions)
- Error codes and messages
- Relevant XML snippets (remove sensitive data)

---

## 🚀 After Receiving Credentials

### Immediate Steps:

1. **Save Credentials Securely**
   - Store in password manager or secure vault
   - Never share publicly or commit to code
   - Back up securely

2. **Configure in PromptSubmissions**
   ```
   Company Settings → E-Filing Credentials → Companies House
   
   - Presenter ID: [From email]
   - Authentication Code: [From email]
   - Test Mode: ✓ (for test credentials)
   ```

3. **Test Connection**
   - Click "Test Connection" in PromptSubmissions
   - Verify successful authentication
   - Check error messages if any

4. **Perform Test Submissions**
   - Start with simple accounts
   - Use test company data
   - Verify successful processing
   - Review Companies House responses

5. **Document Results**
   - Keep logs of all test submissions
   - Note any errors and resolutions
   - Prepare summary for production request

---

## 🎯 Production Readiness Criteria

Before requesting production credentials, ensure:

### Technical Requirements:
- [x] iXBRL generation fully functional
- [x] FRC taxonomy tagging complete and accurate
- [x] XML Gateway submission working in test
- [x] MD5 authentication implemented correctly
- [x] Error handling comprehensive
- [x] Logging and audit trails in place

### Testing Requirements:
- [x] Multiple successful test submissions completed
- [x] Various account types tested (micro, small, medium)
- [x] Confirmation statements tested
- [x] Error scenarios handled correctly
- [x] Response processing verified

### Business Requirements:
- [x] User guidance documentation complete
- [x] Secure credential management in place
- [x] Support processes established
- [x] Compliance with Companies House rules verified

---

## 💡 Pro Tips

### Getting Credentials Faster:
1. **Be Complete:** Provide all information in first email
2. **Be Clear:** State exactly what you need (test or production)
3. **Be Professional:** Use business email address
4. **Be Patient:** Allow 1-2 days for response

### Testing Efficiently:
1. **Start Simple:** Test with basic micro-entity accounts
2. **Progress Gradually:** Move to more complex filings
3. **Document Everything:** Keep detailed logs
4. **Test Edge Cases:** Try invalid submissions to test error handling

### Production Success:
1. **Migrate Carefully:** Double-check test vs production configuration
2. **Monitor Closely:** Watch first few live submissions carefully
3. **Have Rollback Plan:** Be ready to revert to test if issues arise
4. **Communicate:** Inform users when production is live

---

## 📋 Quick Reference

### Email Address:
```
xml@companieshouse.gov.uk
```

### Subject Line Format:
```
Request for Companies House XML Gateway [Test/Production] Credentials - [Your Company]
```

### Essential Information to Include:
1. ✅ Your full name and company details
2. ✅ Contact email and phone
3. ✅ Testing status (if applicable)
4. ✅ Software/platform name
5. ✅ Filing types you'll submit
6. ✅ Technical implementation summary

---

## ✨ Next Steps After This Guide

1. **Complete the email template** with your specific details
2. **Send to xml@companieshouse.gov.uk**
3. **Wait for credentials** (1-2 days for test, 3-5 days for production)
4. **Configure in PromptSubmissions** (Company Settings → E-Filing Credentials)
5. **Test thoroughly** before going live
6. **Request production access** once testing is complete
7. **Start filing** real company accounts!

---

**Need Help?**
- 📧 Companies House: xml@companieshouse.gov.uk
- 💬 PromptSubmissions Support: support@promptsubmissions.com
- 📚 Technical Docs: https://www.gov.uk/government/publications/technical-interface-specifications-for-companies-house-software

---

*Last Updated: October 2025*
*This guide is for UK companies/software developers filing to Companies House via XML Gateway*
