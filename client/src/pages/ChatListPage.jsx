import React from 'react';
import { useUser } from '../context/UserContext';
import ChatList from '../components/ChatList'
import './chatListPage.css'

const ChatListPage = () => {
  const { userId } = useUser();
  return (
    <main className="chatlist">
      <div className="">
        <h2 className="chatlist__title">
          Chat List
        </h2>
        {/* <div className="separator"></div> */}
        <div className="chatlist__container">
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <ChatList userId={userId}/>  
          </ul>
        </div>
      </div>
    </main>
  );
};

export default ChatListPage;
