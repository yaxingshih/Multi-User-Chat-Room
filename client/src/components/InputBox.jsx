import React, { useState } from 'react';
import { FiSend } from 'react-icons/fi';
import './inputBox.css'
const InputBox = ({ onSend }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="type here..."
        className='message__inputbox'
      />
      <button onClick={handleSend} className='message__button'>
        <span className="button__icon message__button-icon">
          <FiSend />
        </span>
      </button>
    </div>
  );
};

export default InputBox;
