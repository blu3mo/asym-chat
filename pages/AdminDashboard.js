import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_API_KEY
);

const AdminDashboard = () => {
  const [languages, setLanguages] = useState(['']);
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');

  const handleLanguageChange = (index, language) => {
    const newLanguages = [...languages];
    newLanguages[index] = language;
    setLanguages(newLanguages);
  };

  const handleAddLanguage = () => {
    setLanguages([...languages, '']);
  };

  const handleRemoveLanguage = (index) => {
    const newLanguages = [...languages];
    newLanguages.splice(index, 1);
    setLanguages(newLanguages);
  };

  const handleCreateRoom = async () => {
    const newRoomId = uuidv4();
    setRoomId(newRoomId);

    const { error } = await supabase.from('languages').insert(
      languages.map((language, index) => ({
        room_id: newRoomId,
        conversation_index: index,
        language,
      }))
    );

    if (error) {
      console.error('Error creating room:', error);
    } else {
      const url = `/${newRoomId}?userName=${userName}`;
      setGeneratedUrl(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>
          <div className="mb-4">
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
              User Name
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Languages</h2>
            {languages.map((language, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={language}
                  onChange={(e) => handleLanguageChange(index, e.target.value)}
                  className="flex-grow focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(index)}
                  className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddLanguage}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Language
            </button>
          </div>
          <button
            type="button"
            onClick={handleCreateRoom}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Room
          </button>
          {generatedUrl && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-2">Generated URL</h2>
              <p className="text-sm text-gray-500">Share this URL with users:</p>
              <a href={generatedUrl} className="text-blue-600 underline">
                {generatedUrl}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;