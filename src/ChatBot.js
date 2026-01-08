import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { sendMessageToGemini } from './geminiConfig';
import botLogo from './assets/logo.png'; 
import './ChatBot.css'; 

// --- SVG ICONS COMPONENTS ---
const Icons = {
  User: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Send: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  Hotel: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  Booking: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Sparkle: () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M9 21.5L17.5 13L13 10L15 2.5L6.5 11L11 14L9 21.5Z" /></svg>
};

function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hotelData, setHotelData] = useState({ hotels: [], bookings: [] });
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  /**
   * 1. Khởi tạo & Auth:
   * Kiểm tra đăng nhập. Nếu có user -> Tải dữ liệu khách sạn & đơn hàng để AI học.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        await fetchUserData(user.uid);
        
        // Tin nhắn chào mừng mặc định
        setMessages([{
          id: Date.now(),
          text: `Xin chào! Tôi là trợ lý AI quản lý khách sạn.\n\nTôi đã đọc dữ liệu của bạn. Bạn muốn hỏi về doanh thu, tình trạng phòng hay phân tích xu hướng?`,
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

  /**
   * 2. Lấy dữ liệu từ Firestore:
   * Sử dụng Promise.all để lấy song song danh sách Hotels và Orders nhằm tối ưu tốc độ.
   */
  const fetchUserData = async (userId) => {
    try {
      const hotelsQ = query(collection(db, 'hotels'), where('userId', '==', userId));
      const bookingsQ = query(collection(db, 'orders'), where('hotelOwnerId', '==', userId));
      
      const [hotelsSnap, bookingsSnap] = await Promise.all([getDocs(hotelsQ), getDocs(bookingsQ)]);
      
      const hotels = hotelsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const bookings = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setHotelData({ hotels, bookings });
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu cho AI:', error);
    }
  };

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  /**
   * 3. Xử lý gửi tin nhắn:
   * - Hiển thị tin nhắn user ngay lập tức.
   * - Gọi API Gemini kèm context dữ liệu (hotelData).
   * - Nhận phản hồi và hiển thị.
   */
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage;
    const userMsg = { id: Date.now(), text: userText, isBot: false, timestamp: new Date() };

    // Cập nhật UI User
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);
    if (inputRef.current) inputRef.current.focus();

    try {
      // Gọi AI
      const response = await sendMessageToGemini(userText, hotelData);
      
      // Cập nhật UI Bot
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: response,
        isBot: true,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: '⚠️ Mất kết nối. Vui lòng thử lại sau.',
        isBot: true,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Doanh thu tháng này?",
    "Khách sạn nào đông nhất?",
    "Phòng nào đang trống?",
    "Có đơn nào chưa trả tiền?"
  ];

  // --- RENDER: Màn hình Login nếu chưa đăng nhập ---
  if (!isLoggedIn) {
    return (
      <div className="chat-login-container">
        <div className="login-card">
          <div className="login-logo-wrapper">
            <img src={botLogo} alt="Logo" className="logo-large" />
          </div>
          <h2>SmartStay AI</h2>
          <p>Vui lòng đăng nhập để sử dụng trợ lý ảo.</p>
        </div>
      </div>
    );
  }

  // --- RENDER: Màn hình Chat chính ---
  return (
    <div className="chat-layout">
      <div className="chat-container">
        
        {/* HEADER */}
        <div className="chat-header">
          <div className="header-left">
            <div className="bot-badge">
               <img src={botLogo} alt="AI" className="logo-header" />
            </div>
            <div className="header-info">
              <h3>SmartStay AI</h3>
              <span className="status-indicator online">Sẵn sàng hỗ trợ</span>
            </div>
          </div>
          
          <div className="header-stats">
            <div className="stat-pill">
              <Icons.Hotel /> <span>{hotelData.hotels.length} Địa điểm</span>
            </div>
            <div className="stat-pill">
              <Icons.Booking /> <span>{hotelData.bookings.length} Đơn</span>
            </div>
          </div>
        </div>

        {/* MESSAGES LIST */}
        <div className="messages-window">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.isBot ? 'bot' : 'user'}`}>
              <div className="message-avatar">
                {msg.isBot ? <img src={botLogo} alt="Bot" className="avatar-img" /> : <Icons.User />}
              </div>
              <div className="message-bubble">
                {msg.text}
                <span className="msg-time">
                  {msg.timestamp.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          ))}
          
          {/* Loading Animation */}
          {isLoading && (
            <div className="message-row bot">
               <div className="message-avatar">
                  <img src={botLogo} alt="Bot" className="avatar-img" />
               </div>
               <div className="message-bubble loading">
                 <div className="dot-flashing"></div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="input-section">
          {/* Gợi ý nhanh */}
          {messages.length < 3 && (
            <div className="suggestions-row">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setInputMessage(s)} className="suggestion-chip">
                  <Icons.Sparkle /> {s}
                </button>
              ))}
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="chat-form">
            <input
              ref={inputRef}
              type="text"
              className="chat-input-field"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={isLoading}
            />
            <button type="submit" className="send-btn" disabled={isLoading || !inputMessage.trim()}>
              <Icons.Send />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatBot;