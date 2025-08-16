// Client-side helper functions for AI operations
// These functions call the server-side API routes instead of directly importing server functions

export interface TranslateWordInput {
  word: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslateWordOutput {
  translations: string[];
}

export interface GenerateExampleSentenceInput {
  word: string;
  language?: string;
  partOfSpeech?: string;
}

export interface GenerateExampleSentenceOutput {
  exampleSentence: string;
}

export interface GeneratePhoneticPronunciationInput {
  word: string;
  language?: string;
}

export interface GeneratePhoneticPronunciationOutput {
  phoneticPronunciation: string;
}

export interface BulkGenerateWordDetailsInput {
  words: string[];
  sourceLanguage: string;
  targetLanguage: string;
}

export interface BulkGenerateWordDetailsOutput {
  processedWords: Array<{
    text: string;
    exampleSentence: string;
    meaning: string;
  }>;
}

async function callAI<T>(action: string, params: any): Promise<T> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...params }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'AI operation failed');
  }

  return result.data;
}

export async function translateWord(input: TranslateWordInput): Promise<TranslateWordOutput> {
  return callAI<TranslateWordOutput>('translateWord', input);
}

export async function generateExampleSentence(input: GenerateExampleSentenceInput): Promise<GenerateExampleSentenceOutput> {
  return callAI<GenerateExampleSentenceOutput>('generateExampleSentence', input);
}

export async function generatePhoneticPronunciation(input: GeneratePhoneticPronunciationInput): Promise<GeneratePhoneticPronunciationOutput> {
  return callAI<GeneratePhoneticPronunciationOutput>('generatePhoneticPronunciation', input);
}

export async function bulkGenerateWordDetails(input: BulkGenerateWordDetailsInput): Promise<BulkGenerateWordDetailsOutput> {
  return callAI<BulkGenerateWordDetailsOutput>('bulkGenerateWordDetails', input);
}
