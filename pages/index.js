import Head from 'next/head';
import { useState, useEffect } from 'react';
import ChatPane from './components/ChatPane';
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
  const [userAMessages, setUserAMessages] = useState([]);
  const [userBMessages, setUserBMessages] = useState([]);
  const [userAMessage, setUserAMessage] = useState('');
  const [userBMessage, setUserBMessage] = useState('');
  const [userALanguage, setUserALanguage] = useState('コーヒー');
  const [userBLanguage, setUserBLanguage] = useState('建築');

  useEffect(() => {
    // Optionally, you can trigger the popup based on a condition,
    // e.g., only if the languages are not already set in localStorage or similar.
  }, []);

  const handleSaveLanguageSettings = (aLang, bLang) => {
    setUserALanguage(aLang);
    setUserBLanguage(bLang);
    setIsLanguageSelectionPopupOpen(false);
  };

  const sendMessage = async (user, message) => {
    if (message.trim() === '') return;
  
    // Determine the source and target languages based on the user
    const originalLang = user === 'User A' ? userALanguage : userBLanguage;
    const newLang = user === 'User A' ? userBLanguage : userALanguage;
  
    // Call translateMessage only if languages are different
    let translatedMessage = message;
    if (originalLang !== newLang) {
      // Take the last 3 messages and create a *dictionary* of original to translated messages
      const conversionLog = {}
      for (let i = 0; i < userAMessages.length; i++) {
        if (user === 'User A') {
          conversionLog[userAMessages[i].text] = userBMessages[i].text;
        } else {
          conversionLog[userBMessages[i].text] = userAMessages[i].text;
        }
      }

      translatedMessage = await translateMessage(conversionLog, message, originalLang, newLang);
    }
  
    // Construct new message object for User A and User B
    if (user === 'User A') {
      const newMessageA = { text: `${user}: ${message}`, from: user };
      const newMessageB = { text: `${user}: ${translatedMessage}`, from: user };
      setUserAMessages([...userAMessages, newMessageA]);
      setUserBMessages([...userBMessages, newMessageB]);
    } else {
      const newMessageA = { text: `${user}: ${translatedMessage}`, from: user };
      const newMessageB = { text: `${user}: ${message}`, from: user };
      setUserAMessages([...userAMessages, newMessageA]);
      setUserBMessages([...userBMessages, newMessageB]);
    }
  
    // Clear the input field
    if (user === 'User A') {
      setUserAMessage('');
    } else {
      setUserBMessage('');
    }
  };
  

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Head>
        <title>Chat App</title>
      </Head>
      {isLanguageSelectionPopupOpen && (
        <LanguageSelectionPopup
          onSave={handleSaveLanguageSettings}
          initialUserALanguage={userALanguage}
          initialUserBLanguage={userBLanguage}
        />
      )}

      <header className="p-4 bg-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <label htmlFor="userALanguage" className="mr-2 font-bold">User A Topic:</label>
          <span className="px-2 py-1 bg-green-300 rounded text-green-900">{userALanguage}</span>
        </div>
        <div className="flex items-center">
          <label htmlFor="userBLanguage" className="mr-2 font-bold">User B Topic:</label>
          <span className="px-2 py-1 bg-blue-200 rounded text-blue-900">{userBLanguage}</span>
        </div>
      </header>

      <div className="flex flex-1">
        <ChatPane
          title="User A"
          messages={userAMessages}
          message={userAMessage}
          setMessage={setUserAMessage}
          sendMessage={() => sendMessage('User A', userAMessage)}
          buttonColor="bg-green-500 hover:bg-green-700"
        />
        <div className="w-0.5 bg-gray-300"></div>
        <ChatPane
          title="User B"
          messages={userBMessages}
          message={userBMessage}
          setMessage={setUserBMessage}
          sendMessage={() => sendMessage('User B', userBMessage)}
          buttonColor="bg-blue-500 hover:bg-blue-700"
        />
      </div>
    </div>
  );
}
