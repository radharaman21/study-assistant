import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { Send, Brain, Lightbulb, RefreshCw, Sparkles } from 'lucide-react';
import './TutorPage.css';
import api from '../api';

const SUGGESTIONS = [
  "Explain Newton's laws of motion",
  'What is Big O notation?',
  'How does photosynthesis work?',
  'Explain the Pythagorean theorem',
  'What is Object-Oriented Programming?',
  'Summarize the French Revolution',
];

export default function TutorPage() {
  const { user } = useAuth();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${user?.name || 'there'}! 👋 I'm your AI study tutor. What would you like to learn today?`,
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();

    if (!msg || loading) return;

    setInput('');

    const userMessage = {
      role: 'user',
      content: msg,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const history = messages.slice(-10).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').trim(),
      }));

      const res = await api.post(
        '/api/ai/chat',
        {
          message: msg,
          history,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.reply || 'No response received.',
        },
      ]);
    } catch (err) {
      console.error('Chat Error:', err.response?.data || err.message);

      toast.error(err.response?.data?.message || 'Failed to get response');

      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const explainTopic = () => {
    if (!topic.trim()) {
      toast.error('Enter a topic to explain');
      return;
    }

    sendMessage(`Please explain "${topic}" in detail for me.`);
    setTopic('');
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared! I'm ready to help. What would you like to study?",
      },
    ]);
  };

  return (
    <Layout>
      <div className="tutor-page fade-in">
        <div className="tutor-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="tutor-avatar">
              <Brain size={22} />
            </div>

            <div>
              <h1>AI Study Tutor</h1>
              <p className="tutor-subtitle">
                Personalized for {user?.profile?.course || 'your course'} ·{' '}
                {user?.profile?.learningLevel || 'Beginner'}
              </p>
            </div>
          </div>

          <button
            className="btn-secondary"
            onClick={clearChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
            }}
          >
            <RefreshCw size={14} /> New Chat
          </button>
        </div>

        <div className="tutor-layout">
          <div className="chat-container card">
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="msg-avatar">
                      <Sparkles size={14} />
                    </div>
                  )}

                  <div className="msg-bubble">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {msg.role === 'user' && (
                    <div className="msg-avatar user-avatar-msg">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="message assistant">
                  <div className="msg-avatar">
                    <Sparkles size={14} />
                  </div>

                  <div className="msg-bubble typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="chat-input-area">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    sendMessage();
                  }
                }}
                placeholder="Ask anything about your subjects..."
                disabled={loading}
              />

              <button
                className="send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
              >
                <Send size={18} />
              </button>
            </div>
          </div>

          <div className="tutor-sidebar">
            <div className="card" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <Lightbulb size={16} style={{ color: 'var(--accent-amber)' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>
                  Explain a Topic
                </h3>
              </div>

              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Newton's 3rd Law"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    explainTopic();
                  }
                }}
                style={{ marginBottom: 10 }}
              />

              <button
                className="btn-primary"
                onClick={explainTopic}
                style={{ width: '100%', fontSize: 13 }}
              >
                Explain
              </button>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                💬 Quick Questions
              </h3>

              <div className="suggestions-list">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    className="suggestion-btn"
                    onClick={() => sendMessage(s)}
                    disabled={loading}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}