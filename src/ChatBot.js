import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { sendMessageToGemini } from './geminiConfig';

function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hotelData, setHotelData] = useState({});
  const [bookingData, setBookingData] = useState([]);
  const messagesEndRef = useRef(null);

  // Kiểm tra trạng thái đăng nhập và lấy dữ liệu
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        await fetchUserData(user.uid);
        // Thêm tin nhắn chào mừng
        setMessages([{
          id: Date.now(),
          text: `👋 Xin chào! Tôi là AI assistant của bạn. 

Tôi có thể:
• Trò chuyện thân thiện với bạn
• Phân tích dữ liệu khách sạn (doanh thu, phòng trống, đơn đặt phòng...)
• Tư vấn chiến lược kinh doanh
• Hướng dẫn sử dụng hệ thống

Hãy thử nói "Hello" hoặc hỏi tôi về khách sạn của bạn nhé! 😊`,
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

  // Lấy dữ liệu khách sạn và đơn đặt phòng
  const fetchUserData = async (userId) => {
    try {
      // Lấy danh sách khách sạn
      const hotelsQuery = query(collection(db, 'hotels'), where('userId', '==', userId));
      const hotelsSnapshot = await getDocs(hotelsQuery);
      const hotels = hotelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Lấy danh sách đơn đặt phòng
      const bookingsQuery = query(collection(db, 'orders'), where('hotelOwnerId', '==', userId));
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setHotelData({ hotels, bookings });
      setBookingData(bookings);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
    }
  };

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Gửi tin nhắn
  const handleSendMessage = async (e) => {
    e.preventDefault();
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
      // Gửi tin nhắn đến Gemini với context dữ liệu
      const response = await sendMessageToGemini(inputMessage, hotelData);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Gợi ý câu hỏi
  const suggestedQuestions = [
    "Hello! Bạn khỏe không?",
    "Tổng doanh thu tháng này là bao nhiêu?",
    "Có bao nhiêu phòng trống hiện tại?",
    "Bạn có thể giúp tôi gì?",
    "Tư vấn chiến lược tăng doanh thu"
  ];

  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.container}>
        <h2 style={styles.heading}>AI Assistant</h2>
        <p style={styles.warning}>
          Bạn cần phải <a href="/login" style={styles.link}>đăng nhập</a> để sử dụng AI assistant.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>AI Assistant - Quản lý Khách sạn</h2>
        <div style={styles.stats}>
          <span style={styles.statItem}>🏨 {hotelData.hotels?.length || 0} khách sạn</span>
          <span style={styles.statItem}>📋 {hotelData.bookings?.length || 0} đơn đặt phòng</span>
        </div>
      </div>

      <div style={styles.chatContainer}>
        <div style={styles.messagesContainer}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...styles.message,
                ...(message.isBot ? styles.botMessage : styles.userMessage)
              }}
            >
              <div style={styles.messageContent}>
                <div style={styles.messageText}>{message.text}</div>
                <div style={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ ...styles.message, ...styles.botMessage }}>
              <div style={styles.messageContent}>
                <div style={styles.typingIndicator}>AI đang suy nghĩ...</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.suggestionsContainer}>
          <div style={styles.suggestionsTitle}>Gợi ý câu hỏi:</div>
          <div style={styles.suggestions}>
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                style={styles.suggestionButton}
                onClick={() => handleSuggestedQuestion(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSendMessage} style={styles.inputForm}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Nói chuyện với tôi hoặc hỏi về khách sạn..."
            style={styles.input}
            disabled={isLoading}
          />
          <button
            type="submit"
            style={{
              ...styles.sendButton,
              ...(isLoading ? styles.sendButtonDisabled : {})
            }}
            disabled={isLoading || !inputMessage.trim()}
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  heading: {
    fontSize: '28px',
    color: '#333',
    marginBottom: '10px',
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  statItem: {
    backgroundColor: '#e3f2fd',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    color: '#1976d2',
  },
  chatContainer: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '70vh',
  },
  messagesContainer: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  },
  message: {
    display: 'flex',
    marginBottom: '10px',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  messageContent: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '18px',
    position: 'relative',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  userMessage: {
    '& $messageContent': {
      backgroundColor: '#007bff',
      color: '#fff',
    },
  },
  botMessage: {
    '& $messageContent': {
      backgroundColor: '#f8f9fa',
      color: '#333',
      border: '1px solid #e9ecef',
    },
  },
  messageText: {
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '5px',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
  },
  messageTime: {
    fontSize: '11px',
    opacity: 0.7,
  },
  typingIndicator: {
    fontStyle: 'italic',
    color: '#666',
  },
  suggestionsContainer: {
    padding: '15px 20px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #e9ecef',
  },
  suggestionsTitle: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  suggestions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  suggestionButton: {
    backgroundColor: '#e3f2fd',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '15px',
    fontSize: '12px',
    color: '#1976d2',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  inputForm: {
    display: 'flex',
    padding: '15px 20px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e9ecef',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '25px',
    fontSize: '14px',
    outline: 'none',
    marginRight: '10px',
  },
  sendButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '45px',
    height: '45px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  warning: {
    textAlign: 'center',
    color: '#e74c3c',
    fontSize: '18px',
  },
  link: {
    color: '#3498db',
    textDecoration: 'underline',
  },
  // Responsive design
  '@media (max-width: 768px)': {
    container: {
      padding: '10px',
    },
    heading: {
      fontSize: '24px',
    },
    stats: {
      flexDirection: 'column',
      gap: '10px',
    },
    chatContainer: {
      height: '60vh',
    },
    messageContent: {
      maxWidth: '90%',
      padding: '10px 14px',
    },
    messageText: {
      fontSize: '13px',
      lineHeight: '1.5',
    },
    suggestions: {
      flexDirection: 'column',
    },
    suggestionButton: {
      textAlign: 'left',
    },
  },
};

export default ChatBot;
