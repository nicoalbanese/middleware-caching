import { cacheMiddleware } from "@/ai/middleware";
import { openai } from "@ai-sdk/openai";
import {
  experimental_wrapLanguageModel as wrapLanguageModel,
  streamText,
  tool,
} from "ai";
import { z } from "zod";

const wrappedModel = wrapLanguageModel({
  model: openai("gpt-4o-mini"),
  middleware: cacheMiddleware,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: wrappedModel,
    messages,
    tools: {
      weather: tool({
        description: "Get the weather in a location",
        parameters: z.object({
          location: z.string().describe("The location to get the weather for"),
        }),
        execute: async ({ location }) => ({
          location,
          temperature: 72 + Math.floor(Math.random() * 21) - 10,
        }),
      }),
    },
  });
  return result.toDataStreamResponse();
}
