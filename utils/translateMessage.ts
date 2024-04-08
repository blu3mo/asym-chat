export const translateMessage = async (conversionLog, newChatMessage, originalLang, newLang) => {
  try {
    console.log(JSON.stringify({
      conversionLog,
      newChatMessage,
      originalLang,
      newLang,
    }))
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversionLog,
        newChatMessage,
        originalLang,
        newLang,
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.translatedChat;
  } catch (error) {
    console.error('Error translating message:', error);
    return newChatMessage; // Fallback to the original message in case of an error
  }
};