import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import ChatListPage from './pages/ChatListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import './App.css';


function ChatRoomWrapper() {
  const { roomId } = useParams();
  return <ChatRoomPage roomId={roomId} />;
}

function App() {
  const userId = 'Admin';  
  return (
    <Router>
      <div style={{ display:"flex", height:"100vh"}}>
        <div style={{ width: "30%", borderRight: "1px solid #ccc" }}>
          <ChatListPage userId={userId}/>
        </div>
        <div style={{ width: "70%" }}>
          <Routes>
            <Route path="/chat/:roomId" element={<ChatRoomWrapper />} />
            <Route path="/" element={<div style={{ padding: "1rem" }}>請選擇一個聊天室</div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
