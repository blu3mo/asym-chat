import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_API_KEY
);

export default function AdminDashboard() {
  const [rooms, setRooms] = useState([]);
  const [newRoomLanguages, setNewRoomLanguages] = useState(['', '']);
  const [roomId, setRoomId] = useState(uuidv4());

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('languages')
      .select('room_id, language, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rooms:', error);
    } else {
      const groupedData = data.reduce((acc, { room_id, language, created_at }) => {
        if (!acc[room_id]) {
          acc[room_id] = { languages: [], created_at };
        }
        acc[room_id].languages.push(language);
        return acc;
      }, {});

      const rooms = Object.entries(groupedData).map(([room_id, { languages, created_at }]) => ({
        id: room_id,
        languages,
        created_at,
      }));

      setRooms(rooms);
    }
  };

  const createRoom = async () => {
    const languagesData = newRoomLanguages.map((language, index) => ({
      conversation_index: index,
      language,
      room_id: roomId,
    }));

    const { error } = await supabase.from('languages').insert(languagesData);
    if (error) {
      console.error('Error creating room:', error);
    } else {
      setNewRoomLanguages(['', '']);
      setRoomId(uuidv4());
      fetchRooms();
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create New Room</h2>
        <div className="mb-2">
          <label htmlFor="user1Language" className="block mb-1">User 1 Language:</label>
          <input
            type="text"
            id="user1Language"
            value={newRoomLanguages[0]}
            onChange={(e) => setNewRoomLanguages([e.target.value, newRoomLanguages[1]])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="user2Language" className="block mb-1">User 2 Language:</label>
          <input
            type="text"
            id="user2Language"
            value={newRoomLanguages[1]}
            onChange={(e) => setNewRoomLanguages([newRoomLanguages[0], e.target.value])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="roomId" className="block mb-1">Room ID:</label>
          <input
            type="text"
            id="roomId"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={createRoom}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Room
        </button>
      </div>
      <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>
        <ul className="space-y-2">
          {rooms.map((room) => (
            <li key={room.id} className="border border-gray-300 rounded-md p-3">
              <div className="font-semibold mb-2">Room ID: {room.id}</div>
              <div>Created At: {new Date(room.created_at).toLocaleString()}</div>
              <ul className="space-y-1">
                {room.languages.map((language, index) => (
                  <li key={index}>
                    <div>User {index + 1} Language: {language}</div>
                    <div>
                      User {index + 1} URL:{' '}
                      <Link href={`/?roomId=${room.id}&userName=User${index + 1}`}>
                        <span className="text-blue-500 hover:underline">{`/?roomId=${room.id}&userName=User${index + 1}`}</span>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}