import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { sendMessageToGemini } from './geminiConfig';
import './ChatBot.css'; // Import file CSS mới

// Inline Icons SVG
const Icons = {
  Robot: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  User: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Send: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  Hotel: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  Booking: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
};

function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hotelData, setHotelData] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        await fetchUserData(user.uid);
        // Tin nhắn mở đầu
        setMessages([{
          id: Date.now(),
          text: `👋 Xin chào! Tôi là trợ lý AI quản lý khách sạn.\n\nTôi có thể giúp bạn phân tích doanh thu, kiểm tra phòng trống, hoặc tư vấn chiến lược.\n\nHãy thử hỏi: "Tình hình kinh doanh tháng này thế nào?"`,
          isBot: true,
          timestamp: new Date()
        }]);
      } else {
        setIsLoggedIn(false);
        setMessages([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const hotelsQuery = query(collection(db, 'hotels'), where('userId', '==', userId));
      const hotelsSnapshot = await getDocs(hotelsQuery);
      const hotels = hotelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const bookingsQuery = query(collection(db, 'orders'), where('hotelOwnerId', '==', userId));
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setHotelData({ hotels, bookings });
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessageToGemini(userMessage.text, hotelData);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Lỗi:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: '⚠️ Có lỗi kết nối. Vui lòng thử lại sau.',
        isBot: true,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "Tổng doanh thu tháng này?",
    "Khách sạn nào đông khách nhất?",
    "Tỉ lệ lấp đầy phòng hiện tại?",
    "Gợi ý cách tăng doanh thu"
  ];

  if (!isLoggedIn) {
    return (
      <div className="login-prompt">
        <div className="prompt-box">
          <Icons.Robot />
          <h2>AI Assistant</h2>
          <p>Bạn cần <a href="/login" style={{color: '#3b82f6', fontWeight: 'bold'}}>đăng nhập</a> để sử dụng trợ lý ảo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <h2>
          <span style={{color: '#8b5cf6'}}><Icons.Robot /></span> 
          Trợ lý Khách sạn
        </h2>
        <div className="stats-container">
          <span className="stat-badge">
            <Icons.Hotel /> {hotelData.hotels?.length || 0} Khách sạn
          </span>
          <span className="stat-badge">
            <Icons.Booking /> {hotelData.bookings?.length || 0} Đơn
          </span>
        </div>
      </div>

      <div className="chat-window">
        <div className="messages-area">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-row ${message.isBot ? 'bot' : 'user'}`}
            >
              <div className={`avatar ${message.isBot ? 'bot' : 'user'}`}>
                {message.isBot ? <Icons.Robot /> : <Icons.User />}
              </div>
              <div className="bubble">
                {message.text}
                <span className="timestamp">
                  {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message-row bot">
               <div className="avatar bot"><Icons.Robot /></div>
               <div className="bubble">
                 <div className="typing-dots">
                   <span></span><span></span><span></span>
                 </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="suggestions-list">
            {suggestedQuestions.map((q, idx) => (
              <button key={idx} className="chip" onClick={() => setInputMessage(q)}>
                {q}
              </button>
            ))}
          </div>
          
          <form onSubmit={handleSendMessage} className="input-form">
            <input
              type="text"
              className="chat-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn-send"
              disabled={isLoading || !inputMessage.trim()}
            >
              <Icons.Send />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatBot;