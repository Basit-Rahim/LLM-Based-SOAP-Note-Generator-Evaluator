import { NextRequest, NextResponse } from 'next/server';

type GeneratePayload = {
  transcript?: string;
  reference?: string | null;
  model?: string; // openai or gemini model name
};

const buildPrompt = (transcript: string) => `
You are a clinical documentation specialist. Generate a complete and medically accurate SOAP note based on the transcript below.

### Instructions:
- Produce a structured, concise, and clinically coherent SOAP note.
- Follow the exact SOAP format:
  **S – Subjective**: Patient-reported symptoms, history, and concerns.
  **O – Objective**: Exam findings, vitals, tests, observable/measurable details.
  **A – Assessment**: Diagnoses, differential diagnoses, and clinical reasoning.
  **P – Plan**: Treatment, medications, labs/imaging, follow-up instructions.
- Do NOT hallucinate. Use only information present in the transcript.
- If a reference note is provided, treat it ONLY as stylistic guidance.
- Maintain a professional, medical tone.
- Keep paragraphs short and clear.

### Transcript:
${transcript}

Now produce the final SOAP note.
`;

export async function POST(request: NextRequest) {
  try {
    const { transcript, reference, model }: GeneratePayload =
      await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required.' },
        { status: 400 },
      );
    }

    if (!model) {
      return NextResponse.json(
        { error: 'Model is required.' },
        { status: 400 },
      );
    }

    // 💡 Detect provider
    const provider: 'openai' | 'gemini' =
      model.startsWith('models/gemini') || model.startsWith('gemini')
        ? 'gemini'
        : 'openai';

    const prompt = buildPrompt(transcript);

    // ------------------------------------------------------
    // ✅ GEMINI (FULL FIX — clean model path)
    // ------------------------------------------------------
    if (provider === 'gemini') {
      const geminiKey = process.env.GOOGLE_API_KEY;

      if (!geminiKey) {
        return NextResponse.json(
          { error: 'Missing GOOGLE_API_KEY' },
          { status: 500 },
        );
      }

      // 👉 FIX: remove accidental prefix "models/"
      const cleanModel = model.replace(/^models\//, '');

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${cleanModel}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        },
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('[generate-route:gemini]', {
          status: geminiResponse.status,
          model: cleanModel,
          details: errorText,
        });
        return NextResponse.json(
          { error: 'Gemini request failed', details: errorText },
          { status: geminiResponse.status },
        );
      }

      const data = await geminiResponse.json();
      const content =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text ?? '')
          .join('')
          .trim() || 'Gemini returned no content.';

      return NextResponse.json({
        message: content,
        modelUsed: cleanModel,
      });
    }

    // ------------------------------------------------------
    // ✅ OPENAI
    // ------------------------------------------------------
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return NextResponse.json(
        { error: 'Missing OPENAI_API_KEY' },
        { status: 500 },
      );
    }

    const messages = [
      {
        role: 'system',
        content:
          'You are a medical scribe assistant. Summarize transcripts into SOAP format.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const openAiResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
        }),
      },
    );

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error('[generate-route:openai]', {
        status: openAiResponse.status,
        model,
        details: errorText,
      });
      return NextResponse.json(
        { error: 'OpenAI request failed', details: errorText },
        { status: openAiResponse.status },
      );
    }

    const completion = await openAiResponse.json();
    const content =
      completion?.choices?.[0]?.message?.content?.trim() ||
      'OpenAI returned no content.';

    return NextResponse.json({
      message: content,
      modelUsed: model,
    });
  } catch (err) {
    console.error('[generate-route]', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
