import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './chatList.css';

const ChatList = ({userId}) => {
    const [chatRooms, setChatRooms] = useState([]);

    useEffect(() => {

    const fetchChatRooms = async () => {
        try {
        const response = await axios.get(`http://localhost:3000/api/chatRooms/${userId}`);
        setChatRooms(response.data);
        console.log(response.data);
        } catch (error) {
        console.error('Error fetching chat rooms:', error);
        }
    };

    fetchChatRooms();
    }, [userId]);
    
  return (
    <div >
        {chatRooms.map((room) => (
        <li key={room.GroupID} className='chatListItem__container'>
            <span className="chatListItem__usericon">
                <img src={`/assets/userIcon/${room.GroupName}.jpg`} alt="" className="chatListItem__img"  />
            </span>
            <Link to={`/chat/${room.GroupID}`} >
                <div className="chatListItem__content">
                    <div className="chatListItem__name">
                        {room.GroupName}
                    </div>
                    <span className="chatListItem__time">10:01</span>
                    <div className="chatListItem__message">hi</div>
                    <span className="chatListItem__notification">●</span>
                </div>
            </Link>
        </li>
        ))}
    </div>
  )
}

export default ChatList
