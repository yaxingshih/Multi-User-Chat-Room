import React from 'react';

const Message = ({ sender, text }) => (
  <div>
    <strong>{sender}: </strong>
    <span>{text}</span>
  </div>
);

export default Message;
