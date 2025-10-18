import { create } from 'xmlbuilder2';

export interface CS01Shareholder {
  name: string;
  sharesHeld: number;
  shareClass: string;
}

export interface CS01ShareClass {
  className: string;
  currency: string;
  totalShares: number;
  nominalValue: number;
  votingRights: boolean;
  dividendRights: boolean;
  capitalRights: boolean;
  restrictionOnTransfer: boolean;
}

export interface CS01Data {
  // Company Details
  companyName: string;
  companyNumber: string;
  registeredOffice: string;
  registeredEmailAddress: string;
  
  // SIC Codes
  sicCodes: string;
  tradingStatus: "trading" | "dormant";
  
  // Stock Exchange
  tradingOnStockExchange: boolean;
  stockExchangeName?: string;
  
  // Directors
  directors: string;
  
  // PSC (People with Significant Control)
  pscName: string;
  pscNationality: string;
  pscDateOfBirth: string;
  pscServiceAddress: string;
  pscNatureOfControl: string[];
  
  // Shareholders
  shareholders: CS01Shareholder[];
  
  // Share Classes
  shareClasses: CS01ShareClass[];
  
  // Share Capital
  shareCapitalChanged: boolean;
  numberOfShares?: number;
  nominalValue?: number;
  currency: string;
  
  // Statement of Capital
  aggregateNominalValue?: number;
  amountPaidUp?: number;
  amountUnpaid?: number;
  
  // Statutory Registers
  statutoryRegistersLocation: "registered_office" | "sail_address" | "other";
  statutoryRegistersOtherAddress?: string;
  
  // Declarations
  statementOfLawfulPurposes: boolean;
  
  // Confirmation
  statementDate: string;
  madeUpToDate: string;
}

export class CS01XMLGenerator {
  /**
   * Generate CS01 XML body for submission to Companies House
   * This creates the body content that will be wrapped in GovTalk envelope
   */
  static generateCS01Body(data: CS01Data): string {
    const root = create({ version: '1.0', encoding: 'UTF-8' });
    
    const confirmationStatement = root.ele('ConfirmationStatement', {
      xmlns: 'http://xmlgw.companieshouse.gov.uk/v2-1/schema'
    });

    confirmationStatement.ele('CompanyNumber').txt(data.companyNumber);
    confirmationStatement.ele('CompanyName').txt(data.companyName);
    confirmationStatement.ele('MadeUpToDate').txt(data.madeUpToDate);
    confirmationStatement.ele('StatementDate').txt(data.statementDate);

    const registeredOffice = confirmationStatement.ele('RegisteredOffice');
    this.buildAddress(registeredOffice, data.registeredOffice);

    confirmationStatement.ele('RegisteredEmailAddress').txt(data.registeredEmailAddress);

    const sicCodes = confirmationStatement.ele('SICCodes');
    const codes = data.sicCodes.split(',').map(code => code.trim()).filter(code => code.length > 0);
    codes.forEach(code => {
      sicCodes.ele('SICCode').txt(code);
    });

    confirmationStatement.ele('TradingStatus').txt(data.tradingStatus === 'trading' ? 'Trading' : 'Dormant');

    if (data.tradingOnStockExchange && data.stockExchangeName) {
      const stockExchange = confirmationStatement.ele('StockExchange');
      stockExchange.ele('Name').txt(data.stockExchangeName);
    }

    const directors = confirmationStatement.ele('Directors');
    const directorNames = data.directors.split('\n').map(d => d.trim()).filter(d => d.length > 0);
    directorNames.forEach(directorName => {
      const director = directors.ele('Director');
      director.ele('Name').txt(directorName);
    });

    const pscSection = confirmationStatement.ele('PersonsWithSignificantControl');
    const psc = pscSection.ele('PSC');
    psc.ele('Name').txt(data.pscName);
    psc.ele('Nationality').txt(data.pscNationality);
    psc.ele('DateOfBirth').txt(data.pscDateOfBirth);
    
    const pscServiceAddress = psc.ele('ServiceAddress');
    this.buildAddress(pscServiceAddress, data.pscServiceAddress);
    
    const naturesOfControl = psc.ele('NaturesOfControl');
    data.pscNatureOfControl.forEach(nature => {
      naturesOfControl.ele('NatureOfControl').txt(nature);
    });

    const shareholdersSection = confirmationStatement.ele('Shareholders');
    data.shareholders.forEach(shareholder => {
      const sh = shareholdersSection.ele('Shareholder');
      sh.ele('Name').txt(shareholder.name);
      sh.ele('SharesHeld').txt(String(shareholder.sharesHeld));
      sh.ele('ShareClass').txt(shareholder.shareClass);
    });

    const shareClassesSection = confirmationStatement.ele('ShareClasses');
    data.shareClasses.forEach(shareClass => {
      const sc = shareClassesSection.ele('ShareClass');
      sc.ele('ClassName').txt(shareClass.className);
      sc.ele('Currency').txt(shareClass.currency);
      sc.ele('TotalShares').txt(String(shareClass.totalShares));
      sc.ele('NominalValue').txt(String(shareClass.nominalValue));
      
      const rights = sc.ele('Rights');
      rights.ele('VotingRights').txt(shareClass.votingRights ? 'Yes' : 'No');
      rights.ele('DividendRights').txt(shareClass.dividendRights ? 'Yes' : 'No');
      rights.ele('CapitalRights').txt(shareClass.capitalRights ? 'Yes' : 'No');
      rights.ele('RestrictionOnTransfer').txt(shareClass.restrictionOnTransfer ? 'Yes' : 'No');
    });

    const statementOfCapital = confirmationStatement.ele('StatementOfCapital');
    statementOfCapital.ele('Currency').txt(data.currency);
    
    if (data.aggregateNominalValue !== undefined) {
      statementOfCapital.ele('AggregateNominalValue').txt(String(data.aggregateNominalValue));
    }
    if (data.amountPaidUp !== undefined) {
      statementOfCapital.ele('AmountPaidUp').txt(String(data.amountPaidUp));
    }
    if (data.amountUnpaid !== undefined) {
      statementOfCapital.ele('AmountUnpaid').txt(String(data.amountUnpaid));
    }

    const statutoryRegisters = confirmationStatement.ele('StatutoryRegisters');
    statutoryRegisters.ele('Location').txt(this.mapStatutoryRegisterLocation(data.statutoryRegistersLocation));
    if (data.statutoryRegistersOtherAddress && data.statutoryRegistersLocation !== 'registered_office') {
      const otherAddress = statutoryRegisters.ele('InspectionAddress');
      this.buildAddress(otherAddress, data.statutoryRegistersOtherAddress);
    }

    const declarations = confirmationStatement.ele('Declarations');
    declarations.ele('StatementOfLawfulPurposes').txt(data.statementOfLawfulPurposes ? 'Confirmed' : 'Not Confirmed');

    return root.end({ prettyPrint: true });
  }

