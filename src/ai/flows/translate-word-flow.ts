
'use server';
/**
 * @fileOverview Translates a word from a source language to a target language.
 *
 * - translateWord - A function that calls the AI flow to translate a word.
 * - TranslateWordInput - The input type for the translateWord function.
 * - TranslateWordOutput - The return type for the translateWord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateWordInputSchema = z.object({
  word: z.string().describe('The word to translate.'),
  sourceLanguage: z.string().describe('The language of the word to be translated (e.g., "English").'),
  targetLanguage: z.string().describe('The language to translate the word into (e.g., "Turkish").'),
});
export type TranslateWordInput = z.infer<typeof TranslateWordInputSchema>;

const TranslateWordOutputSchema = z.object({
  translations: z.array(z.string()).describe('An array of possible translations for the word.'),
});
export type TranslateWordOutput = z.infer<typeof TranslateWordOutputSchema>;

export async function translateWord(input: TranslateWordInput): Promise<TranslateWordOutput> {
  return translateWordFlow(input);
}

const translatePrompt = ai.definePrompt({
  name: 'translateWordPrompt',
  input: {schema: TranslateWordInputSchema},
  output: {schema: TranslateWordOutputSchema},
  prompt: `You are an expert translator. Translate the word '{{{word}}}' from {{{sourceLanguage}}} to {{{targetLanguage}}}. 
  
  Provide a few of the most common and relevant meanings. Return your answer as a JSON object with a 'translations' field, which is an array of strings. 
  
  For example, if translating 'run' from English to Turkish, a good response would be: {"translations": ["koşmak", "çalıştırmak", "yönetmek", "akmak"]}.
  
  Only return the JSON object.`,
});

const translateWordFlow = ai.defineFlow(
  {
    name: 'translateWordFlow',
    inputSchema: TranslateWordInputSchema,
    outputSchema: TranslateWordOutputSchema,
  },
  async (input) => {
    const {output} = await translatePrompt(input);
    if (!output) {
      throw new Error('Failed to get a translation from the AI.');
    }
    return output;
  }
);
