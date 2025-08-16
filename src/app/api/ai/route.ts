import { NextRequest, NextResponse } from 'next/server';
import { translateWord } from '@/ai/flows/translate-word-flow';
import { generateExampleSentence } from '@/ai/flows/generate-example-sentence-flow';
import { generatePhoneticPronunciation } from '@/ai/flows/generate-phonetic-pronunciation-flow';
import { bulkGenerateWordDetails } from '@/ai/flows/bulk-generate-word-details-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'translateWord':
        const translation = await translateWord(params);
        return NextResponse.json({ success: true, data: translation });

      case 'generateExampleSentence':
        const sentence = await generateExampleSentence(params);
        return NextResponse.json({ success: true, data: sentence });

      case 'generatePhoneticPronunciation':
        const pronunciation = await generatePhoneticPronunciation(params);
        return NextResponse.json({ success: true, data: pronunciation });

      case 'bulkGenerateWordDetails':
        const details = await bulkGenerateWordDetails(params);
        return NextResponse.json({ success: true, data: details });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
