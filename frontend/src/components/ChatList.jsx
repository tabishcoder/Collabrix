import { Search, Users, Settings, MessageCircle, Plus } from "lucide-react";
import React, { useEffect, useState } from 'react';
import API from '../api';

export default function ChatList({ user, chats, setChats, setSelectedChat }) {
  const [query, setQuery] = useState(''); // chat list filter
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedChat, setSelectedChatId] = useState(0);

  // Group creation state
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

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

  const searchMembers = async () => {
    if (!memberQuery.trim()) return;
    try {
      const res = await API.get(`/users?search=${encodeURIComponent(memberQuery)}`);
      const selectedIds = new Set(selectedMembers.map(m => m._id));
      setMemberResults(res.data.filter(u => u._id !== user._id && !selectedIds.has(u._id)));
    } catch (err) {
      console.error('Member search error:', err);
    }
  };

  const addMember = (u) => {
    setSelectedMembers(prev => [...prev, u]);
    setMemberResults(prev => prev.filter(x => x._id !== u._id));
    setMemberQuery('');
  };

  const removeMember = (id) => {
    setSelectedMembers(prev => prev.filter(m => m._id !== id));
  };

  const createGroup = async () => {
    const trimmed = groupName.trim();
    if (!trimmed) {
      alert('Please provide a group name.');
      return;
    }
    if (selectedMembers.length < 2) {
      alert('Please add at least two members.');
      return;
    }
    setIsCreatingGroup(true);
    try {
      const res = await API.post('/chats/group', {
        name: trimmed,
        participantIds: selectedMembers.map(m => m._id)
      });

      setChats(prev => [res.data, ...prev]);
      setSelectedChat(res.data);

      setIsGroupOpen(false);
      setGroupName('');
      setMemberQuery('');
      setMemberResults([]);
      setSelectedMembers([]);
    } catch (err) {
      console.error('Error creating group:', err);
      alert(err.response?.data?.error || 'Failed to create group');
    } finally {
      setIsCreatingGroup(false);
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
      // marginBottom: '8px'
    },
    headerSubtitle: {
      fontSize: '14px',
      opacity: 0.9
    },
    searchSection: {
      padding: '20px',
      borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
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
      background: 'linear-gradient(135deg, #5b8cff 0%, #4d6bff 100%)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(91, 140, 255, 0.35)'
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
    },
    groupToggleRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '12px'
    },
    groupPanel: {
      marginTop: '12px',
      padding: '16px',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '12px',
      background: 'rgba(102, 126, 234, 0.05)'
    },
    groupRow: {
      display: 'flex',
      gap: '8px',
      marginBottom: '10px'
    },
    pill: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 10px',
      borderRadius: '999px',
      background: 'rgba(102, 126, 234, 0.15)',
      color: '#2d3748',
      fontSize: '12px',
      marginRight: '6px',
      marginBottom: '6px'
    },
    removeBtn: {
      border: 'none',
      background: 'transparent',
      color: '#4a5568',
      cursor: 'pointer',
      fontWeight: 700
    },
    createBtn: {
      padding: '10px 16px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.container}>
      <div className="top-sec p-4 border-b border-gray-200">
        <div
          className="mb-5"
          // style={styles.heade}
        >
          <div className="flex justify-items-center justify-between align-center">
            <div className="flex flex-row items-center gap-2">
              <div className="icon pl-1"><MessageCircle /></div>
              <div style={styles.headerTitle}>Chats</div>
              {/* <div style={styles.headerSubtitle}>Welcome back, {user?.name}</div> */}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={()=>{}} className="pr-1"><Plus className="w-5 h-5" /></button>
              <button className="pr-1"><Users className="w-5 h-5" /></button>
              <button className="pr-1"><Settings className="w-5 h-5" /></button>
              {/* <button className="w-9 h-9 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 transition" title="Contacts">👥</button> */}
              {/* <button className="w-9 h-9 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 transition" title="Settings">⚙️</button> */}
            </div>
          </div>
        </div>

        {/* Search chats + Create Group */}
        <div 
          style={styles.searchSectio}
          className=""
        >
          <div className="flex flex-col gap-3">
            <div className="input relative ">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search chats..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full px-4 py-3 pl-9 rounded-xl border-2 border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            {/* <button
            // onClick={}
            className="flex flex-row items-center justify-center gap-2 h-10 w-full py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow hover:opacity-95"
          >
            <Users className="w-5 h-5" /> Create Group
          </button> */}
          </div>
        </div>

        {/* <div style={styles.groupToggleRow}>
          <div style={styles.sectionTitle}>Groups</div>
        </div> */}

        {/* This is now a useless logic as group creation will be handled in a pop-up */}
        {isGroupOpen && (
          <div style={styles.groupPanel}>
            <div style={styles.groupRow}>
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                style={{ ...styles.searchInput, background: '#fff' }}
              />
            </div>

            <div style={styles.groupRow}>
              <input
                type="text"
                placeholder="Search and add members"
                value={memberQuery}
                onChange={e => setMemberQuery(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && searchMembers()}
                style={{ ...styles.searchInput, background: '#fff' }}
              />
              <button onClick={searchMembers} style={styles.searchButton}>Find</button>
            </div>

            {memberResults.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                {memberResults.map(u => (
                  <div
                    key={u._id}
                    style={styles.searchResultItem}
                    onClick={() => addMember(u)}
                  >
                    <div style={styles.searchResultName}>{u.name}</div>
                    <div style={styles.searchResultEmail}>{u.email}</div>
                  </div>
                ))}
              </div>
            )}

            {selectedMembers.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                {selectedMembers.map(m => (
                  <span key={m._id} style={styles.pill}>
                    {m.name}
                    <button style={styles.removeBtn} onClick={() => removeMember(m._id)}>×</button>
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={createGroup}
              disabled={isCreatingGroup}
              style={{ ...styles.createBtn, opacity: isCreatingGroup ? 0.7 : 1 }}
            >
              {isCreatingGroup ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        )}

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

      <div className="mx-2">
        {/* <div style={styles.sectionTitle}>Recent Chats</div> */}
        {/* {chats.length > 0 ? (
          chats
            .filter(c => {
              const displayName = c.isGroup ? c.name : (c.participants.find(p => p._id !== user._id)?.name || user.name);
              return displayName.toLowerCase().includes(query.toLowerCase());
            })
            .map(c => (
              <div
                key={c._id}
                style={styles.chatItem}
                onClick={(e) => {
                  setSelectedChat(c);
                  // visually mark active
                  const parent = e.currentTarget.parentElement;
                  Array.from(parent.children).forEach(child => child.removeAttribute('data-active'));
                  e.currentTarget.setAttribute('data-active', 'true');
                  Object.assign(e.currentTarget.style, styles.chatItemActive);
                }}
                onMouseEnter={(e) => {
                  if (e.currentTarget.getAttribute('data-active') === 'true') return;
                  Object.assign(e.currentTarget.style, styles.chatItemHover);
                }}
                onMouseLeave={(e) => {
                  if (e.currentTarget.getAttribute('data-active') === 'true') return;
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.color = 'inherit';
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
        )} */}

        {chats.map((chat) => (
          <button
            key={chat._id}
            onClick={() => setSelectedChatId(chat._id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${selectedChat === chat._id
              ? "bg-blue-500 text-white shadow-md scale-[1.01]"
              : "hover:bg-gray-100 text-gray-800"
              }`}
          >
            {/* Avatar */}
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold ${selectedChat === chat.id ? "bg-blue-400" : "bg-teal-500"
                  }`}
              >
                {chat.name.charAt(0)}
              </div>
              {chat.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>

            {/* Chat Info */}
            <div className="flex-1 text-left overflow-hidden">
              <div className="flex justify-between items-center">
                <h3
                  className={`font-semibold truncate ${selectedChat === chat._id
                    ? "text-white"
                    : "text-gray-900"
                    }`}
                >
                  {chat.name}
                </h3>
                <span
                  className={`text-xs ${selectedChat === chat._id
                    ? "text-blue-100"
                    : "text-gray-500"
                    }`}
                >
                  {chat.updatedAt}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <p
                  className={`text-sm truncate ${selectedChat === chat._id
                    ? "text-blue-100"
                    : "text-gray-600"
                    }`}
                >
                  {chat.lastMessage}
                </p>

                {chat.unread > 0 && (
                  <span
                    className={`ml-2 text-xs font-semibold rounded-full px-2 py-0.5 ${selectedChat === chat._id
                      ? "bg-blue-400 text-white"
                      : "bg-blue-500 text-white"
                      }`}
                  >
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
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
