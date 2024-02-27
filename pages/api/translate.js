import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function translateText(conversionLog, newChatMessage, originalLang, newLang) {
  console.log(conversionLog);
  if (conversionLog === undefined) {
    conversionLog = {};
  }
  const previousLog = []
  Object.entries(conversionLog).forEach(([original, converted]) => {
    previousLog.push({
      'role': 'user',
      'content': original
    })
    previousLog.push({
      'role': 'assistant',
      'content': converted
    });
  });
  
  const messages = [
    {
      'role': 'system',
      'content': `You are a topic translator that convert chat of one topic to another topic. Convert the topic of following text from ${originalLang} to ${newLang}. Keep the sentence structure as much as possible, while also maintaining the consistency of the conversation.`
    },
    // {
    //   'role': 'system',
    //   'content': `Edit the following message to adjust the audience from ${originalLang} to ${newLang}. The goal is to bridge the communication barrier between people with different knowledges.Keep the core message of the text, while adjusting the non-important part to make it more understandable for the audience. Make the language natural.`
    // },
    {
      'role': 'system',
      'content': `Edit the following idea to adjust the underlying values to ${newLang}. Do not change the topic and the core of the idea, while making slight changes to the phrasing. Make the language natural.`
    },
    ...previousLog,
    {
      'role': 'user',
      'content': newChatMessage
    }
  ];

  console.log('Messages:', messages )

  const response = await openai.chat.completions.create({
    'model': 'gpt-4',
    'messages': messages
  });

  console.log(conversionLog);
  console.log(messages);

  const translatedText = response['choices'][0]['message']['content'];
  console.log('Translated text:', translatedText);
  return translatedText;
}

export default async function handler(req, res) {
  const { conversionLog, newChatMessage, originalLang, newLang } = req.body;
  console.log(req.body)
  console.log('conversionLog:', conversionLog);
  try {
    const translatedChat = await translateText(conversionLog, newChatMessage, originalLang, newLang);
    res.status(200).json({ translatedChat });
  } catch (e) {
    res.status(200).json({ translatedChat: e.message });
  }
}
