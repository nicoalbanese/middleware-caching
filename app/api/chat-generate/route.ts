import { wrappedModel } from "@/ai/model";
import { generateText, tool } from "ai";
import { z } from "zod";


export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await generateText({
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
  console.log(result);
  return new Response(result.text);
}
