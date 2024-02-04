import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function translateText(chatLog, newChatMessage, originalLang, newLang) {
  const instruction = `Translate the following text from ${originalLang} to ${newLang}:`;
  const prompt = {
    'role': 'system',
    'content': 'You are a helpful assistant that convert chat of one language to another languages.'
  };
  const messages = [
    prompt,
    {
      'role': 'user',
      'content': instruction
    },
    {
      'role': 'user',
      'content': newChatMessage
    }
  ];

  const response = await openai.chat.completions.create({
    'model': 'gpt-3.5-turbo',
    'messages': messages
  });

  console.log(messages);

  const translatedText = response['choices'][0]['message']['content'];
  console.log('Translated text:', translatedText);
  return translatedText;
}

export default async function handler(req, res) {
  const { chatLog, newChatMessage, originalLang, newLang } = req.body;
  try {
    const translatedChat = await translateText(chatLog, newChatMessage, originalLang, newLang);
    res.status(200).json({ translatedChat });
  } catch (e) {
    res.status(200).json({ translatedChat: e.message });
  }
}
