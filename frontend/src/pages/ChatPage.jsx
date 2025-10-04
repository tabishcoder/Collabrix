import React, { useEffect, useState } from 'react';
import API from '../api';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { socket } from '../socket';

export default function ChatPage({ user }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    // fetch user's chats (simple: find chats where user is participant)
    const loadChats = async () => {
      const res = await API.get('/chats'); // optional: you can create route to list chats
      setChats(res.data || []);
    };
    loadChats();
  }, []);

  // on new messages push to chat window
  useEffect(() => {
    socket.on('private:message', ({ message }) => {
      // update local chats/messages as needed
      if (selectedChat && String(selectedChat._id) === String(message.chat)) {
        // add to ChatWindow via event or stateful store; here we will refetch messages
        // ChatWindow also listens for socket events in its own component (see below)
      }
    });
    return () => socket.off('private:message');
  }, [selectedChat]);

  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    sidebar: {
      width: '350px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRight: '1px solid rgba(0, 0, 0, 0.1)',
      boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)'
    },
    emptyState: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      color: '#718096',
      textAlign: 'center',
      padding: '40px'
    },
    emptyStateIcon: {
      fontSize: '64px',
      marginBottom: '16px',
      opacity: 0.5
    },
    emptyStateTitle: {
      fontSize: '24px',
      fontWeight: '600',
      marginBottom: '8px',
      color: '#2d3748'
    },
    emptyStateSubtitle: {
      fontSize: '16px',
      opacity: 0.8
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <ChatList user={user} chats={chats} setChats={setChats} setSelectedChat={setSelectedChat} />
      </div>
      <div style={styles.mainContent}>
        {selectedChat ? (
          <ChatWindow chat={selectedChat} user={user} />
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>💬</div>
            <h2 style={styles.emptyStateTitle}>Welcome to Collabrix</h2>
            <p style={styles.emptyStateSubtitle}>
              Select a chat from the sidebar to start messaging, or search for users to start a new conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
