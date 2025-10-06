import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
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
    <>
      <BrowserRouter>
        <Layout user={user} setUser={setUser} />
      </BrowserRouter>
    </>
  );
}
export default App;
