"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIResponses = void 0;
const openai_1 = __importDefault(require("openai"));
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const generateAIResponses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const groq = new groq_sdk_1.default({ apiKey: process.env.GROQ_API_KEY });
        const completion = yield groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: "Can you give code for recurssion c++",
                },
            ],
        });
        res.status(200).json({
            success: true,
            data: (_a = completion.choices[0].message) === null || _a === void 0 ? void 0 : _a.content,
        });
        // console.log(completion.choices[0]?.message?.content);
    }
    catch (error) {
        console.error("OpenAI API error:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Error processing your request",
        });
    }
});
exports.generateAIResponses = generateAIResponses;
