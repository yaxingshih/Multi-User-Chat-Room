import React, { useState, useEffect } from "react";
import { fetchRoomDetails } from '../api/api';
import { fetchChatMsg } from '../api/api';
import './chatRoomPage.css'
const ChatRoomPage = ({ roomId }) => {
  const [roomDetails, setRoomDetails] = React.useState([]);
  
      const handleFetchRoomDetails = async () => {
          try {
          const data = await fetchRoomDetails(roomId);
            setRoomDetails(data);
          } catch (error) {
              console.error('Error:', error);
          }
      };
  
      React.useEffect(() => {
        handleFetchRoomDetails();
      }, [roomId]);
  
    const [messages, setMessages] = React.useState([]);

    const handleFetchChatMsg = async () => {
        try {
        const data = await fetchChatMsg(roomId);
        setMessages(data);
        } catch (error) {
            console.error('Error:', error);
        }
    };
  
      React.useEffect(() => {
        handleFetchChatMsg();
      }, [roomId]);

  return (
    <div className='chatRoom'>
      <div>
        {roomDetails.map((detal) => (
          <div key={detal.partnerUID} className='chatRoom__title'>
            <strong>{detal.partnerUID}</strong>
          </div>
        ))}
      </div>
      <div style={{ padding: "0.14rem", borderBottom: "1px solid var(--border-color)" }}></div>
        {messages.map((msg) => (
          <div key={msg.MSGID}>
            <strong>{msg.UID}:</strong> {msg.MSG}
          </div>
        ))}
      {/* "MSGID", 
        "GroupID", 
        "DTM", 
        "UID", 
        "MSG", 
        "CLASS", 
        "FormattedDTM", 
        "DT" */}
    </div>
  );
};

export default ChatRoomPage;
