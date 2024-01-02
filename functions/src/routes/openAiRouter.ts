import express from "express";
import OpenAI from "openai";
import { config as dotenvConfig } from "dotenv";

// Load environment variables
dotenvConfig();

const openaiRouter = express.Router();

interface AxiosError extends Error {
  response?: {
    data: any;
    status: number;
    headers: any;
  };
  request?: any;
}

export const generateTextWithOpenAI = async (
  prompt: string
): Promise<string> => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("Starting request to openai API...");
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gpt-4",
    });
    if (chatCompletion.choices[0].message.content) {
      return chatCompletion.choices[0].message.content;
    } else {
      return "Error occured somewhere";
    }
  } catch (error) {
    // You can customize the error handling based on your needs
    console.error("Error in generateTextWithOpenAI:", error);
    throw error;
  }
};

// Move the OpenAI client instantiation inside the route handler
openaiRouter.post("/generate-text", async (req, res) => {
  const prompt = req.body.prompt;
  console.log("POST request prompt: ", prompt);
  // Retrieve the API key here
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Instantiate the OpenAI client here
    console.log("Starting request to openai API...");
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gpt-3.5-turbo",
    });

    res.status(200).json(chatCompletion.choices[0].message.content);
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      console.error("Error Data:", axiosError.response.data);
      console.error("Error Status:", axiosError.response.status);
      console.error("Error Headers:", axiosError.response.headers);
      res
        .status(500)
        .send("Error generating text: " + axiosError.response.data);
    } else {
      // Handle non-Axios errors
      console.error("Error:", error);
      res.status(500).send("Error generating text");
    }
  }
});

export default openaiRouter;
