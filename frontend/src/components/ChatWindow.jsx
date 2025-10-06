import React, { useEffect, useState, useRef } from 'react';
import API from '../api';
import { socket } from '../socket';

export default function ChatWindow({ chat, user, setChats }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chat) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await API.get(`/chats/${chat._id}/messages`);
        setMessages(res.data);
        // join room
        socket.emit('join:chat', chat._id);
      } catch (err) {
        console.error('Error loading messages:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [chat]);

  useEffect(() => {
    const handler = ({ message }) => {
      if (String(message.chat) === String(chat._id)) {
        setMessages(prev => [...prev, message]);
      }
    };
    socket.on('private:message', handler);
    return () => socket.off('private:message', handler);
  }, [chat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMsg = async () => {
    if (!text.trim()) return;
    // emit to server
    socket.emit('private:message', { chatId: chat._id, senderId: user._id, content: text });
    const res = await API.get(`/chats/${chat._id}/messages`);
    setMessages(res.data);
    // update latest message in chat list
    const res2 = await API.get('/chats'); // optional: you can create route to list chats
    setChats(res2.data || []);
    setText('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMsg();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'rgba(255, 255, 255, 0.8)'
    },
    header: {
      padding: '20px',
      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    chatAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      fontWeight: '600'
    },
    chatInfo: {
      display: 'flex',
      flexDirection: 'column'
    },
    chatTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '2px'
    },
    chatSubtitle: {
      fontSize: '14px',
      opacity: 0.8
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
      background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    messageWrapper: {
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: '8px'
    },
    messageWrapperOwn: {
      justifyContent: 'flex-end'
    },
    messageBubble: {
      maxWidth: '70%',
      padding: '12px 16px',
      borderRadius: '18px',
      position: 'relative',
      wordWrap: 'break-word',
      background: 'white',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(0, 0, 0, 0.05)'
    },
    messageBubbleOwn: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
    },
    messageContent: {
      fontSize: '15px',
      lineHeight: '1.4',
      marginBottom: '4px'
    },
    messageMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '11px',
      opacity: 0.7
    },
    messageSender: {
      fontWeight: '600',
      marginBottom: '2px',
      fontSize: '12px'
    },
    inputContainer: {
      padding: '20px',
      borderTop: '1px solid rgba(0, 0, 0, 0.1)',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)'
    },
    inputWrapper: {
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-end'
    },
    messageInput: {
      flex: 1,
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '24px',
      fontSize: '15px',
      outline: 'none',
      transition: 'all 0.3s ease',
      background: '#f8fafc',
      resize: 'none',
      minHeight: '44px',
      maxHeight: '120px',
      fontFamily: 'inherit'
    },
    sendButton: {
      padding: '12px 20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '24px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minWidth: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    sendButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    loadingSpinner: {
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTop: '2px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
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
    emptyStateText: {
      fontSize: '16px',
      opacity: 0.8
    }
  };

  if (!chat) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyStateIcon}>💬</div>
        <div style={styles.emptyStateText}>Select a chat to start messaging</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.chatAvatar}>
            {chat.isGroup ? '👥' : '👤'}
          </div>
          <div style={styles.chatInfo}>
            <div style={styles.chatTitle}>
              {chat.isGroup ? chat.name : chat.participants.find(p => p._id !== user._id)?.name || user.name}
            </div>
            <div style={styles.chatSubtitle}>
              {chat.isGroup ? 'Group conversation' : 'Direct message'}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.messagesContainer}>
        {isLoading ? (
          <div style={styles.emptyState}>
            <div style={styles.loadingSpinner}></div>
            <div style={styles.emptyStateText}>Loading messages...</div>
          </div>
        ) : messages.length > 0 ? (
          messages.map(m => {
            const isOwn = m.sender._id === user._id;
            return (
              <div
                key={m._id}
                style={{
                  ...styles.messageWrapper,
                  ...(isOwn ? styles.messageWrapperOwn : {})
                }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(isOwn ? styles.messageBubbleOwn : {})
                  }}
                >
                  {!isOwn && (
                    <div style={styles.messageSender}>{m.sender.name}</div>
                  )}
                  <div style={styles.messageContent}>{m.content}</div>
                  <div style={styles.messageMeta}>
                    <span>{formatTime(m.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>💬</div>
            <div style={styles.emptyStateText}>No messages yet. Start the conversation!</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputContainer}>
        <div style={styles.inputWrapper}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            style={styles.messageInput}
            rows={1}
          />
          <button
            onClick={sendMsg}
            disabled={!text.trim()}
            style={{
              ...styles.sendButton,
              ...(!text.trim() ? styles.sendButtonDisabled : {})
            }}
          >
            Send
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        textarea:focus {
          border-color: #667eea !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }
        
        textarea {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f7fafc;
        }
        
        textarea::-webkit-scrollbar {
          width: 6px;
        }
        
        textarea::-webkit-scrollbar-track {
          background: #f7fafc;
          border-radius: 3px;
        }
        
        textarea::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }
        
        textarea::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </div>
  );
}
