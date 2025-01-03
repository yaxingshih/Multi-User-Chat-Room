import React from 'react';

import ChatList from '../components/ChatList'
import './chatListPage.css'

const ChatListPage = ({ userId }) => {
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
