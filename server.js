// server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 5500;

// Middleware to handle JSON requests
app.use(express.json());
app.use(cors());  // Enable CORS to allow requests from frontend

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Endpoint to handle chat requests
app.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const major = "Computer Science";
    const requirement = "upper-division elective requirements";
    const classTimePreference = "morning classes, ideally between 9 AM and noon";
    const courseInterests = ["machine learning", "software development"];

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-2024-08-06",
            messages: [
                { role: "system", 
                    content: "You are a campus and academic advisor for Arizona State University. Your role is to assist students with course recommendations, class schedules, and professor suggestions based on their preferences. You can also suggest Google searches related to ASU and include relevant links in your responses. Provide ratings for professors using resources like Rate My Professors. Include links to ASU Class Search and other ASU class-related websites for additional information. Also, provide relevant Reddit links from subreddits like r/ASU regarding class topics. Do not answer unrelated questions, such as how to bake a chocolate cake." 
                
                },
                {
                    role: "user",
                    content: message
                },
            ],
        });

        const gptMessage = response.choices[0].message.content;
        res.json({ message: gptMessage });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
