import { useState } from 'react';

const LanguageSelectionPopup = ({ onSave, initialUserALanguage, initialUserBLanguage }) => {
  const [userALanguage, setUserALanguage] = useState(initialUserALanguage);
  const [userBLanguage, setUserBLanguage] = useState(initialUserBLanguage);

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-5 rounded-lg">
        <div className="mb-4">
          <label htmlFor="popupUserALanguage" className="mr-2">User A Topic:</label>
          <input
            id="popupUserALanguage"
            type="text"
            value={userALanguage}
            onChange={(e) => setUserALanguage(e.target.value)}
            placeholder="e.g., en"
            className="p-1 border rounded"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="popupUserBLanguage" className="mr-2">User B Topic:</label>
          <input
            id="popupUserBLanguage"
            type="text"
            value={userBLanguage}
            onChange={(e) => setUserBLanguage(e.target.value)}
            placeholder="e.g., es"
            className="p-1 border rounded"
          />
        </div>
        <button
          onClick={() => onSave(userALanguage, userBLanguage)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default LanguageSelectionPopup;