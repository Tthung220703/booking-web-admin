import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { AnimatePresence, motion } from 'framer-motion'; // 1. Import Framer Motion

// Import các trang của bạn
import SignUp from './SignUp';
import Login from './Login';
import Home from './Home';
import AddHotel from './AddHotel';
import HotelList from './HotelList';
import BookingManagement from './BookingManagement';
import ChatBot from './ChatBot';
import Header from './components/Header';
import './App.css';

// 2. Tạo component AnimatedRoutes để xử lý hiệu ứng
const AnimatedRoutes = () => {
  const location = useLocation(); // Lấy thông tin đường dẫn hiện tại

  return (
    // AnimatePresence giúp phát hiện khi một component rời khỏi DOM
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Wrap từng element trong PageWrapper để áp dụng hiệu ứng */}
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/signup" element={<PageWrapper><SignUp /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/add-hotel" element={<PageWrapper><AddHotel /></PageWrapper>} />
        <Route path="/hotel-list" element={<PageWrapper><HotelList /></PageWrapper>} />
        <Route path="/booking-management" element={<PageWrapper><BookingManagement /></PageWrapper>} />
        <Route path="/chatbot" element={<PageWrapper><ChatBot /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

// 3. Component bọc (Wrapper) chứa định nghĩa hiệu ứng
const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}     // Trạng thái ban đầu: mờ và nằm thấp hơn 20px
      animate={{ opacity: 1, y: 0 }}      // Trạng thái hiển thị: rõ và về vị trí chuẩn
      exit={{ opacity: 0, y: -20 }}       // Trạng thái biến mất: mờ và bay lên trên 20px
      transition={{ duration: 0.3 }}      // Thời gian chạy hiệu ứng: 0.3 giây
      style={{ width: '100%' }}           // Đảm bảo chiếm full chiều rộng
    >
      {children}
    </motion.div>
  );
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Header user={user} />
        <main className="main-content">
          {/* Thay thế Routes cũ bằng AnimatedRoutes */}
          <AnimatedRoutes />
        </main>
      </div>
    </Router>
  );
}

export default App;