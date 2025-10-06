import React, { useEffect, useState } from 'react';
import API from '../api';

export default function ChatList({ user, chats, setChats, setSelectedChat }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // useEffect(() => {
  //   setChats(async () => {
  //     const res = await API.get(`/chats`);
  //     return res.data;
  //   });
  // }, []);

  useEffect(() => { setSearchResults([]); }, [query]);

  const search = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await API.get(`/users?search=${encodeURIComponent(query)}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // this is fetching the selected chat data
  const openPrivateChat = async (otherUser) => {
    try {
      const res = await API.post('/chats/private', { userId: otherUser._id });
      
      // small check for new chat: if not present in chat list, add else list remain same
      setChats(prev => {
        if (!prev.find(c => c._id === res.data._id)) return [res.data, ...prev];
        return prev;
      });

      setSelectedChat(res.data);
      setQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Error creating chat:', err);
    }
  };

  const styles = {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(255, 255, 255, 0.95)'
    },
    header: {
      padding: '20px',
      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    },
    headerTitle: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '8px'
    },
    headerSubtitle: {
      fontSize: '14px',
      opacity: 0.9
    },
    searchSection: {
      padding: '20px',
      borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
    },
    searchContainer: {
      display: 'flex',
      gap: '8px',
      // marginBottom: '16px'
    },
    searchInput: {
      flex: 1,
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.3s ease',
      background: '#f8fafc'
    },
    searchButton: {
      padding: '12px 20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minWidth: '80px'
    },
    searchButtonDisabled: {
      opacity: 0.7,
      cursor: 'not-allowed'
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#4a5568',
      marginBottom: '12px',
      marginTop: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    chatList: {
      flex: 1,
      overflowY: 'auto',
      padding: '0 20px 20px'
    },
    chatItem: {
      padding: '16px',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginBottom: '8px',
      border: '1px solid transparent',
      background: 'rgba(255, 255, 255, 0.8)'
    },
    chatItemHover: {
      background: 'rgba(102, 126, 234, 0.1)',
      borderColor: 'rgba(102, 126, 234, 0.2)',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    },
    chatItemActive: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
    },
    chatName: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '4px'
    },
    chatLastMessage: {
      fontSize: '14px',
      opacity: 0.8,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    searchResultItem: {
      padding: '12px',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginBottom: '8px',
      background: 'rgba(102, 126, 234, 0.05)',
      border: '1px solid rgba(102, 126, 234, 0.1)'
    },
    searchResultName: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#2d3748',
      marginBottom: '2px'
    },
    searchResultEmail: {
      fontSize: '12px',
      color: '#718096'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#718096'
    },
    emptyStateIcon: {
      fontSize: '48px',
      marginBottom: '16px',
      opacity: 0.5
    },
    emptyStateText: {
      fontSize: '14px',
      opacity: 0.8
    },
    loadingSpinner: {
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTop: '2px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      display: 'inline-block',
      marginRight: '8px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>Collabrix</div>
        <div style={styles.headerSubtitle}>Welcome back, {user?.name}</div>
      </div>

      {/* Search Section */}
      <div style={styles.searchSection}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search users..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={styles.searchInput}
            onKeyPress={e => e.key === 'Enter' && search()}
          />
          <button
            onClick={search}
            disabled={isSearching || !query.trim()}
            style={{
              ...styles.searchButton,
              ...(isSearching || !query.trim() ? styles.searchButtonDisabled : {})
            }}
          >
            {isSearching ? (
              <>
                <span style={styles.loadingSpinner}></span>
                Search
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {searchResults.length > 0 && (
          <>
            <div style={styles.sectionTitle}>Search Results</div>
            {searchResults.map(u => (
              <div
                key={u._id}
                style={styles.searchResultItem}
                onClick={() => openPrivateChat(u)}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(102, 126, 234, 0.1)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(102, 126, 234, 0.05)';
                  e.target.style.transform = 'none';
                }}
              >
                <div style={styles.searchResultName}>{u.name}</div>
                <div style={styles.searchResultEmail}>{u.email}</div>
              </div>
            ))}
          </>
        )}
      </div>

      <div style={styles.chatList}>
        <div style={styles.sectionTitle}>Recent Chats</div>
        {chats.length > 0 ? (
          chats.map(c => (
            <div
              key={c._id}
              style={styles.chatItem}
              onClick={() => setSelectedChat(c)}
              onMouseEnter={(e) => {
                Object.assign(e.target.style, styles.chatItemHover);
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                e.target.style.borderColor = 'transparent';
                e.target.style.transform = 'none';
                e.target.style.boxShadow = 'none';
                e.target.style.color = 'inherit';
              }}
            >
              <div style={styles.chatName}>
                {c.isGroup ? c.name : c.participants.find(p => p._id !== user._id)?.name || user.name}
              </div>
              <div style={styles.chatLastMessage}>
                {c.lastMessage || 'No messages yet'}
              </div>
            </div>
          ))
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>💬</div>
            <div style={styles.emptyStateText}>
              No chats yet. Search for users to start a conversation!
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        input:focus {
          border-color: #667eea !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }
      `}</style>
    </div>
  );
}
