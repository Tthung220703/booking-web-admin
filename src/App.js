import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import SignUp from './SignUp';
import Login from './Login';
import Home from './Home';
import AddHotel from './AddHotel';
import HotelList from './HotelList';
import BookingManagement from './BookingManagement';
import ChatBot from './ChatBot';
import Header from './components/Header';
import './App.css';

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
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/add-hotel" element={<AddHotel />} />
            <Route path="/hotel-list" element={<HotelList />} />
            <Route path="/booking-management" element={<BookingManagement />} />
            <Route path="/chatbot" element={<ChatBot />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
