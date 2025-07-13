const { aiDocumentProcessor } = require('./server/services/aiDocumentProcessor');

// Test the AI document processor with a sample invoice
async function testAIDocumentProcessing() {
  console.log('Testing AI Document Processing...');
  
  // Create a test document (simulating an invoice)
  const testDocument = {
    documentType: 'sales_invoices',
    transactions: [
      {
        description: 'Web Development Services',
        amount: 1200.00,
        date: '2024-12-01',
        category: 'sales'
      },
      {
        description: 'Consulting Services',
        amount: 800.00,
        date: '2024-12-15',
        category: 'sales'
      }
    ],
    summary: {
      totalAmount: 2000.00,
      currency: 'GBP',
      period: 'December 2024'
    }
  };

  const testDocument2 = {
    documentType: 'purchase_invoices',
    transactions: [
      {
        description: 'Office Supplies',
        amount: 150.00,
        date: '2024-12-05',
        category: 'purchases'
      },
      {
        description: 'Software License',
        amount: 299.00,
        date: '2024-12-10',
        category: 'purchases'
      }
    ],
    summary: {
      totalAmount: 449.00,
      currency: 'GBP',
      period: 'December 2024'
    }
  };

  try {
    // Test aggregation
    const aggregatedData = await aiDocumentProcessor.aggregateFinancialData([testDocument, testDocument2]);
    
    console.log('Aggregated Financial Data:');
    console.log('- Turnover:', aggregatedData.turnover);
    console.log('- Cost of Sales:', aggregatedData.costOfSales);
    console.log('- Other Income:', aggregatedData.otherIncome);
    console.log('- Administrative Expenses:', aggregatedData.administrativeExpenses);
    console.log('- Professional Fees:', aggregatedData.professionalFees);
    console.log('- Other Expenses:', aggregatedData.otherExpenses);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAIDocumentProcessing();