import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import { socket } from '../socket';
import { redirect } from 'react-router-dom';

export default function ChatPage({ user }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

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
      background: 'linear-gradient(135deg, #e6eeff 0%, #c3d7ff 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    sidebar: {
      width: '350px',
      background: 'rgba(248, 250, 255, 0.95)',
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
      background: 'rgba(245, 248, 255, 0.85)',
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
      color: '#1e293b'
    },
    emptyStateSubtitle: {
      fontSize: '16px',
      opacity: 0.8
    }
  };

  let mock = [
    {
      id: 1,
      name: "Sarah Smith",
      message: "See you tomorrow! 👋",
      time: "2m ago",
      unread: 2,
      online: true,
    },
    {
      id: 2,
      name: "Team Project",
      message: "Mike: Let's schedule a meeting",
      time: "15m ago",
      unread: 5,
      online: false,
    },
    {
      id: 3,
      name: "Emily Davis",
      message: "Thanks for your help!",
      time: "1h ago",
      unread: 0,
      online: true,
    },
    {
      id: 4,
      name: "Family Group",
      message: "Mom: Dinner at 7?",
      time: "2h ago",
      unread: 0,
      online: false,
    },
    {
      id: 5,
      name: "Alex Brown",
      message: "Check out this article!",
      time: "1d ago",
      unread: 0,
      online: false,
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <ChatList user={user} chats={chats} setChats={setChats} setSelectedChat={setSelectedChat} />
      </div>
      <div style={styles.mainContent}>
        {selectedChat ? (
          <ChatWindow chat={selectedChat} user={user} setChats={setChats} />
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
