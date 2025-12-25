import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import './Header.css'; 

// Bộ icon SVG nội bộ
const Icons = {
  Logo: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Logout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px', verticalAlign: 'text-bottom'}}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
};

const Header = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      console.error('Lỗi khi đăng xuất:', error);
    }
  };

  const closeMenu = () => setIsMenuOpen(false);
  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <header className="header">
      <div className="nav-container">
        {/* Logo */}
        <div className="header-left">
          <Link to="/" className="logo" onClick={closeMenu}>
            <Icons.Logo />
            <span className="logo-text">SmartStay</span>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <Icons.Close /> : <Icons.Menu />}
        </button>

        {/* Navigation */}
        <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          
          {user ? (
            <>
              {/* --- Đã thêm lại nút Thêm khách sạn ở đây --- */}
              <Link to="/" className={isActive('/')} onClick={closeMenu}>Tổng quan</Link>
              
              <Link to="/add-hotel" className={isActive('/add-hotel')} onClick={closeMenu} style={{display: 'flex', alignItems: 'center'}}>
                Thêm KS
              </Link>

              <Link to="/hotel-list" className={isActive('/hotel-list')} onClick={closeMenu}>Danh sách KS</Link>
              <Link to="/booking-management" className={isActive('/booking-management')} onClick={closeMenu}>Đơn đặt</Link>
              <Link to="/chatbot" className={isActive('/chatbot')} onClick={closeMenu}>Hỗ trợ AI</Link>
              
              {/* User Actions */}
              <div className="user-section">
                <div className="user-info">
                  <Icons.User />
                  <span title={user.email}>
                    {user.email.split('@')[0]}
                  </span>
                </div>
                <button onClick={handleLogout} className="btn-logout" title="Đăng xuất">
                  <Icons.Logout />
                  <span className="mobile-only" style={{marginLeft: '8px'}}>Đăng xuất</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="auth-buttons">
                <Link to="/login" className="btn-login" onClick={closeMenu}>Đăng Nhập</Link>
                <Link to="/signup" className="btn-signup" onClick={closeMenu}>Đăng Ký</Link>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;