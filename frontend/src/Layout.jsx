import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatPage from './pages/ChatPage';
import Zoom from './pages/Zoom';
import Gmail from './pages/Gmail';
import Trello from './pages/Trello';

function Layout({ user, setUser }) {
    const navigate = useNavigate();

    return (
        <>
            {/* Global navigation bar */}
            <div className="buttons" style={{justifyContent: 'right', display:'flex'}}>
                <button onClick={() => navigate("/zoom")}>Zoom</button>
                <button onClick={() => navigate("/chat")}>Chat</button>
                <button onClick={() => navigate("/gmail")}>Gmail</button>
                <button onClick={() => navigate("/trello")}>Trello</button>
            </div>

            {/* Route views */}
            <Routes>
                <Route path="/login" element={<Login setUser={setUser} />} />
                <Route path="/zoom" element={<Zoom />} />
                <Route path="/gmail" element={<Gmail />} />
                <Route path="/trello" element={<Trello />} />
                <Route path="/register" element={<Register setUser={setUser} />} />
                <Route
                    path="/chat"
                    element={user ? <ChatPage user={user} /> : <Navigate to="/login" />}
                />
                <Route
                    path="*"
                    element={<Navigate to={user ? "/chat" : "/login"} />}
                />
            </Routes>
        </>
    );
}

export default Layout;