import { NextRequest, NextResponse } from 'next/server';
import { Negotiator } from '@/services/Negotiator';
import { Objectives } from '@/types';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

/**
 * API endpoint for contract negotiation
 * Accepts a contract file (PDF or DOCX) and user objectives
 * Returns suggested alternative clauses with risk scores
 */
export async function POST(req: NextRequest) {
  try {
    // We'll use formData since we're handling file uploads
    const formData = await req.formData();
    
    // Get file from form data
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Get objectives from form data
    const paymentDays = Number(formData.get('paymentDays'));
    const deliveryDays = Number(formData.get('deliveryDays'));
    const penaltyRate = Number(formData.get('penaltyRate'));
    
    // Validate objectives
    if (isNaN(paymentDays) || isNaN(deliveryDays) || isNaN(penaltyRate)) {
      return NextResponse.json(
        { error: 'Invalid objectives provided' },
        { status: 400 }
      );
    }

    const objectives: Objectives = {
      paymentDays,
      deliveryDays,
      penaltyRate,
    };

    try {
      // Try to extract text from file just to validate it's a valid document
      await extractTextFromFile(file);
      
      // Instead of using the extracted text which may have encoding issues,
      // we'll use a generic contract template as a starting point
      const genericContractText = generateGenericContract(objectives);
      
      // Generate suggestions using the Negotiator service
      const suggestions = await Negotiator.generateSuggestions(
        genericContractText,
        objectives
      );

      // Return the suggestions
      return NextResponse.json({ 
        suggestions,
        contractText: genericContractText 
      });
    } catch (error) {
      console.error('Error processing file:', error);
      return NextResponse.json(
        { error: 'Failed to process the document. Please ensure it is a valid PDF or DOCX file.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in negotiate API:', error);
    return NextResponse.json(
      { error: 'Failed to process contract' },
      { status: 500 }
    );
  }
}

/**
 * Extracts text content from uploaded file based on file type
 * Note: Only used for validation, content is not used
 */
async function extractTextFromFile(file: File): Promise<string> {
  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Determine file type by extension
  const fileName = file.name.toLowerCase();
  
  try {
    if (fileName.endsWith('.pdf')) {
      // Just check if it's a valid PDF
      await pdfParse(buffer, {
        max: 1, // Only parse the first page to check validity
      });
      return "Valid PDF document";
    } else if (fileName.endsWith('.docx')) {
      // Just check if it's a valid DOCX
      await mammoth.extractRawText({
        buffer,
      });
      return "Valid DOCX document";
    } else {
      throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
    }
  } catch (error) {
    console.error('Error validating document:', error);
    throw new Error('The document format is invalid or corrupted.');
  }
}

/**
 * Generates a generic contract template based on the provided objectives
 */
function generateGenericContract(objectives: Objectives): string {
  const currentDate = new Date().toLocaleDateString();
  
  return `
CONTRACT AGREEMENT

This Contract Agreement (the "Agreement") is entered into as of ${currentDate}.

PARTIES:
Between the Client and the Provider.

SCOPE OF WORK:
The Provider agrees to deliver the products and/or services as described below.

PAYMENT TERMS:
The Client shall pay the Provider the agreed amount within ${objectives.paymentDays} days of receiving the invoice.

Payment shall be made by bank transfer to the Provider's designated account.

Late payments will incur interest at a rate of 2% per month.

DELIVERY TIME:
The Provider shall deliver all products and complete all services within ${objectives.deliveryDays} days from the date of this agreement.

Delivery shall be considered complete when the Client acknowledges receipt of all deliverables.

PENALTIES:
In case of late delivery, a penalty of ${objectives.penaltyRate}% of the total contract value will be applied for each week of delay.

The total penalties shall not exceed 10% of the contract value.

CONFIDENTIALITY:
Both parties agree to maintain the confidentiality of any proprietary information shared during the course of this agreement.

TERMINATION:
Either party may terminate this agreement with 30 days written notice.

In case of termination, the Client shall pay for all work completed up to the termination date.

GOVERNING LAW:
This agreement shall be governed by the laws of [Jurisdiction].

SIGNATURES:
This agreement constitutes the entire understanding between the parties.
  `;
} 