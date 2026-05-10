import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL = 'gemini-2.5-flash-lite';
const API_VERSION = 'v1';

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error('GEMINI_API_KEY is not configured on the server.');
    err.statusCode = 503;
    throw err;
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

export { MODEL, API_VERSION };
export default getClient;
