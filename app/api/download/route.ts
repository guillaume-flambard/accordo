import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint for downloading generated PDF contracts
 */
export async function GET(req: NextRequest) {
  try {
    // Get the file name from the URL query parameter
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('file');
    
    if (!filename) {
      return NextResponse.json(
        { error: 'No file specified' },
        { status: 400 }
      );
    }
    
    // Build the file path
    const tempDir = path.join(process.cwd(), 'temp');
    const filePath = path.join(tempDir, filename);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Return the file as a response
    const response = new NextResponse(fileBuffer);
    
    // Set the appropriate headers
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename=${filename}`);
    
    return response;
  } catch (error) {
    console.error('Error serving PDF:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
} 