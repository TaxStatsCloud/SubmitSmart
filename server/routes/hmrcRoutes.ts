import { Router } from 'express';
import { hmrcCTService } from '../services/hmrcCTService';

const router = Router();

// HMRC Corporation Tax API routes
router.post('/ct600/submit', async (req, res) => {
  try {
    const { corporationTaxData } = req.body;
    
    if (!corporationTaxData) {
      return res.status(400).json({ message: "Corporation tax data is required" });
    }
    
    // Validate data before submission
    const validation = hmrcCTService.validateCT600Data(corporationTaxData);
    if (!validation.valid) {
      return res.status(400).json({ 
        message: "Invalid corporation tax data",
        errors: validation.errors 
      });
    }
    
    // Generate XML and submit to HMRC
    const xmlData = await hmrcCTService.generateCT600XML(corporationTaxData);
    const submissionResult = await hmrcCTService.submitCT600(xmlData);
    
    res.json({
      success: submissionResult.success,
      correlationId: submissionResult.correlationId,
      pollUrl: submissionResult.pollUrl,
      error: submissionResult.error,
      xmlData: xmlData // Include for testing/debugging
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/ct600/status/:correlationId', async (req, res) => {
  try {
    const { correlationId } = req.params;
    
    const status = await hmrcCTService.pollSubmissionStatus(correlationId);
    
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/ct600/test-submission', async (req, res) => {
  try {
    const testResult = await hmrcCTService.generateTestSubmission();
    
    res.json({
      message: "Test submission generated",
      ...testResult
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Generate CT600 XML without submitting
router.post('/ct600/generate-xml', async (req, res) => {
  try {
    const { corporationTaxData } = req.body;
    
    if (!corporationTaxData) {
      return res.status(400).json({ message: "Corporation tax data is required" });
    }
    
    const validation = hmrcCTService.validateCT600Data(corporationTaxData);
    if (!validation.valid) {
      return res.status(400).json({ 
        message: "Invalid corporation tax data",
        errors: validation.errors 
      });
    }
    
    const xmlData = await hmrcCTService.generateCT600XML(corporationTaxData);
    
    res.json({
      message: "CT600 XML generated successfully",
      xmlData,
      validation: validation
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;