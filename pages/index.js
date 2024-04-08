import Head from 'next/head';
import { useState, useEffect } from 'react';
import ChatPane from './components/ChatPane';
import { useRouter } from 'next/router';
import LanguageSelectionPopup from './components/LanguageSelectionPopup';
import { translateMessage } from './utils/translateMessage';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';


require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_API_KEY
);

export default function Home() {
  const [isLanguageSelectionPopupOpen, setIsLanguageSelectionPopupOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState([]);
  const [messageInputs, setMessageInputs] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const router = useRouter();

  const fetchInitialConversations = async () => {
    if (roomId) {
      const { data, error } = await supabase
        .from('messages')
        .select('conversation_index, message, from_user')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching initial conversations:', error);
      } else {
        const initialConversations = data.reduce((acc, message) => {
          if (!acc[message.conversation_index]) {
            acc[message.conversation_index] = {
              messages: [],
              language: '', // You can set the appropriate language here if available in the database
            };
          }
          acc[message.conversation_index].messages.push({
            text: `${message.from_user}: ${message.message}`,
            from: message.from_user,
          });
          return acc;
        }, []);

        setConversations(initialConversations);
        console.log('setconv 1', initialConversations);
        setIsLoading(new Array(initialConversations.length).fill(false));
        setMessageInputs(new Array(initialConversations.length).fill(''));
      }
    }
  };

  useEffect(() => {
    console.log('router.query:', router.query);

    const { roomId: queryRoomId, userName: queryUserName } = router.query;

    if (queryRoomId) {
      console.log('Room ID found in URL:', queryRoomId);
      setRoomId(queryRoomId);
    } else {
      console.log('No room ID found in URL');
      // const generatedRoomId = uuidv4();
      // //setRoomId(generatedRoomId);
      // router.push(`/?roomId=${generatedRoomId}&userName=${queryUserName || 'User'}`);
    }

    if (queryUserName) {
      setUserName(queryUserName);
    } else {
      setUserName('User');
    }
  }, [router.query]);

  useEffect(() => {
    if (roomId) {
      fetchInitialConversations();
      const messagesChannel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            console.log('Change received!', payload);
            const newMessage = payload.new;
            setConversations((prevConversations) => {
              const updatedConversations = [...prevConversations];
              updatedConversations[newMessage.conversation_index].messages.push({
                text: `${newMessage.from_user}: ${newMessage.message}`,
                from: newMessage.from_user,
              });
              return updatedConversations;
              console.log('setconv 2', updatedConversations);
            });
          }
        )
        .subscribe();
  
      return () => {
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [roomId]);

  const handleSaveLanguageSettings = (languages) => {
    const newConversations = languages.map(language => ({ messages: [], messageInput: '', language }));
    //setConversations(newConversations);
    setIsLanguageSelectionPopupOpen(false);
  };

  const sendMessage = async (conversationIndex, message) => {
    if (message.trim() === '') return;
  
    const newIsLoading = [...isLoading];
    newIsLoading[conversationIndex] = true;
    setIsLoading(newIsLoading);
  
    const promises = conversations.map(async (conversation, index) => {
      if (index !== conversationIndex) {
        const originalLang = conversations[conversationIndex].language;
        const targetLang = conversation.language;
  
        let translatedMessage = message;
        if (originalLang !== targetLang) {
          const conversionLog = {};
          translatedMessage = await translateMessage(conversionLog, message, originalLang, targetLang);
        }
        return { index, translatedMessage };
      }
      return null;
    });
  
    const results = await Promise.all(promises);
  
    results.forEach(result => {
      if (result) {
        const { index, translatedMessage } = result;
        supabase
          .from('messages')
          .insert({
            room_id: roomId,
            conversation_index: index,
            message: translatedMessage,
            from_user: userName,
          })
          .then(({ error }) => {
            if (error) {
              console.error('Error inserting message:', error);
            } else {
              console.log('Message inserted successfully');
              setIsLoading(newIsLoading => {
                newIsLoading[conversationIndex] = false;
                return newIsLoading;
              });
            }
          });
      }
    });
  
    supabase
      .from('messages')
      .insert({
        room_id: roomId,
        conversation_index: conversationIndex,
        message: message,
        from_user: userName,
      })
      .then(({ error }) => {
        if (error) {
          console.error('Error inserting message:', error);
          newIsLoading[conversationIndex] = false;
          setIsLoading(newIsLoading);
        } else {
          newIsLoading[conversationIndex] = false;
          setIsLoading(newIsLoading);
        }
      });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Head>
        <title>Chat App</title>
      </Head>
      {isLanguageSelectionPopupOpen && (
        <LanguageSelectionPopup
          onSave={handleSaveLanguageSettings}
          initialLanguages={conversations.map(conv => conv.language)}
        />
      )}

      <div className="flex flex-1 overflow-x-auto">
        {conversations.map((conv, index) => (
          <ChatPane
            key={index}
            title={`User ${index + 1}`}
            topic={conv.language}
            messages={conv.messages}
            messageInput={conv.messageInput}
            setMessage={(message) => {
              setMessageInputs((prevInputs) => {
                const newInputs = [...prevInputs];
                newInputs[index] = message;
                return newInputs;
              }
            )}}
            sendMessage={() => sendMessage(index, messageInputs[index])}
            conversationIndex={index}
            selfUsername={userName}
            isLoading={isLoading[index]}
          />
        ))}
      </div>

      <div className="text-sm text-gray-500 p-2">
        Room ID: {roomId} | Username: {userName}
      </div>
    </div>
  );
}