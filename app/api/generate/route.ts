import { NextRequest, NextResponse } from 'next/server';
import { PDFBuilder } from '@/services/PDFBuilder';
import { ClauseField } from '@/types';

/**
 * API endpoint for generating final contract with selected clauses
 */
export async function POST(req: NextRequest) {
  try {
    // Parse JSON body from request
    const body = await req.json();
    
    // Extract contract text and selected clauses
    const { contractText, selectedClauses } = body;
    
    // Validate request data
    if (!contractText) {
      return NextResponse.json(
        { error: 'Contract text is required' },
        { status: 400 }
      );
    }
    
    if (!selectedClauses || typeof selectedClauses !== 'object') {
      return NextResponse.json(
        { error: 'Selected clauses are required' },
        { status: 400 }
      );
    }
    
    // Validate that we have selections for each clause type
    const requiredFields: ClauseField[] = ['payment', 'delivery', 'penalty'];
    const missingFields = requiredFields.filter(field => !selectedClauses[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing selected clauses: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Generate PDF with selected clauses
    const pdfUrl = await PDFBuilder.generatePDF(contractText, selectedClauses);
    
    // Return the URL for downloading the generated PDF
    return NextResponse.json({ pdfUrl });
  } catch (error) {
    console.error('Error generating contract:', error);
    return NextResponse.json(
      { error: 'Failed to generate contract' },
      { status: 500 }
    );
  }
} 