import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatBoxProps {
  className?: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hi! I\'m your Email Bot assistant. I can help you craft personalized emails for your contacts. Upload an Excel file above and let me know what kind of email you\'d like to send!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Simulate API call to chat endpoint
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Mock bot response based on user input
      let botResponse = '';
      const input = inputValue.toLowerCase();
      
      if (input.includes('email') || input.includes('send')) {
        botResponse = 'I can help you create effective emails! Here are some suggestions:\n\n• For business outreach: Focus on value proposition and clear call-to-action\n• For follow-ups: Reference previous interactions and provide next steps\n• For newsletters: Include engaging subject lines and personalized content\n\nWhat type of email campaign are you planning?';
      } else if (input.includes('subject') || input.includes('title')) {
        botResponse = 'Great subject lines are crucial! Here are some tips:\n\n✅ Keep it under 50 characters\n✅ Create urgency or curiosity\n✅ Personalize when possible\n✅ Avoid spam trigger words\n\nWould you like me to suggest some subject lines for your campaign?';
      } else if (input.includes('template') || input.includes('format')) {
        botResponse = 'I can help you structure your email! A good template includes:\n\n1. **Personalized greeting** - Use the recipient\'s name\n2. **Clear value proposition** - What\'s in it for them?\n3. **Social proof** - Testimonials or case studies\n4. **Call to action** - What do you want them to do?\n5. **Professional signature** - Your contact information\n\nWhat industry or purpose is this email for?';
      } else {
        botResponse = 'I understand you\'re looking for help with email campaigns. I can assist with:\n\n📧 Email templates and formatting\n🎯 Subject line optimization\n📊 Personalization strategies\n📈 Follow-up sequences\n\nWhat specific aspect would you like to focus on?';
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-700 flex flex-col h-96 ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center space-x-3 p-4 border-b border-gray-700">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold">💬 Email Bot Assistant</h3>
          <p className="text-gray-400 text-sm">Online • Ready to help</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 animate-fade-in ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.type === 'user' 
                ? 'bg-white text-black' 
                : 'bg-blue-500 text-white'
            }`}>
              {message.type === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
              message.type === 'user'
                ? 'bg-white text-black ml-auto'
                : 'bg-blue-500 text-white'
            }`}>
              <p className="text-sm whitespace-pre-line">{message.content}</p>
              <p className={`text-xs mt-1 opacity-70 ${
                message.type === 'user' ? 'text-gray-600' : 'text-blue-100'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start space-x-3 animate-fade-in">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-blue-500 text-white px-4 py-2 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-black border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {isTyping ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};