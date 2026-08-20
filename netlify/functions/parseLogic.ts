import type { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const jsonHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: jsonHeaders,
  body: JSON.stringify(body)
});

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: jsonHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  let problem: unknown;
  try {
    const parsedBody = JSON.parse(event.body || '{}');
    problem = parsedBody?.problem;
  } catch {
    return jsonResponse(400, { error: 'Request body must be valid JSON.' });
  }

  if (typeof problem !== 'string' || !problem.trim()) {
    return jsonResponse(400, { error: 'Missing or invalid "problem" field.' });
  }

  if (!ai) {
    return jsonResponse(500, { error: 'GEMINI_API_KEY is not configured in the server environment.' });
  }

  try {
    const prompt = `You are an expert digital logic assistant. Parse the following word problem into a Boolean logic expression.
The expression may use only these operators: AND, OR, NOT, XOR, XNOR, plus parentheses.
Return between 1 and 6 variables. Every variable name MUST be one uppercase letter from A through F; put the real-world meaning in the variables object.
Return the result strictly as a JSON object with this schema:
{
  "variables": { "A": "Meaning of A", "B": "Meaning of B" },
  "expression": "(A AND B) OR NOT C",
  "explanation": "Brief explanation of how the logic was derived."
}
Only output the JSON object, nothing else.

Problem: ${problem}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(response.text || '{}');
    const variables = parsed?.variables;
    const expression = parsed?.expression;
    const explanation = parsed?.explanation;
    const variableNames = variables && typeof variables === 'object' && !Array.isArray(variables)
      ? Object.keys(variables)
      : [];

    if (
      variableNames.length < 1 ||
      variableNames.length > 6 ||
      variableNames.some(name => !/^[A-F]$/.test(name)) ||
      typeof expression !== 'string' ||
      !expression.trim()
    ) {
      return jsonResponse(502, { error: 'The logic service returned an invalid variable or expression format.' });
    }

    return jsonResponse(200, {
      variables,
      expression: expression.trim(),
      explanation: typeof explanation === 'string' ? explanation : ''
    });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse(500, { error: message || 'Unable to parse the logic problem.' });
  }
};
