import type { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { problem } = JSON.parse(event.body || '{}');

    if (!problem || typeof problem !== 'string') {
      return { 
        statusCode: 400, 
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing or invalid "problem" field' }) 
      };
    }

    if (!ai) {
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'GEMINI_API_KEY is not configured in server environment.' })
      };
    }

    const prompt = `You are an expert digital logic assistant. Parse the following word problem into a boolean logic expression.
The expression should use standard operators: AND, OR, NOT, XOR.
Variable names must be alphanumeric, max 3 characters, starting with a letter (e.g., A, IN1).
Return the result strictly as a JSON object with this schema:
{
  "variables": { "A": "Meaning of A", "B": "Meaning of B" },
  "expression": "A AND B OR (NOT C)",
  "explanation": "Brief explanation of how the logic was derived."
}
Only output the JSON object, nothing else.

Problem: "${problem}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || '{}';
    
    // Validate that it's valid JSON
    JSON.parse(text);

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: text
    };
  } catch (error: any) {
    console.error(error);
    return { 
      statusCode: 500, 
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || String(error) }) 
    };
  }
};
