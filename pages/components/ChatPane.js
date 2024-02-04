// components/ChatPane.js
function ChatPane({ title, messages, message, setMessage, sendMessage, buttonColor }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(message);
    }
  };

  return (
    <div className="flex-1 flex flex-col m-2">
      <h2 className="text-lg font-semibold text-center">{title}</h2>
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
        {messages && messages.length > 0 && messages.map((msg, index) => (
          <div key={index} className={`max-w-xs ${msg.from === title ? 'self-end bg-green-200' : 'self-start bg-blue-200'} rounded-lg p-2`}>
            <p className={`${msg.from === title ? 'text-green-900' : 'text-blue-900'}`}>
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
          className="w-full p-2 border rounded"
        />
        <button
          onClick={() => sendMessage(message)}
          className={`${buttonColor} mt-2 w-full text-white font-bold py-2 rounded`}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatPane;