import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import './Header.css'; 

// --- IMPORT LOGO ẢNH ---
import logoImg from '../assets/logo.png';

// Bộ icon SVG gọn nhẹ
const Icons = {
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Logout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Sparkle: () => <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
};

const Header = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Tự động đóng menu khi resize màn hình to ra
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  const closeMenu = () => setIsMenuOpen(false);
  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <header className="header">
      <div className="nav-container">
        {/* --- LOGO SECTION --- */}
        <div className="header-left">
          <Link to="/" className="logo-area" onClick={closeMenu}>
            <img src={logoImg} alt="Logo" className="logo-img" />
            <span className="logo-text">SmartStay</span>
          </Link>
        </div>

        {/* --- MOBILE TOGGLE --- */}
        <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <Icons.Close /> : <Icons.Menu />}
        </button>

        {/* --- NAVIGATION --- */}
        <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          
          {user ? (
            <>
              <Link to="/" className={isActive('/')} onClick={closeMenu}>Tổng quan</Link>
              <Link to="/add-hotel" className={isActive('/add-hotel')} onClick={closeMenu}>Thêm KS</Link>
              <Link to="/hotel-list" className={isActive('/hotel-list')} onClick={closeMenu}>Danh sách</Link>
              <Link to="/booking-management" className={isActive('/booking-management')} onClick={closeMenu}>Đơn đặt</Link>
              
              <Link to="/chatbot" className={`nav-link ai-link ${location.pathname === '/chatbot' ? 'active' : ''}`} onClick={closeMenu}>
                 <Icons.Sparkle /> SmartStay AI
              </Link>
              
              {/* User Dropdown/Info */}
              <div className="user-action-group">
                <div className="user-badge">
                  <Icons.User />
                  <span className="user-email">{user.email?.split('@')[0]}</span>
                </div>
                <button onClick={handleLogout} className="btn-logout" title="Đăng xuất">
                  <Icons.Logout />
                  <span className="mobile-text">Đăng xuất</span>
                </button>
              </div>
            </>
          ) : (
            <div className="auth-action-group">
              <Link to="/login" className="btn-login" onClick={closeMenu}>Đăng Nhập</Link>
              <Link to="/signup" className="btn-signup" onClick={closeMenu}>Đăng Ký</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;