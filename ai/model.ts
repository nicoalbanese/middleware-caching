import { openai } from "@ai-sdk/openai";
import { cacheMiddleware } from "./middleware";
import { experimental_wrapLanguageModel } from "ai";

export const wrappedModel = experimental_wrapLanguageModel({
  model: openai("gpt-4o-mini"),
  middleware: cacheMiddleware,
});