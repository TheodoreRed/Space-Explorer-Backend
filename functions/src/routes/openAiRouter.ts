import express from "express";
import * as functions from "firebase-functions";
import OpenAI from "openai";

const openaiRouter = express.Router();

// Move the OpenAI client instantiation inside the route handler
openaiRouter.post("/generate-text", async (req, res) => {
  const prompt = req.body.prompt;

  // Retrieve the API key here
  const openaiApiKey = functions.config().openai.key;

  try {
    // Instantiate the OpenAI client here
    const openai = new OpenAI(openaiApiKey);

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
    console.error("Error with OpenAI:", error);
    res.status(500).send("Error generating text");
  }
});

export default openaiRouter;
