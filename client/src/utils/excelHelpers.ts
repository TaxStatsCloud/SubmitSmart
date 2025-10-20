import * as XLSX from 'xlsx';

export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface ExcelImportResult {
  success: boolean;
  data?: TrialBalanceRow[];
  errors?: string[];
}

export function parseTrialBalanceExcel(file: File): Promise<ExcelImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rawData.length === 0) {
          resolve({
            success: false,
            errors: ['Excel file is empty']
          });
          return;
        }

        // Find header row (look for 'Account Code' or similar)
        let headerRowIndex = -1;
        const possibleHeaders = ['account code', 'code', 'account', 'gl code'];
        
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
          const row = rawData[i];
          if (Array.isArray(row) && row.some((cell: any) => 
            typeof cell === 'string' && 
            possibleHeaders.some(h => cell.toLowerCase().includes(h))
          )) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          resolve({
            success: false,
            errors: ['Could not find header row. Expected columns: Account Code, Account Name, Debit, Credit']
          });
          return;
        }

        const headers = rawData[headerRowIndex].map((h: any) => 
          typeof h === 'string' ? h.toLowerCase().trim() : ''
        );
        
        // Map column indices
        const colMap = {
          accountCode: findColumn(headers, ['account code', 'code', 'gl code', 'account']),
          accountName: findColumn(headers, ['account name', 'name', 'description', 'account description']),
          debit: findColumn(headers, ['debit', 'dr', 'debit amount']),
          credit: findColumn(headers, ['credit', 'cr', 'credit amount'])
        };

        if (colMap.accountCode === -1 || colMap.debit === -1 || colMap.credit === -1) {
          resolve({
            success: false,
            errors: ['Required columns not found. Need: Account Code, Debit, Credit']
          });
          return;
        }

        // Parse data rows (limit to 10,000 rows to prevent UI thread lock)
        const MAX_ROWS = 10000;
        const parsedData: TrialBalanceRow[] = [];
        const errors: string[] = [];

        const dataRowCount = Math.min(rawData.length, headerRowIndex + 1 + MAX_ROWS);
        
        if (rawData.length > dataRowCount) {
          errors.push(`File contains ${rawData.length - headerRowIndex - 1} rows. Only first ${MAX_ROWS} rows will be imported.`);
        }

        for (let i = headerRowIndex + 1; i < dataRowCount; i++) {
          const row = rawData[i];
          if (!Array.isArray(row) || row.length === 0) continue;

          const accountCode = String(row[colMap.accountCode] || '').trim();
          if (!accountCode) continue; // Skip empty rows

          const accountName = colMap.accountName !== -1 
            ? String(row[colMap.accountName] || '').trim() 
            : `Account ${accountCode}`;
          
          const debitValue = parseFloat(String(row[colMap.debit] || '0').replace(/[^0-9.-]/g, ''));
          const creditValue = parseFloat(String(row[colMap.credit] || '0').replace(/[^0-9.-]/g, ''));

          if (isNaN(debitValue) || isNaN(creditValue)) {
            errors.push(`Row ${i + 1}: Invalid debit/credit values for account ${accountCode}`);
            continue;
          }

          parsedData.push({
            accountCode,
            accountName,
            debit: debitValue,
            credit: creditValue
          });
        }

        if (parsedData.length === 0) {
          resolve({
            success: false,
            errors: ['No valid trial balance data found in file']
          });
          return;
        }

        resolve({
          success: true,
          data: parsedData,
          errors: errors.length > 0 ? errors : undefined
        });

      } catch (error) {
        resolve({
          success: false,
          errors: [error instanceof Error ? error.message : 'Failed to parse Excel file']
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        errors: ['Failed to read file']
      });
    };

    reader.readAsBinaryString(file);
  });
}

function findColumn(headers: string[], possibleNames: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase().trim();
    if (possibleNames.some(name => header.includes(name))) {
      return i;
    }
  }
  return -1;
}

export function exportToExcel(data: TrialBalanceRow[], fileName: string = 'trial-balance.xlsx') {
  const worksheet = XLSX.utils.json_to_sheet(data.map(row => ({
    'Account Code': row.accountCode,
    'Account Name': row.accountName,
    'Debit': row.debit,
    'Credit': row.credit
  })));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trial Balance');

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, fileName);
}

export function validateTrialBalance(data: TrialBalanceRow[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const totalDebit = data.reduce((sum, row) => sum + row.debit, 0);
  const totalCredit = data.reduce((sum, row) => sum + row.credit, 0);
  
  const difference = Math.abs(totalDebit - totalCredit);
  
  if (difference > 0.01) { // Allow 1p tolerance for rounding
    errors.push(
      `Trial balance does not balance. Debits: £${totalDebit.toFixed(2)}, Credits: £${totalCredit.toFixed(2)}, Difference: £${difference.toFixed(2)}`
    );
  }

  // Check for duplicate account codes
  const accountCodes = data.map(row => row.accountCode);
  const duplicates = accountCodes.filter((code, index) => accountCodes.indexOf(code) !== index);
  if (duplicates.length > 0) {
    const uniqueDuplicates = Array.from(new Set(duplicates));
    errors.push(`Duplicate account codes found: ${uniqueDuplicates.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
