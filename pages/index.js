import Head from 'next/head';
import { useState, useEffect } from 'react';
import ChatPane from './components/ChatPane';
import { useRouter } from 'next/router';
import LanguageSelectionPopup from './components/LanguageSelectionPopup';
import { translateMessage } from '../utils/translateMessage';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import Script from 'next/script';
import GazeManager from './GazeManager';

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
  const [onlySendFrom, setOnlySendFrom] = useState(null);
  const [onlyShow, setOnlyShow] = useState(null);
  const router = useRouter();


  const fetchInitialConversations = async () => {
    if (roomId) {
      let { data: languagesData, error: languagesError } = await supabase
        .from('languages')
        .select('conversation_index, language')
        .eq('room_id', roomId);

      if (languagesError) {
        console.error('Error fetching languages:', languagesError);
      } else {
        if (languagesData.length === 0) {
          languagesData = ["Lang1", "Lang2"].map((language, index) => ({
            conversation_index: index,
            language
          }));
          const { error } = await supabase.from('languages').insert(
            languagesData.map((languageData) => ({
              ...languageData,
              room_id: roomId,
            }))
          );
        }

        const initialConversations = languagesData.map((languageData) => ({
          messages: [],
          language: languageData.language,
        }));

        setConversations(initialConversations);
        setIsLoading(new Array(initialConversations.length).fill(false));
        setMessageInputs(new Array(initialConversations.length).fill(''));
      }

      // Fetch initial messages for the room
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('conversation_index, message, from_user')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching initial conversations:', messagesError);
      } else {
        const initialMessages = messagesData.reduce((acc, message) => {
          if (!acc[message.conversation_index]) {
            acc[message.conversation_index] = [];
          }
          acc[message.conversation_index].push({
            text: `${message.from_user}: ${message.message}`,
            from: message.from_user,
          });
          return acc;
        }, []);

        setConversations((prevConversations) => {
          return prevConversations.map((conv, index) => ({
            ...conv,
            messages: initialMessages[index] || [],
          }));
        });
      }
    }
  };

  useEffect(() => {
    console.log('router.query:', router.query);

    const { roomId: queryRoomId, userName: queryUserName, onlySendFrom, onlyShow } = router.query;

    if (queryRoomId) {
      console.log('Room ID found in URL:', queryRoomId);
      setRoomId(queryRoomId);
    } else {
      console.log('No room ID found in URL');
    }

    if (queryUserName) {
      setUserName(queryUserName);
    } else {
      setUserName('User');
    }

    setOnlySendFrom(onlySendFrom ? parseInt(onlySendFrom) : null);
    setOnlyShow(onlyShow ? parseInt(onlyShow) : null);
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
            // console.log('Change received!', payload);
            const newMessage = payload.new;
            if (newMessage.room_id === roomId) { // Check if the message belongs to the current room              
              // なぜか↓だと何度もメッセージが追加される。理由がわからないので一旦別の実装で対処
              // setConversations((prevConversations) => {
              //   const updatedConversations = [...prevConversations];
              //   updatedConversations[newMessage.conversation_index].messages.push({
              //     text: `${newMessage.from_user}: ${newMessage.message}`,
              //     from: newMessage.from_user,
              //   });
              //   return updatedConversations;
              // });
              fetchInitialConversations();
            }
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
        const conversionLog = conversations;
          console.log('conversionLog:', conversionLog);
          translatedMessage = await translateMessage(conversionLog, message, originalLang, targetLang);
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
              console.log('setmsg 1', messageInputs);
              setMessageInputs(newInputs => {
                console.log('setmsg 2', newInputs, conversationIndex);
                newInputs[conversationIndex] = '';
                return newInputs;
              }
              );
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
    <div className="flex flex-col h-screen bg-gray-100">
      <Head>
        <title>Asymmetric Chat</title>
      </Head>
      <GazeManager roomId={roomId} userName={userName} />
      {roomId ? (
        <>
          <div className="text-sm text-gray-500 p-2 pb-0 pl-3">
            Room ID: {roomId} | Username: {userName}
          </div>
          <div className="flex-1 overflow-auto">
            <div className="flex h-full justify-between">
              {conversations.map((conv, index) => (
                <ChatPane
                  key={index}
                  title={`User ${index + 1}`}
                  topic={conv.language}
                  messages={conv.messages}
                  messageInput={messageInputs[index]}
                  setMessage={(message) => {
                    setMessageInputs((prevInputs) => {
                      const newInputs = [...prevInputs];
                      newInputs[index] = message;
                      return newInputs;
                    });
                  }}
                  sendMessage={() => sendMessage(index, messageInputs[index])}
                  conversationIndex={index}
                  selfUsername={userName}
                  isLoading={isLoading[index]}
                  hideInput={onlySendFrom !== null && onlySendFrom !== index}
                  hideConversation={onlyShow !== null && onlyShow !== index}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <></>
        // <AdminDashboard />
      )}
    </div >
  );
}