import OpenAI from "openai";

// Initialize the OpenAI client with more debugging
console.log("Initializing OpenAI client");
console.log("API Key available:", process.env.OPENAI_API_KEY ? "Yes (not showing for security)" : "No");

// Initialize with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Allow browser usage if needed
});

/**
 * Generate a text completion response using OpenAI
 * @param prompt The prompt to send to the AI
 * @param systemPrompt Optional system prompt to provide context
 * @returns The AI generated response
 */
export async function generateCompletion(
  prompt: string,
  systemPrompt: string = "You are a helpful assistant for UK companies filing compliance documents."
): Promise<string> {
  console.log("Generating completion for prompt:", prompt.substring(0, 50) + "...");
  
  try {
    // Use a reliable model instead of the newest one for testing
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using a more widely available model for testing
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
    });

    console.log("OpenAI response received");
    return response.choices[0].message.content || "I apologize, but I couldn't generate a response.";
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}

/**
 * Generate a structured JSON response using OpenAI
 * @param prompt The prompt to send to the AI
 * @param systemPrompt Optional system prompt to provide context
 * @returns The AI generated JSON response
 */
export async function generateStructuredResponse<T>(
  prompt: string,
  systemPrompt: string = "You are a helpful assistant. Provide responses in JSON format following the specified structure."
): Promise<T> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response content generated");
    }

    return JSON.parse(content) as T;
  } catch (error: any) {
    console.error("OpenAI API error:", error.message);
    throw new Error(`Failed to generate structured response: ${error.message}`);
  }
}

/**
 * Analyze a document using OpenAI
 * @param documentContent The text content of the document to analyze
 * @param documentType The type of document (e.g., 'trial_balance', 'invoice', etc.)
 * @returns Analysis results as a structured object
 */
export async function analyzeDocument<T>(
  documentContent: string,
  documentType: string
): Promise<T> {
  // Create a prompt based on document type
  let prompt = `Please analyze the following ${documentType} document and extract the relevant information:\n\n${documentContent}\n\n`;

  // Add specific instructions based on document type
  if (documentType === 'trial_balance') {
    prompt += "Extract account names, codes, balances, and categorize them into assets, liabilities, equity, revenue, and expenses. Calculate totals for each category.";
  } else if (documentType === 'invoice') {
    prompt += "Extract invoice number, date, vendor/client details, line items with quantities and prices, subtotal, tax, and total amount.";
  } else if (documentType === 'bank_statement') {
    prompt += "Extract account details, period dates, opening/closing balances, and list all transactions with dates, descriptions, and amounts.";
  } else if (documentType === 'accounting_export') {
    prompt += "Identify the accounting software, extract period information, and summarize the financial data into balance sheet and profit & loss categories.";
  }

  // Request structured output
  prompt += "\nProvide the analysis as a JSON object with appropriate categories and structure.";

  const systemPrompt = `You are a financial document analysis expert specializing in ${documentType} documents for UK companies. 
Extract information accurately and organize it in a structured JSON format suitable for compliance filings.`;

  return await generateStructuredResponse<T>(prompt, systemPrompt);
}

/**
 * Generate a draft filing based on provided data
 * @param filingType The type of filing to generate (e.g., 'confirmation_statement', 'annual_accounts', 'corporation_tax')
 * @param companyData Company information
 * @param documentData Data extracted from analyzed documents
 * @returns Generated filing draft as a structured object
 */
export async function generateFilingDraft<T>(
  filingType: string,
  companyData: any,
  documentData: any[]
): Promise<T> {
  // Create context information about the company and documents
  const companyContext = JSON.stringify(companyData);
  const documentsContext = JSON.stringify(documentData);

  // Create appropriate prompt based on filing type
  let prompt = `Generate a draft ${filingType} filing for the following UK company:\n\n${companyContext}\n\n`;
  prompt += `Based on these analyzed documents:\n\n${documentsContext}\n\n`;

  // Add specific instructions based on filing type
  if (filingType === 'confirmation_statement') {
    prompt += "Include company details, registered office address, SIC codes, statement of capital, shareholders, officers, and PSCs.";
  } else if (filingType === 'annual_accounts') {
    prompt += "Generate a complete set of UK GAAP compliant accounts including balance sheet, profit and loss account, notes, and directors' report.";
  } else if (filingType === 'corporation_tax') {
    prompt += "Create a CT600 draft with tax calculations, adjustments, and computations based on the financial data provided.";
  }

  // Request structured output
  prompt += "\nProvide the filing draft as a JSON object with all required sections and details for compliance.";

  const systemPrompt = `You are an expert in UK regulatory filings specializing in ${filingType} submissions.
Create a complete and compliant filing draft based on the provided information that adheres to Companies House and HMRC requirements.
Format your response as a structured JSON object suitable for submission after human review.`;

  return await generateStructuredResponse<T>(prompt, systemPrompt);
}

/**
 * Check a filing draft for compliance issues
 * @param filingType The type of filing being checked
 * @param filingData The draft filing data to analyze
 * @returns Compliance check results with any issues and recommendations
 */
export async function checkFilingCompliance(
  filingType: string,
  filingData: any
): Promise<{
  isCompliant: boolean;
  issues: { severity: string; message: string; recommendation: string }[];
  recommendations: string[];
}> {
  const filingContext = JSON.stringify(filingData);

  const prompt = `Perform a compliance check on the following ${filingType} filing for a UK company:\n\n${filingContext}\n\n
  Analyze the filing for any compliance issues, missing information, or inconsistencies.
  Identify any elements that might cause rejection by Companies House or HMRC.
  Provide specific recommendations for addressing each issue.
  
  Return a JSON object with:
  1. isCompliant: boolean indicating if the filing appears compliant
  2. issues: array of objects with "severity" (high/medium/low), "message" describing the issue, and "recommendation" for fixing it
  3. recommendations: array of general recommendations for improving the filing`;

  const systemPrompt = `You are a UK compliance expert with deep knowledge of ${filingType} requirements.
Your task is to thoroughly analyze the filing for compliance issues and provide clear guidance on addressing any problems.
Format your response as a structured JSON object.`;

  return await generateStructuredResponse<{
    isCompliant: boolean;
    issues: { severity: string; message: string; recommendation: string }[];
    recommendations: string[];
  }>(prompt, systemPrompt);
}