
'use server';
/**
 * @fileOverview Generates details (example sentence, translation) for a list of words in bulk.
 *
 * - bulkGenerateWordDetails - A function that calls the AI flow to process a list of words.
 * - BulkGenerateWordDetailsInput - The input type for the function.
 * - BulkGenerateWordDetailsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessedWordSchema = z.object({
  text: z.string().describe('The original word that was processed.'),
  exampleSentence: z.string().describe('A clear example sentence using the word.'),
  meaning: z.string().describe('The translation of the word into the target language.'),
});

const BulkGenerateWordDetailsInputSchema = z.object({
  words: z.array(z.string()).describe('An array of words to process.'),
  sourceLanguage: z.string().describe('The source language of the words (e.g., "English").'),
  targetLanguage: z.string().describe('The language to translate the words into (e.g., "Turkish").'),
});
export type BulkGenerateWordDetailsInput = z.infer<typeof BulkGenerateWordDetailsInputSchema>;

const BulkGenerateWordDetailsOutputSchema = z.object({
  processedWords: z.array(ProcessedWordSchema).describe('An array of processed words with their details.'),
});
export type BulkGenerateWordDetailsOutput = z.infer<typeof BulkGenerateWordDetailsOutputSchema>;

export async function bulkGenerateWordDetails(input: BulkGenerateWordDetailsInput): Promise<BulkGenerateWordDetailsOutput> {
  return bulkGenerateWordDetailsFlow(input);
}

const bulkPrompt = ai.definePrompt({
  name: 'bulkGenerateWordDetailsPrompt',
  input: {schema: BulkGenerateWordDetailsInputSchema},
  output: {schema: BulkGenerateWordDetailsOutputSchema},
  prompt: `You are an expert linguist and translator. Your task is to process a list of words.
  For each word in the input array '{{words}}', you must perform two actions:
  1. Create a concise and natural-sounding example sentence that clearly demonstrates the word's meaning. The source language is {{{sourceLanguage}}}.
  2. Translate the word into {{{targetLanguage}}}. Provide the most common and relevant translation.

  The input words are: {{#each words}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.

  You must return the result as a JSON object containing a single key "processedWords".
  This key should hold an array of objects, where each object represents a word and has the following structure:
  - "text": The original word.
  - "exampleSentence": The generated example sentence.
  - "meaning": The translation of the word.

  For example, if the input is words: ["ephemeral", "ubiquitous"], sourceLanguage: "English", targetLanguage: "Turkish", the output should be:
  {
    "processedWords": [
      {
        "text": "ephemeral",
        "exampleSentence": "The beauty of the cherry blossoms is ephemeral, lasting only for a short time each spring.",
        "meaning": "geçici"
      },
      {
        "text": "ubiquitous",
        "exampleSentence": "Smartphones have become ubiquitous in modern society, seen in the hands of people everywhere.",
        "meaning": "yaygın"
      }
    ]
  }

  Return only the JSON object. Do not include any other text or explanations.`,
});

const bulkGenerateWordDetailsFlow = ai.defineFlow(
  {
    name: 'bulkGenerateWordDetailsFlow',
    inputSchema: BulkGenerateWordDetailsInputSchema,
    outputSchema: BulkGenerateWordDetailsOutputSchema,
  },
  async (input) => {
    const {output} = await bulkPrompt(input);
    if (!output || !output.processedWords) {
      throw new Error('Failed to generate word details from the AI.');
    }
    return output;
  }
);
