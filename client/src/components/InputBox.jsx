import React, { useState } from 'react';

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
        placeholder="輸入訊息..."
      />
      <button onClick={handleSend}>發送</button>
    </div>
  );
};

export default InputBox;
