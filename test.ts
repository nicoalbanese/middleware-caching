import { streamObject } from 'ai';
import 'dotenv/config';
import { z } from 'zod';
import { wrappedModel } from './ai/model';

async function main() {
  const result = streamObject({
    model: wrappedModel,
    schema: z.object({
      characters: z.array(
        z.object({
          name: z.string(),
          class: z
            .string()
            .describe('Character class, e.g. warrior, mage, or thief.'),
          description: z.string(),
        }),
      ),
    }),
    prompt:
      'Generate 3 character descriptions for a fantasy role playing game.',
  });

  for await (const partialObject of result.partialObjectStream) {
    console.clear();
    console.log(partialObject);
  }
}

main().catch(console.error);