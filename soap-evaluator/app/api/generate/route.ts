import { NextRequest, NextResponse } from 'next/server';

type GeneratePayload = {
  transcript?: string;
  reference?: string | null;
  model?: string;
};

export async function POST(request: NextRequest) {
  try {
    const { transcript, reference, model }: GeneratePayload = await request.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required.' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: 'Thank you',
      model,
      referenceIncluded: Boolean(reference),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

