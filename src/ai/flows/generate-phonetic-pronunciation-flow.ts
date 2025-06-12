
'use server';
/**
 * @fileOverview Generates a phonetic pronunciation for a given word using an AI model.
 *
 * - generatePhoneticPronunciation - A function that calls the AI flow to generate phonetic pronunciation.
 * - GeneratePhoneticPronunciationInput - The input type for the generatePhoneticPronunciation function.
 * - GeneratePhoneticPronunciationOutput - The return type for the generatePhoneticPronunciation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePhoneticPronunciationInputSchema = z.object({
  word: z.string().describe('The word for which to generate phonetic pronunciation.'),
});
export type GeneratePhoneticPronunciationInput = z.infer<typeof GeneratePhoneticPronunciationInputSchema>;

const GeneratePhoneticPronunciationOutputSchema = z.object({
  phoneticPronunciation: z.string().describe('The generated phonetic pronunciation (IPA).'),
});
export type GeneratePhoneticPronunciationOutput = z.infer<typeof GeneratePhoneticPronunciationOutputSchema>;

export async function generatePhoneticPronunciation(input: GeneratePhoneticPronunciationInput): Promise<GeneratePhoneticPronunciationOutput> {
  return generatePhoneticPronunciationFlow(input);
}

const pronunciationPrompt = ai.definePrompt({
  name: 'generatePhoneticPronunciationPrompt',
  input: {schema: GeneratePhoneticPronunciationInputSchema},
  output: {schema: GeneratePhoneticPronunciationOutputSchema},
  prompt: `You are a helpful assistant. Given the English word '{{{word}}}', provide its International Phonetic Alphabet (IPA) transcription. For example, for 'hello', you should provide '/həˈloʊ/'. Return only the IPA string.`,
});

const generatePhoneticPronunciationFlow = ai.defineFlow(
  {
    name: 'generatePhoneticPronunciationFlow',
    inputSchema: GeneratePhoneticPronunciationInputSchema,
    outputSchema: GeneratePhoneticPronunciationOutputSchema,
  },
  async (input) => {
    const {output} = await pronunciationPrompt(input);
    if (!output) {
      throw new Error('Failed to generate phonetic pronunciation.');
    }
    return output;
  }
);
