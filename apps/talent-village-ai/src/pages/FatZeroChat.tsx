import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEphemeralVine } from '../hooks/useEphemeralVine';
import {
  Send,
  Users,
  Copy,
  UserMinus,
  Link as LinkIcon,
  MessageSquare,
  AlertCircle,
  Trash2,
  ArrowLeft
} from 'lucide-react';

interface Participant {
  name: string;
  joinedAt: string;
}

export default function FatZeroChat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get params from URL
  const chatIdFromUrl = searchParams.get('chatId');
  const userNameFromUrl = searchParams.get('name') || '';

  const [chatId, setChatId] = useState<string | null>(chatIdFromUrl);
  const [userName, setUserName] = useState(userNameFromUrl);
  const [messageInput, setMessageInput] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const { isConnected, messages, sendMessage, createVine, clearMessages } = useEphemeralVine({
    vineId: chatId,
    userName: userName || 'Anonymous',
    onMessage: (msg) => {
      // Track participants when they send messages
      setParticipants(prev => {
        const exists = prev.some(p => p.name === msg.sender);
        if (!exists) {
          return [...prev, { name: msg.sender, joinedAt: new Date().toISOString() }];
        }
        return prev;
      });
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create new chat if no chatId
  const handleCreateChat = async () => {
    if (!userName.trim()) {
      alert('Please enter your name to start a chat');
      return;
    }

    try {
      const result = await createVine('fatzero-ephemeral-chat', [userName]);
      if (result.success && result.vineId) {
        setChatId(result.vineId);
        // Update URL
        window.history.pushState(
          {},
          '',
          `/fatzero?chatId=${result.vineId}&name=${encodeURIComponent(userName)}`
        );
        // Add self as participant
        setParticipants([{ name: userName, joinedAt: new Date().toISOString() }]);
      }
    } catch (err) {
      console.error('Failed to create chat:', err);
      alert('Failed to create chat. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !chatId) return;

    try {
      await sendMessage(userName || 'Anonymous', messageInput.trim());
      setMessageInput('');
      messageInputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const generateInviteLink = () => {
    if (!chatId) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/fatzero?chatId=${chatId}`;
  };

  const copyInviteLink = () => {
    const link = generateInviteLink();
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const removeParticipant = (participantName: string) => {
    setParticipants(prev => prev.filter(p => p.name !== participantName));
  };

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear all messages? This cannot be undone.')) {
      clearMessages();
    }
  };

  // Name entry screen
  if (!chatId && !userName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <MessageSquare className="w-16 h-16 text-purple-300" />
          </div>
          <h1 className="text-4xl font-bold text-white text-center mb-2">FatZero-ai</h1>
          <p className="text-purple-200 text-center mb-8">Ephemeral messaging. No history. No traces.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateChat()}
                autoFocus
              />
            </div>

            <button
              onClick={handleCreateChat}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 transition-all transform hover:scale-105"
            >
              Start New Chat
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full py-2 text-purple-200 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Join existing chat screen
  if (chatId && !userName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <MessageSquare className="w-16 h-16 text-purple-300" />
          </div>
          <h1 className="text-4xl font-bold text-white text-center mb-2">Join FatZero Chat</h1>
          <p className="text-purple-200 text-center mb-8">Enter your name to join the conversation</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && userName.trim()) {
                    window.history.pushState(
                      {},
                      '',
                      `/fatzero?chatId=${chatId}&name=${encodeURIComponent(userName)}`
                    );
                    window.location.reload();
                  }
                }}
                autoFocus
              />
            </div>

            <button
              onClick={() => {
                if (userName.trim()) {
                  window.history.pushState(
                    {},
                    '',
                    `/fatzero?chatId=${chatId}&name=${encodeURIComponent(userName)}`
                  );
                  window.location.reload();
                }
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 transition-all transform hover:scale-105"
            >
              Join Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex flex-col">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-purple-300" />
              <div>
                <h1 className="text-2xl font-bold text-white">FatZero-ai</h1>
                <p className="text-sm text-purple-200">Ephemeral Chat</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm text-white/70">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Participants */}
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>{participants.length}</span>
            </button>

            {/* Invite */}
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors"
            >
              <LinkIcon className="w-5 h-5" />
              Invite
            </button>

            {/* Clear Chat */}
            <button
              onClick={handleClearChat}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-200 transition-colors"
              title="Clear all messages"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <AlertCircle className="w-16 h-16 text-purple-300 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No messages yet</h3>
                <p className="text-purple-200">
                  Start the conversation. Messages are ephemeral and won't be saved.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === userName ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.sender === userName
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-white backdrop-blur-lg'
                  }`}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-sm">{msg.sender}</span>
                    <span className="text-xs opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="bg-white/10 backdrop-blur-lg border-t border-white/20 p-4">
            <div className="flex gap-3">
              <textarea
                ref={messageInputRef}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                rows={2}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Participants sidebar */}
        {showParticipants && (
          <div className="w-80 bg-white/10 backdrop-blur-lg border-l border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Participants</h2>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.name}
                  className="flex items-center justify-between bg-white/10 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white">{participant.name}</div>
                      <div className="text-xs text-purple-200">
                        Joined {new Date(participant.joinedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {participant.name !== userName && (
                    <button
                      onClick={() => removeParticipant(participant.name)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Remove participant"
                    >
                      <UserMinus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Invite to Chat</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Invite Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generateInviteLink()}
                    readOnly
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
                <p className="text-sm text-purple-200">
                  <strong>⚠️ Ephemeral Chat:</strong> Messages are not saved and will be lost when users disconnect. Share this link only with trusted participants.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
