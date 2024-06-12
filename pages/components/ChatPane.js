import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import mermaid from 'mermaid';

// Function to extract location names from messages
const extractLocations = (messages) => {
  const locationRegex = /loc\(([^)]+)\)/g;
  let match;
  const locations = [];
  messages.forEach(msg => {
    while ((match = locationRegex.exec(msg.text)) !== null) {
      locations.push(match[1]);
    }
  });
  return locations;
};

// Function to extract Mermaid diagrams from messages
const extractMermaidDiagrams = (messages) => {
  const mermaidRegex = /```mermaid([\s\S]*?)```/g;
  let match;
  const diagrams = [];
  messages.forEach(msg => {
    while ((match = mermaidRegex.exec(msg.text)) !== null) {
      diagrams.push(match[1]);
    }
  });
  // return ["graph TD;\
  // A-->B;"]
  return diagrams;
};

// This is a client-side implementation. For production, consider moving API calls to the server side.
const getCoordinatesForLocation = async (locationName) => {
  const apiKey = "AIzaSyCfBpSNlz8Mc94IVratPDYbNLHJVNbgBLM"; // Replace with your actual API key
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationName)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "OK" && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    } else {
      // Handle the case where the location was not found or another error occurred
      console.error("Geocoding API error:", data.status);
      return null;
    }
  } catch (error) {
    console.error("Failed to fetch coordinates:", error);
    return null;
  }
};

//const tailwindColors = ['red', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink'];
const tailwindBgColors = ['bg-red-400', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];
const tailwindLightBgColors = ['bg-red-200', 'bg-yellow-200', 'bg-green-200', 'bg-blue-200', 'bg-indigo-200', 'bg-purple-200', 'bg-pink-200'];
const tailwindTextColors = ['text-red-800', 'text-yellow-800', 'text-green-800', 'text-blue-800', 'text-indigo-800', 'text-purple-800', 'text-pink-800'];

function ChatPane({
  title,
  topic,
  messages,
  messageInput,
  setMessage,
  sendMessage,
  conversationIndex,
  selfUsername,
  isLoading,
  hideInput,
  hideConversation
}) {
  const [locations, setLocations] = useState([]);
  const [mermaidDiagrams, setMermaidDiagrams] = useState([]);
  const mermaidRef = useRef(null);
  const messagesEndRef = useRef(null); // Ref for auto-scrolling

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyCfBpSNlz8Mc94IVratPDYbNLHJVNbgBLM", // Replace with your Google Maps API key
  });

  const mermaidId = `mermaid-${Math.floor(Math.random() * 10000)}`;

  useEffect(() => {
    console.log("messageInput", messageInput)
  }, [messageInput]);

  useEffect(() => {
    const locationNames = extractLocations(messages);
    const locationPromises = locationNames.map(async name => await getCoordinatesForLocation(name));
    Promise.all(locationPromises).then(coords => {
      const validCoords = coords.filter(coord => coord !== null);
      setLocations(validCoords);
    });

    const diagrams = extractMermaidDiagrams(messages);
    setMermaidDiagrams(diagrams);
  }, [messages?.length]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
    });

    if (mermaidRef.current) {
      console.log("mermaid! 2")
       console.log(mermaidDiagrams[mermaidDiagrams.length - 1])
        mermaid.render(mermaidId, mermaidDiagrams[mermaidDiagrams.length - 1])
          .then((svgCode) => {
            console.log(svgCode);
            mermaidRef.current.innerHTML = svgCode.svg;
          })
          .catch((error) => {
            console.error("Error during mermaid rendering:", error);
          });
    }
  }, [mermaidDiagrams]);

  useEffect(() => {
    if (messagesEndRef.current) {
      console.log("scrolling")
      messagesEndRef.current.scrollIntoView();
    }
  }, [messages.length]);

  const mapContainerStyle = {
    height: "400px",
    width: "100%",
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      sendMessage(messageInput);
    }
  };

  // Function to determine message background color based on the sender
  const getMessageBgColor = (msgFrom) => {
    return msgFrom == selfUsername ? tailwindBgColors[conversationIndex % tailwindBgColors.length] : 'bg-gray-100'; // Lighter gray for non-own messages
  };

  if (hideConversation) {
    return null;
  }
  
  return (
    <div className="flex-1 flex flex-col m-2 bg-white shadow-lg rounded-lg max-w-[600px]">
      {/* <div className="px-2 py-3 text-center border-b">
        <span className={`text-lg font-medium ${tailwindTextColors[conversationIndex % tailwindBgColors.length]} ${tailwindLightBgColors[conversationIndex % tailwindBgColors.length]} py-1 px-3 rounded-full`}>
          {topic}
        </span>
      </div> */}
      {/* <h2 className="text-lg font-semibold text-center py-2 mt-1 border-b">{title}</h2> */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
        {messages && messages.length > 0 && messages.map((msg, index) => (
          <div key={index} className={`max-w-xs ${getMessageBgColor(msg.from)} self-start rounded-lg p-2 shadow ${msg.from == selfUsername ? 'self-end' : ''}`}>
            <pre className={`${msg.from == selfUsername ? 'text-white' : 'text-gray-800'} whitespace-pre-wrap`}>
              {msg.text}
            </pre>
          </div>
        ))}
        <div ref={messagesEndRef}/> {/* Invisible element for scrolling */}
      </div>
      {!hideInput && (
          <div className="p-2">
          <textarea
            value={messageInput}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
            disabled={isLoading}
            rows={3}
          />
            <button
              onClick={() => sendMessage(messageInput)}
              className={`${tailwindBgColors[conversationIndex % tailwindBgColors.length]} mt-2 w-full text-white font-bold py-2 rounded hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
      )}

      {isLoaded && locations.length > 0 && (
        <div className="map-container">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={8}
            center={locations[0]} // Dynamically calculate the center based on all locations
          >
            {locations.map((location, index) => (
              <Marker key={index} position={location} />
            ))}
          </GoogleMap>
        </div>
      )}

      <div key={mermaidDiagrams.length - 1} className="mermaid-container">
        {mermaidDiagrams.length > 0 && (
          <div ref={mermaidRef} className="mermaid" id={mermaidId} />
        )}
      </div>
    </div>
  );
}

export default ChatPane;