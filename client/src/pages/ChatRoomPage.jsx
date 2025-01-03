import React, { useState, useEffect } from "react";
import axios from 'axios';
const ChatRoomPage = ({ roomId }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {

    setMessages([
      { id: 1, sender: "Alice", text: `Welcome to room ${roomId}!` },
      { id: 2, sender: "Bob", text: "Hello!" },
    ]);
  }, [roomId]);

  return (
    <div>
      <h2>Chat Room {roomId}</h2>
      <div style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatRoomPage;
