import React, { useState, useEffect } from "react";
import { fetchRoomDetails } from '../api/api';
import { fetchChatMsg } from '../api/api';
import Message from '../components/Message';
import InputBox from '../components/InputBox';
import './chatRoomPage.css';

const ChatRoomPage = ({ roomId }) => {
  const [roomDetails, setRoomDetails] = useState([]);
  
      const handleFetchRoomDetails = async () => {
          try {
          const data = await fetchRoomDetails(roomId);
            setRoomDetails(data);
          } catch (error) {
              console.error('Error:', error);
          }
      };
  
      useEffect(() => {
        handleFetchRoomDetails();
      }, [roomId]);
  
    const [messages, setMessages] = useState([]);

    const handleFetchChatMsg = async () => {
        try {
        const data = await fetchChatMsg(roomId);
        setMessages(data);
        } catch (error) {
            console.error('Error:', error);
        }
    };
  
      useEffect(() => {
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
        <ul id="messages" class="Message__List">
          {messages.map((item) => {
              return (
                <Message key={item.MSGID} {...item}/>
              )
          })}
        </ul>
        <InputBox/>
    </div>
  );
};

export default ChatRoomPage;
