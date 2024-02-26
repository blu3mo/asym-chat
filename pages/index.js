import Head from 'next/head';
import { useState, useEffect } from 'react';
import ChatPane from './components/ChatPane';
import { useRouter } from 'next/router'; // Step 1: Import useRouter
import LanguageSelectionPopup from './components/LanguageSelectionPopup';

// Updated translateMessage function
const translateMessage = async (conversionLog, newChatMessage, originalLang, newLang) => {
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

export default function Home() {
  const [isLanguageSelectionPopupOpen, setIsLanguageSelectionPopupOpen] = useState(true);
  const [users, setUsers] = useState(Array.from({ length: 2 }, () => ({ messages: [], message: '', language: '' })));
  const [isLoading, setIsLoading] = useState(Array.from({ length: 2 }, () => false));
  const router = useRouter();

  useEffect(() => {
    const query = router.query;
    let updated = false;
    let index = 1;
    let newUsers = [];
    let newLoading = [];
  
    while (query[`topic${index}`]) {
      const language = query[`topic${index}`];
      if (language) {
        updated = true;
        newUsers.push({ messages: [], message: '', language });
        newLoading.push(false);
      }
      index++;
    }
  
    if (updated) {
      setUsers(newUsers);
      setIsLoading(newLoading);
      setIsLanguageSelectionPopupOpen(false);
    }
  }, [router.query]);

  const handleSaveLanguageSettings = (languages) => {
    console.log('languages:', languages);
    const newUsers = languages.map(language => ({ messages: [], message: '', language }));
    setUsers(newUsers);
    setIsLanguageSelectionPopupOpen(false);
  };

  const sendMessage = async (userIndex, message) => {
    if (message.trim() === '') return;
    let newUserState = [...users];
    const newIsLoading = [...isLoading];
    newIsLoading[userIndex] = true; // Start loading
    setIsLoading(newIsLoading);
  
    // Iterate over all users to prepare and send the translated message
    const promises = newUserState.map(async (user, index) => {
      if (index !== userIndex) { // Skip the sender
        const originalLang = newUserState[userIndex].language;
        const targetLang = user.language;
  
        let translatedMessage = message;
        if (originalLang !== targetLang) {
          const conversionLog = {}; // Assume conversionLog logic is adapted for more users
          translatedMessage = await translateMessage(conversionLog, message, originalLang, targetLang);
        }
        return { index, translatedMessage };
      }
      return null;
    });
  
    // Wait for all translations to complete
    const results = await Promise.all(promises);
  
    // Update messages for all users
    results.forEach(result => {
      if (result) {
        newUserState[result.index].messages.push({ text: `User ${userIndex + 1}: ${result.translatedMessage}`, from: `User ${userIndex + 1}` });
      }
    });
  
    // Append the original message to the sender's messages
    newUserState[userIndex].messages.push({ text: `User ${userIndex + 1}: ${message}`, from: `User ${userIndex + 1}` });
    newUserState[userIndex].message = ''; // Clear the sender's message input
  
    setUsers(newUserState);
    newIsLoading[userIndex] = false; // End loading
    setIsLoading(newIsLoading);
  };
  

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Head>
        <title>Chat App</title>
      </Head>
      {isLanguageSelectionPopupOpen && (
        <LanguageSelectionPopup
          onSave={handleSaveLanguageSettings}
          initialLanguages={users.map(user => user.language)}
        />
      )}

      <div className="flex flex-1 overflow-x-auto">
        {users.map((user, index) => (
          <ChatPane
            key={index}
            title={`User ${index + 1}`}
            topic={user.language}
            messages={user.messages}
            message={user.message}
            setMessage={(message) => {
              const newUsers = [...users];
              newUsers[index].message = message;
              setUsers(newUsers);
            }}
            sendMessage={() => sendMessage(index, user.message)}
            userIndex={index}
            isLoading={isLoading[index]}
          />
        ))}
      </div>
    </div>
  );
}