import { Request, Response } from "express";
import OpenAI from "openai";
import Groq from "groq-sdk";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateAIResponses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // const { input } = req.body;

    // if (!input) {
    //     res.status(400).json({ error: 'Input is required' });
    //     return;
    // }

    // const completion = await openai.chat.completions.create({
    //     model: "gpt-3.5-turbo",
    //     messages: [{ role: "user", content: input }],
    // });

    // res.status(200).json({
    //     success: true,
    //     data: completion.choices[0].message.content,
    // });
    const groq = new Groq({apiKey:process.env.GROQ_API_KEY});
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content:
            "Can you give code for recurssion c++",
        },
      ],
    });
     res.status(200).json({
        success: true,
        data: completion.choices[0].message?.content,
    });
    // console.log(completion.choices[0]?.message?.content);
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    res.status(500).json({
      success: false, 
      error: error.message || "Error processing your request",
    });
  }
};
