import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatPage from './pages/ChatPage';
import Zoom from './pages/Zoom';
import Trello from './pages/Trello';
import { socket } from './socket';

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    if (user) {
      // connect socket and notify online
      socket.auth = { token: localStorage.getItem('token') };
      socket.connect();
      socket.emit('user:online', user.id);
    } else {
      socket.disconnect();
    }
    return () => socket.disconnect();
  }, [user]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/zoom" element={<Zoom />} />
        <Route path="/trello" element={<Trello />} />
        <Route path="/register" element={<Register setUser={setUser} />} />
        <Route path="/chat" element={user ? <ChatPage user={user} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={user ? "/chat" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
