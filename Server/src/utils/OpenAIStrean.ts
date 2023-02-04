import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";
import axios from "axios";
import express, { Express, NextFunction, Request, Response } from 'express';


export interface OpenAIStreamPayload {
  model: string;
  prompt: string;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number;
  stream: boolean;
  n: number;
}

const payload: OpenAIStreamPayload = {
  model: "text-davinci-003",
  prompt: "tell me a joke",
  temperature: 0.7,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  max_tokens: 600,
  stream: true,
  n: 1,
};

export const openAiStream = async (response: Response, prompt = 'tell me a joke') => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing env var from OpenAI");
  }

  const promtToCall = { ...payload, prompt }
  const res = await axios("https://api.openai.com/v1/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
    },
    method: "POST",
    data: JSON.stringify(promtToCall),
    responseType: 'stream',
  });
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let counter = 0;
  // return res;
  const stream = new ReadableStream({
    async start(controller) {
      // callback

      function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === "event") {
          const data = event.data;
          // https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
          if (data === "[DONE]") {
            controller.close();
            response.end();
            return;
          }
          try {
            const json = JSON.parse(data);
            const text = json.choices[0].text;
            if (counter < 2 && (text.match(/\n/) || []).length) {
              // this is a prefix character (i.e., "\n\n"), do nothing
              return;
            }
            response.write(text);
            const queue = encoder.encode(text);
            controller.enqueue(queue);
            counter++;
          } catch (e) {
            // maybe parse error
            controller.error(e);
          }
        }
      }
      // stream response (SSE) from OpenAI may be fragmented into multiple chunks
      // this ensures we properly read chunks and invoke an event for each SSE event stream
      const parser = createParser(onParse);
      // https://web.dev/streams/#asynchronous-iteration
      for await (const chunk of res.data as any) {
        parser.feed(decoder.decode(chunk));
      }

    }
  });
  return stream;
}