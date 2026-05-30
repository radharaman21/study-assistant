import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import {
  Plus,
  Send,
  MessageCircle,
  X,
  UserPlus,
  Search,
  Brain,
} from 'lucide-react';
import './GroupsPage.css';
import api from '../api';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function GroupsPage() {
  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [socket, setSocket] = useState(null);
  const [typingUser, setTypingUser] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const token = localStorage.getItem('token');

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const isMember = useCallback(
    group =>
      group?.members?.some(
        m => String(m?._id || m) === String(user?._id)
      ),
    [user]
  );

  const loadGroups = useCallback(async () => {
    setLoading(true);

    try {
      const [g, r] = await Promise.all([
        api.get('/api/groups', authConfig),
        api.get('/api/groups/recommended', authConfig),
      ]);

      setGroups(g.data.groups || []);
      setRecommended(r.data.groups || []);
    } catch (err) {
      console.error('Load groups error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();

    const s = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    setSocket(s);

    s.on('receive-message', msg => {
      setMessages(prev => [...prev, msg]);
    });

    s.on('user-joined', ({ userName }) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${userName} joined the group`,
        },
      ]);
    });

    s.on('user-left', ({ userName }) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${userName} left`,
        },
      ]);
    });

    s.on('user-typing', ({ userName }) => {
      setTypingUser(userName);
      setTimeout(() => setTypingUser(''), 2000);
    });

    return () => {
      s.disconnect();
    };
  }, [loadGroups]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const joinGroup = async groupId => {
    try {
      await api.post(`/api/groups/${groupId}/join`, {}, authConfig);
      toast.success('Joined group!');
      loadGroups();
    } catch (err) {
      console.error('Join group error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to join');
    }
  };

  const openChat = async group => {
    if (!group?._id) return;

    if (activeGroup && socket) {
      socket.emit('leave-room', { roomId: activeGroup._id });
    }

    setActiveGroup(group);

    try {
      const res = await api.get(
        `/api/groups/${group._id}/messages`,
        authConfig
      );

      const formatted = (res.data.messages || []).map(m => ({
        id: m._id,
        message: m.content,
        userId: m.sender?._id || m.sender,
        userName: m.senderName || m.sender?.name || 'User',
        timestamp: m.timestamp || m.createdAt,
      }));

      setMessages(formatted);
    } catch (err) {
      console.error('Load messages error:', err.response?.data || err.message);
      setMessages([]);
    }

    if (socket && user?._id) {
      socket.emit('join-room', {
        roomId: group._id,
        userId: user._id,
        userName: user.name || 'User',
      });
    }
  };

  const sendMessage = async () => {
    const content = msgInput.trim();

    if (!content || !activeGroup || !socket || !user?._id) return;

    socket.emit('send-message', {
      roomId: activeGroup._id,
      message: content,
      userId: user._id,
      userName: user.name || 'User',
    });

    try {
      await api.post(
        `/api/groups/${activeGroup._id}/messages`,
        { content },
        authConfig
      );
    } catch (err) {
      console.error('Save message error:', err.response?.data || err.message);
    }

    setMsgInput('');
  };

  const handleTyping = e => {
    setMsgInput(e.target.value);

    if (socket && activeGroup) {
      socket.emit('typing', {
        roomId: activeGroup._id,
        userName: user?.name || 'User',
      });

      clearTimeout(typingTimer.current);

      typingTimer.current = setTimeout(() => {
        socket.emit('stop-typing', {
          roomId: activeGroup._id,
        });
      }, 1500);
    }
  };

  const createGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error('Enter a group name');
      return;
    }

    try {
      await api.post(
        '/api/groups',
        {
          name: newGroup.name.trim(),
          description: newGroup.description.trim(),
        },
        authConfig
      );

      toast.success('Group created!');
      setShowCreate(false);
      setNewGroup({ name: '', description: '' });
      loadGroups();
    } catch (err) {
      console.error('Create group error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const filtered = groups.filter(g => {
    const name = (g?.name || '').toLowerCase();
    const course = (g?.course || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    return name.includes(search) || course.includes(search);
  });

  return (
    <Layout>
      <div className="groups-page fade-in">
        <div className="groups-layout">
          <div className="groups-panel">
            <div className="panel-header">
              <h1>Study Groups</h1>

              <button
                className="btn-primary"
                onClick={() => setShowCreate(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  padding: '8px 14px',
                }}
              >
                <Plus size={15} /> New
              </button>
            </div>

            <div className="search-box">
              <Search size={15} className="search-icon" />
              <input
                placeholder="Search groups..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 34 }}
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </div>
            ) : (
              <>
                {recommended.length > 0 && !searchTerm && (
                  <div className="groups-section">
                    <div className="section-header">
                      <span>⭐ Recommended for You</span>
                    </div>

                    {recommended.slice(0, 3).map(g => (
                      <GroupCard
                        key={g._id}
                        group={g}
                        isMember={isMember(g)}
                        onJoin={() => joinGroup(g._id)}
                        onChat={() => openChat(g)}
                        active={activeGroup?._id === g._id}
                      />
                    ))}
                  </div>
                )}

                <div className="groups-section">
                  <div className="section-header">
                    <span>All Groups</span>
                    <span className="count">{filtered.length}</span>
                  </div>

                  {filtered.length === 0 ? (
                    <p
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: 14,
                        padding: '12px 0',
                      }}
                    >
                      No groups found
                    </p>
                  ) : (
                    filtered.map(g => (
                      <GroupCard
                        key={g._id}
                        group={g}
                        isMember={isMember(g)}
                        onJoin={() => joinGroup(g._id)}
                        onChat={() => openChat(g)}
                        active={activeGroup?._id === g._id}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div className="chat-panel">
            {!activeGroup ? (
              <div className="chat-empty">
                <MessageCircle
                  size={48}
                  style={{
                    color: 'var(--text-muted)',
                    marginBottom: 16,
                  }}
                />
                <h3>Select a group to chat</h3>
                <p>Join or open a study group to collaborate with peers</p>
              </div>
            ) : (
              <>
                <div className="chat-panel-header">
                  <div>
                    <h3>{activeGroup.name}</h3>
                    <span>
                      {activeGroup.course || 'General'} ·{' '}
                      {activeGroup.members?.length || 0} members
                    </span>
                  </div>

                  <button
                    className="close-chat-btn"
                    onClick={() => setActiveGroup(null)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="chat-messages-area">
                  {messages.map((msg, i) =>
                    msg.system ? (
                      <div key={msg.id || i} className="system-msg">
                        {msg.message}
                      </div>
                    ) : (
                      <div
                        key={msg.id || i}
                        className={`chat-msg ${
                          String(msg.userId) === String(user?._id) ? 'own' : ''
                        }`}
                      >
                        {String(msg.userId) !== String(user?._id) && (
                          <div className="chat-name">
                            {msg.userName || 'User'}
                          </div>
                        )}

                        <div className="chat-bubble">{msg.message}</div>

                        {msg.timestamp && (
                          <div className="chat-time">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {typingUser && (
                    <div className="typing-indicator">
                      {typingUser} is typing...
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                <div className="chat-input-row">
                  {!isMember(activeGroup) ? (
                    <button
                      className="btn-primary"
                      onClick={() => joinGroup(activeGroup._id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        gap: 8,
                        justifyContent: 'center',
                      }}
                    >
                      <UserPlus size={16} /> Join to Chat
                    </button>
                  ) : (
                    <>
                      <input
                        placeholder="Type a message..."
                        value={msgInput}
                        onChange={handleTyping}
                        onKeyDown={e => {
                          if (e.key === 'Enter') sendMessage();
                        }}
                      />

                      <button
                        className="send-btn"
                        onClick={sendMessage}
                        disabled={!msgInput.trim()}
                      >
                        <Send size={16} />
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal card" onClick={e => e.stopPropagation()}>
              <h3 style={{ marginBottom: 16 }}>Create Study Group</h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Group Name
                  </label>

                  <input
                    placeholder="e.g. DSA Champions"
                    value={newGroup.name}
                    onChange={e =>
                      setNewGroup({
                        ...newGroup,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Description optional
                  </label>

                  <textarea
                    rows={3}
                    placeholder="What will you study together?"
                    value={newGroup.description}
                    onChange={e =>
                      setNewGroup({
                        ...newGroup,
                        description: e.target.value,
                      })
                    }
                    style={{ resize: 'none' }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    justifyContent: 'flex-end',
                    marginTop: 4,
                  }}
                >
                  <button
                    className="btn-secondary"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </button>

                  <button className="btn-primary" onClick={createGroup}>
                    Create Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function GroupCard({ group, isMember, onJoin, onChat, active }) {
  return (
    <div
      className={`group-card ${active ? 'active' : ''}`}
      onClick={onChat}
    >
      <div className="group-info">
        <div className="group-avatar">
          {group?.name?.[0]?.toUpperCase() || 'G'}
        </div>

        <div>
          <div className="group-name">{group?.name || 'Unnamed Group'}</div>
          <div className="group-meta">
            {group?.course || 'General'} · {group?.members?.length || 0} members
          </div>
        </div>
      </div>

      <div className="group-actions" onClick={e => e.stopPropagation()}>
        {isMember ? (
          <span className="badge badge-green" style={{ fontSize: 11 }}>
            Joined
          </span>
        ) : (
          <button className="join-btn" onClick={onJoin}>
            <UserPlus size={13} />
          </button>
        )}
      </div>
    </div>
  );
}