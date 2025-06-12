'use server';
/**
 * @fileOverview Generates an example sentence for a given word using an AI model.
 *
 * - generateExampleSentence - A function that calls the AI flow to generate an example sentence.
 * - GenerateExampleSentenceInput - The input type for the generateExampleSentence function.
 * - GenerateExampleSentenceOutput - The return type for the generateExampleSentence function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateExampleSentenceInputSchema = z.object({
  word: z.string().describe('The word for which to generate an example sentence.'),
});
export type GenerateExampleSentenceInput = z.infer<typeof GenerateExampleSentenceInputSchema>;

export const GenerateExampleSentenceOutputSchema = z.object({
  exampleSentence: z.string().describe('The generated example sentence.'),
});
export type GenerateExampleSentenceOutput = z.infer<typeof GenerateExampleSentenceOutputSchema>;

export async function generateExampleSentence(input: GenerateExampleSentenceInput): Promise<GenerateExampleSentenceOutput> {
  return generateExampleSentenceFlow(input);
}

const sentencePrompt = ai.definePrompt({
  name: 'generateExampleSentencePrompt',
  input: {schema: GenerateExampleSentenceInputSchema},
  output: {schema: GenerateExampleSentenceOutputSchema},
  prompt: `You are a helpful assistant. Given the word '{{{word}}}', generate a concise and clear example sentence that demonstrates its meaning and usage. The sentence should be grammatically correct, natural-sounding, and appropriate for someone learning English. Do not use the input word as a placeholder like '[word]'; use the actual word '{{{word}}}' in the sentence.`,
});

const generateExampleSentenceFlow = ai.defineFlow(
  {
    name: 'generateExampleSentenceFlow',
    inputSchema: GenerateExampleSentenceInputSchema,
    outputSchema: GenerateExampleSentenceOutputSchema,
  },
  async (input) => {
    const {output} = await sentencePrompt(input);
    if (!output) {
      throw new Error('Failed to generate example sentence.');
    }
    return output;
  }
);
