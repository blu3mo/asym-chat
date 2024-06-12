import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function translateText(conversionLog, newChatMessage, originalLang, newLang) {
  if (originalLang === newLang) {
    return newChatMessage;
  }

  console.log(conversionLog);
  if (conversionLog === undefined) {
    conversionLog = {};
  }
  var previousLog = [];
  const originalMessages = conversionLog.find(({ language }) => language === originalLang)?.messages || [];
  const newMessages = conversionLog.find(({ language }) => language === newLang)?.messages || [];
  const maxLength = Math.max(originalMessages.length, newMessages.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < originalMessages.length) {
      const message = originalMessages[i].text;
      previousLog.push({
        'role': 'user',
        'content': message
      });
    }
    if (i < newMessages.length) {
      const [user, message] = newMessages[i].text.split(': ');
      previousLog.push({
        'role': 'assistant',
        'content': message
      });
    }
  }

  previousLog = previousLog.slice(-20);
  
  const messages = [
    {
      'role': 'system',
      'content': `You are a topic translator that convert chat of one topic to another topic. Convert the topic of following text based on the given context (self-intro of sender and receiver)
       # Sender's Self-intro Context:
       ${originalLang}. 
       # Receiver's Self-intro Context:
       ${newLang}
       Keep the sentence structure as much as possible, while also maintaining the consistency of the conversation.`
    },
    // {
    //   'role': 'system',
    //   'content': `Edit the following message to adjust the audience from ${originalLang} to ${newLang}. The goal is to bridge the communication barrier between people with different knowledges.Keep the core message of the text, while adjusting the non-important part to make it more understandable for the audience. Make the language natural.`
    // },
    // {
    //   'role': 'system',
    //   'content': `Edit the following idea to adjust the underlying values to ${newLang}. Do not change the topic and the core of the idea, while making slight changes to the phrasing. Make the language natural.`
    // },
    ...previousLog,
    {
      'role': 'user',
      'content': newChatMessage
    }
  ];

  console.log('Messages:', messages )
  console.log('Previous Log:', previousLog)

  const response = await openai.chat.completions.create({
    'model': 'gpt-4o',
    'messages': messages
  });


  const translatedText = response['choices'][0]['message']['content'];
  console.log('Translated text:', translatedText);
  return translatedText;
}

export default async function handler(req, res) {
  const { conversionLog, newChatMessage, originalLang, newLang } = req.body;
  console.log(req.body);
  console.log('conversionLog:', conversionLog);

  const startTime = Date.now();

  try {
    const translatedChat = await translateText(conversionLog, newChatMessage, originalLang, newLang);
    const elapsedTime = Date.now() - startTime;
    const remainingTime = 1000 - elapsedTime;
    console.log('Remaining time:', remainingTime);

    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }

    res.status(200).json({ translatedChat });
  } catch (e) {
    res.status(200).json({ translatedChat: e.message });
  }
}
