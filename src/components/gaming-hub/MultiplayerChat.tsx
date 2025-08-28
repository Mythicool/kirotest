import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/gaming-hub';
import Button from '@/components/ui/Button';

interface MultiplayerChatProps {
  messages: ChatMessage[];
  activeUsers: string[];
  gameSession?: string;
  onSendMessage: (message: ChatMessage) => void;
}

export const MultiplayerChat: React.FC<MultiplayerChatProps> = ({
  messages,
  activeUsers,
  gameSession,
  onSendMessage,
}) => {
  const [messageText, setMessageText] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [chatVisible, setChatVisible] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load saved username
    const savedUsername = localStorage.getItem('gaming-hub-username');
    if (savedUsername) {
      setUsername(savedUsername);
      setIsConnected(true);
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUsernameSet = () => {
    if (username.trim()) {
      localStorage.setItem('gaming-hub-username', username.trim());
      setIsConnected(true);
      
      // Send join message
      const joinMessage: ChatMessage = {
        id: `join-${Date.now()}`,
        username: 'System',
        message: `${username} joined the chat`,
        timestamp: new Date(),
        gameSession,
        type: 'system',
      };
      onSendMessage(joinMessage);
    }
  };

  const handleSendMessage = () => {
    if (messageText.trim() && username) {
      const message: ChatMessage = {
        id: `msg-${Date.now()}`,
        username,
        message: messageText.trim(),
        timestamp: new Date(),
        gameSession,
        type: 'text',
      };

      onSendMessage(message);
      setMessageText('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDisconnect = () => {
    const leaveMessage: ChatMessage = {
      id: `leave-${Date.now()}`,
      username: 'System',
      message: `${username} left the chat`,
      timestamp: new Date(),
      gameSession,
      type: 'system',
    };
    onSendMessage(leaveMessage);
    
    localStorage.removeItem('gaming-hub-username');
    setUsername('');
    setIsConnected(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageClass = (message: ChatMessage) => {
    if (message.type === 'system') return 'system-message';
    if (message.type === 'achievement') return 'achievement-message';
    if (message.username === username) return 'own-message';
    return 'other-message';
  };

  if (!chatVisible) {
    return (
      <div className="chat-minimized">
        <Button
          onClick={() => setChatVisible(true)}
          variant="secondary"
          size="small"
        >
          💬 Chat ({messages.length})
        </Button>
      </div>
    );
  }

  return (
    <div className="multiplayer-chat">
      <div className="chat-header">
        <h3>Game Chat</h3>
        <div className="chat-controls">
          <span className="user-count">{activeUsers.length} online</span>
          <Button
            onClick={() => setChatVisible(false)}
            variant="secondary"
            size="small"
          >
            ➖
          </Button>
        </div>
      </div>

      {!isConnected ? (
        <div className="username-setup">
          <p>Enter a username to join the chat:</p>
          <div className="username-input">
            <input
              type="text"
              placeholder="Your username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUsernameSet()}
              maxLength={20}
              className="username-field"
            />
            <Button
              onClick={handleUsernameSet}
              disabled={!username.trim()}
              variant="primary"
            >
              Join Chat
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="active-users">
            <h4>Online Players</h4>
            <div className="user-list">
              {activeUsers.map((user, index) => (
                <span key={index} className="user-badge">
                  {user}
                </span>
              ))}
              {username && !activeUsers.includes(username) && (
                <span className="user-badge current-user">{username} (you)</span>
              )}
            </div>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="no-messages">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${getMessageClass(message)}`}
                >
                  <div className="message-header">
                    <span className="message-username">{message.username}</span>
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                  <div className="message-content">
                    {message.type === 'achievement' && <span className="achievement-icon">🏆</span>}
                    {message.message}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={200}
              className="message-input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              variant="primary"
            >
              Send
            </Button>
          </div>

          <div className="chat-footer">
            <Button
              onClick={handleDisconnect}
              variant="secondary"
              size="small"
            >
              Leave Chat
            </Button>
          </div>
        </>
      )}
    </div>
  );
};