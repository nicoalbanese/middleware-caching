import { Redis } from "@upstash/redis";
import type {
  LanguageModelV1,
  Experimental_LanguageModelV1Middleware as LanguageModelV1Middleware,
  LanguageModelV1StreamPart,
} from "ai";
import { simulateReadableStream } from "ai/test";

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_TOKEN,
});

export const cacheMiddleware: LanguageModelV1Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    const cacheKey = JSON.stringify(params);

    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return cached as ReturnType<LanguageModelV1["doGenerate"]>;
    }

    const result = await doGenerate();

    redis.set(cacheKey, { ...result, response: null }); // setting response as null avoids generateText useChat error

    return result;
  },
  wrapStream: async ({ doStream, params }) => {
    const cacheKey = JSON.stringify(params);

    // Check if the result is in the cache
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      // If cached, return a simulated ReadableStream that yields the cached result
      return {
        stream: simulateReadableStream({
          initialDelayInMs: 0,
          chunkDelayInMs: 10,
          chunks: cached as LanguageModelV1StreamPart[],
        }),
        rawCall: { rawPrompt: null, rawSettings: {} },
      };
    }

    // If not cached, proceed with streaming
    const { stream, ...rest } = await doStream();

    const fullResponse: LanguageModelV1StreamPart[] = [];

    const transformStream = new TransformStream<
      LanguageModelV1StreamPart,
      LanguageModelV1StreamPart
    >({
      transform(chunk, controller) {
        fullResponse.push(chunk);
        controller.enqueue(chunk);
      },
      flush() {
        // Store the full response in the cache after streaming is complete
        redis.set(cacheKey, fullResponse);
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
};
