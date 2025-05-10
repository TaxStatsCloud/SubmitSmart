import OpenAI from 'openai';

// Get API key from environment
const apiKey = process.env.OPENAI_API_KEY;

console.log('Starting OpenAI test...');
console.log('API Key available:', apiKey ? 'Yes (not showing for security)' : 'No');

if (!apiKey) {
  console.error('No API key found in OPENAI_API_KEY environment variable');
  process.exit(1);
}

// Initialize the client
const openai = new OpenAI({
  apiKey: apiKey
});

async function testOpenAI() {
  try {
    console.log('Sending test query to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Tell me a brief summary about UK company compliance requirements.' }
      ],
      max_tokens: 100
    });

    console.log('Response received!');
    console.log('Response:', completion.choices[0].message.content);
    console.log('Test completed successfully.');
  } catch (error) {
    console.error('Error testing OpenAI:');
    console.error(error);
    
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}

// Run the test
testOpenAI();