import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Read request JSON
    const body = await request.json();
    
    // Return thank you message
    return NextResponse.json({ message: 'Thank you' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

