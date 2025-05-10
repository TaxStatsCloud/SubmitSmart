import { generateResponse, analyzeFinancialDocument, generateDraft } from './server/services/aiService.js';

// Test the AI service functions
async function testAiService() {
  try {
    console.log('Testing generateResponse function...');
    // Assuming user ID 1 exists in the storage
    const response = await generateResponse('What are the main requirements for filing a UK confirmation statement?', 1);
    console.log('Response received:', response.substring(0, 150) + '...');
    
    // You can uncomment the following to test other functions if needed
    /*
    console.log('\nTesting analyzeFinancialDocument function...');
    // Assuming document ID 1 exists
    const analysis = await analyzeFinancialDocument(1);
    console.log('Analysis received:', JSON.stringify(analysis, null, 2));
    
    console.log('\nTesting generateDraft function...');
    // Assuming company ID 1 and document IDs [1, 2] exist
    const draft = await generateDraft('confirmation_statement', [1, 2], 1);
    console.log('Draft received:', JSON.stringify(draft, null, 2));
    */
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error testing AI service:', error);
  }
}

// Run the tests
testAiService();