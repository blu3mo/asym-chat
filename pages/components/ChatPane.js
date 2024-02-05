function ChatPane({
  title,
  messages,
  message,
  setMessage,
  sendMessage,
  buttonColor,
  isLoading,
}) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      sendMessage(message);
    }
  };

  // Function to determine message background color based on the sender
  const getMessageBgColor = (msgFrom) => {
    return msgFrom === title ? `${buttonColor}` : 'bg-gray-100'; // Lighter gray for non-own messages
  };

  return (
    <div className="flex-1 flex flex-col m-2 bg-white shadow-lg rounded-lg">
      <h2 className="text-lg font-semibold text-center py-2 border-b">{title}</h2>
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
        {messages && messages.length > 0 && messages.map((msg, index) => (
          <div key={index} className={`max-w-xs ${getMessageBgColor(msg.from)} self-start rounded-lg p-2 shadow ${msg.from === title ? 'self-end' : ''}`}>
            <p className={`${msg.from === title ? 'text-white' : 'text-gray-800'}`}> {/* Improved text readability */}
              {msg.text}
            </p>
          </div>
        ))}
      </div>
      <div className="p-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
          disabled={isLoading}
        />
        <button
          onClick={() => sendMessage(message)}
          className={`${buttonColor} mt-2 w-full text-white font-bold py-2 rounded hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default ChatPane;
