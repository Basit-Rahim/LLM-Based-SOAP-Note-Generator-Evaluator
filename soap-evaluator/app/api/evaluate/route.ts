import { NextRequest, NextResponse } from 'next/server';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function rouge1(reference: string, candidate: string): number {
  const refTokens = tokenize(reference);
  const candTokens = tokenize(candidate);
  if (!refTokens.length || !candTokens.length) return 0;

  const refCounts = new Map<string, number>();
  for (const t of refTokens) {
    refCounts.set(t, (refCounts.get(t) || 0) + 1);
  }

  let overlap = 0;
  const candCounts = new Map<string, number>();
  for (const t of candTokens) {
    candCounts.set(t, (candCounts.get(t) || 0) + 1);
  }

  for (const [token, refCount] of refCounts.entries()) {
    const candCount = candCounts.get(token) || 0;
    overlap += Math.min(refCount, candCount);
  }

  const precision = overlap / candTokens.length;
  const recall = overlap / refTokens.length;
  if (precision === 0 && recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

function bleu1(reference: string, candidate: string): number {
  const refTokens = tokenize(reference);
  const candTokens = tokenize(candidate);
  if (!refTokens.length || !candTokens.length) return 0;

  const refCounts = new Map<string, number>();
  for (const t of refTokens) {
    refCounts.set(t, (refCounts.get(t) || 0) + 1);
  }

  let overlap = 0;
  for (const t of candTokens) {
    const count = refCounts.get(t) || 0;
    if (count > 0) {
      overlap += 1;
      refCounts.set(t, count - 1);
    }
  }

  const precision = overlap / candTokens.length;
  const brevityPenalty = Math.exp(Math.min(0, 1 - refTokens.length / candTokens.length));
  return brevityPenalty * precision;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reference: string | undefined = body.reference;
    const candidates: Array<{ id: string; label: string; text: string } | null> = Array.isArray(
      body.candidates,
    )
      ? body.candidates
      : [];

    if (!reference || typeof reference !== 'string') {
      return NextResponse.json({ error: 'Reference text is required.' }, { status: 400 });
    }

    const metrics = candidates
      .filter((c): c is { id: string; label: string; text: string } => !!c && !!c.text)
      .map((candidate) => {
        const r1 = rouge1(reference, candidate.text);
        const b1 = bleu1(reference, candidate.text);
        const combined = (r1 + b1) / 2;
        return {
          id: candidate.id,
          label: candidate.label,
          rouge1: r1,
          bleu1: b1,
          combined,
        };
      });

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('[evaluate]', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
