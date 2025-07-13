// Test script to verify Companies House API key functionality
import https from 'https';

const COMPANIES_HOUSE_API_KEY = '0d3c76b6-a5b7-4322-b40b-b8b344ab0152';

// Test function to check API connectivity
function testCompaniesHouseAPI() {
  console.log('Testing Companies House API connectivity...');
  
  // Test with a known company - 2 CIWT LIMITED (15590153)
  const companyNumber = '15590153';
  const options = {
    hostname: 'api.company-information.service.gov.uk',
    port: 443,
    path: `/company/${companyNumber}`,
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(COMPANIES_HOUSE_API_KEY + ':').toString('base64')}`,
      'Accept': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Companies House API connection successful!');
        const company = JSON.parse(data);
        console.log('Company Details:');
        console.log(`- Name: ${company.company_name}`);
        console.log(`- Number: ${company.company_number}`);
        console.log(`- Status: ${company.company_status}`);
        console.log(`- Type: ${company.type}`);
        console.log(`- Incorporation Date: ${company.date_of_creation}`);
        if (company.date_of_cessation) {
          console.log(`- Dissolution Date: ${company.date_of_cessation}`);
        }
      } else {
        console.log('❌ API request failed');
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Connection error:', error.message);
  });

  req.end();
}

// Test rate limiting - Companies House allows 600 requests per 5 minutes
function testRateLimiting() {
  console.log('\nTesting rate limiting...');
  
  const options = {
    hostname: 'api.company-information.service.gov.uk',
    port: 443,
    path: '/company/00000006', // Test with Tesco PLC
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(COMPANIES_HOUSE_API_KEY + ':').toString('base64')}`,
      'Accept': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Rate limit remaining: ${res.headers['x-ratelimit-remain']}`);
    console.log(`Rate limit reset: ${res.headers['x-ratelimit-reset']}`);
    console.log(`Rate limit window: ${res.headers['x-ratelimit-window']}`);
  });

  req.on('error', (error) => {
    console.error('Rate limiting test error:', error.message);
  });

  req.end();
}

// Run tests
testCompaniesHouseAPI();
setTimeout(testRateLimiting, 2000);