  private static buildAddress(parent: any, addressString: string): void {
    const lines = addressString.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (lines.length > 0) {
      parent.ele('AddressLine1').txt(lines[0]);
    }
    if (lines.length > 1) {
      parent.ele('AddressLine2').txt(lines[1]);
    }
    if (lines.length > 2) {
      parent.ele('City').txt(lines[2]);
    }
    if (lines.length > 3) {
      parent.ele('Postcode').txt(lines[3]);
    }
    if (lines.length > 4) {
      parent.ele('Country').txt(lines[4]);
    } else {
      parent.ele('Country').txt('United Kingdom');
    }
  }

  private static mapStatutoryRegisterLocation(location: string): string {
    switch (location) {
      case 'registered_office':
        return 'RegisteredOffice';
      case 'sail_address':
        return 'SAILAddress';
      case 'other':
        return 'OtherAddress';
      default:
        return 'RegisteredOffice';
    }
  }


  /**
   * Validate CS01 data before generating XML
   */
  static validateCS01Data(data: CS01Data): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.companyNumber || data.companyNumber.length < 8) {
      errors.push('Company number must be at least 8 characters');
    }

    if (!data.companyName || data.companyName.trim().length === 0) {
      errors.push('Company name is required');
    }

    if (!data.registeredEmailAddress || !this.isValidEmail(data.registeredEmailAddress)) {
      errors.push('Valid registered email address is required');
    }

    if (!data.sicCodes || data.sicCodes.trim().length === 0) {
      errors.push('At least one SIC code is required');
    }

    if (!data.directors || data.directors.trim().length === 0) {
      errors.push('At least one director is required');
    }

    if (data.shareholders.length === 0) {
      errors.push('At least one shareholder is required');
    }

    if (data.shareClasses.length === 0) {
      errors.push('At least one share class is required');
    }

    if (!data.statementOfLawfulPurposes) {
      errors.push('Statement of lawful purposes must be confirmed');
    }

    if (!data.madeUpToDate) {
      errors.push('Made up to date is required');
    }

    if (!data.statementDate) {
      errors.push('Statement date is required');
    }

    if (data.tradingOnStockExchange && (!data.stockExchangeName || data.stockExchangeName.trim() === '')) {
      errors.push('Stock exchange name is required when trading on stock exchange');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
