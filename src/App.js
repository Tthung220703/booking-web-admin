import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import SignUp from './SignUp';
import Login from './Login';
import Home from './Home';
import AddHotel from './AddHotel';
import HotelList from './HotelList';
import BookingManagement from './BookingManagement';
import ChatBot from './ChatBot'; 

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
      <div>
        {/* Thanh Header */}
        <Header user={user} />

        {/* Các route */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/add-hotel" element={<AddHotel />} />
          <Route path="/hotel-list" element={<HotelList />} />
          <Route path="/booking-management" element={<BookingManagement />} />
          <Route path="/chatbot" element={<ChatBot />} />
        </Routes>
      </div>
    </Router>
  );
}

function Header({ user }) {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); 
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  };

  return (
    <header style={styles.header}>
      <nav style={styles.nav}>
        <div style={styles.brand} onClick={() => navigate('/')}> 
          <span style={styles.brandGradient}>SmartStay</span>
        </div>
        <ul style={styles.navList}>
          <li>
            <Link
              to="/hotel-list"
              style={styles.navItem}
              onMouseOver={(e) => { e.currentTarget.style.background = styles.navItemHover.background; e.currentTarget.style.color = styles.navItemHover.color; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = styles.navItem.color; }}
            >
              Danh sách khách sạn
            </Link>
          </li>
          <li>
            <Link
              to="/add-hotel"
              style={styles.navItem}
              onMouseOver={(e) => { e.currentTarget.style.background = styles.navItemHover.background; e.currentTarget.style.color = styles.navItemHover.color; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = styles.navItem.color; }}
            >
              Thêm khách sạn
            </Link>
          </li>
          <li>
            <Link
              to="/booking-management"
              style={styles.navItem}
              onMouseOver={(e) => { e.currentTarget.style.background = styles.navItemHover.background; e.currentTarget.style.color = styles.navItemHover.color; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = styles.navItem.color; }}
            >
              Quản lý Đơn Đặt Phòng
            </Link>
          </li>
          <li>
            <Link
              to="/chatbot"
              style={styles.navItem}
              onMouseOver={(e) => { e.currentTarget.style.background = styles.navItemHover.background; e.currentTarget.style.color = styles.navItemHover.color; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = styles.navItem.color; }}
            >
              🤖 AI Assistant
            </Link>
          </li>
          {!user ? (
            <>
              <li>
                <Link
                  to="/signup"
                  style={styles.navItem}
                  onMouseOver={(e) => { e.currentTarget.style.background = styles.navItemHover.background; e.currentTarget.style.color = styles.navItemHover.color; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = styles.navItem.color; }}
                >
                  Đăng ký
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  style={styles.navItem}
                  onMouseOver={(e) => { e.currentTarget.style.background = styles.navItemHover.background; e.currentTarget.style.color = styles.navItemHover.color; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = styles.navItem.color; }}
                >
                  Đăng nhập
                </Link>
              </li>
            </>
          ) : (
            <li style={styles.logoutButtonContainer}>
              <button
                onClick={handleLogout}
                style={styles.logoutButton}
                onMouseOver={(e) => { e.currentTarget.style.background = styles.logoutButtonHover.background; e.currentTarget.style.color = styles.logoutButtonHover.color; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = styles.logoutButton.color; }}
              >
                Đăng xuất
              </button>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}

// const styles = {
//   header: {
//     backgroundColor: '#2c3e50',
//     padding: '15px 30px',
//     color: '#fff',
//     display: 'flex',
//     alignItems: 'center',
//     boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
//     position: 'sticky',
//     top: 0,
//     zIndex: 1000,
//   },
//   nav: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     width: '100%',
//   },
//   navList: {
//     listStyleType: 'none',
//     display: 'flex',
//     padding: 0,
//     margin: 0,
//     width: '100%',
//   },
//   navItem: {
//     color: '#ecf0f1',
//     margin: '0 20px',
//     textDecoration: 'none',
//     fontSize: '16px',
//     fontWeight: '500',
//     padding: '8px 16px',
//     display: 'inline-block',
//     transition: 'color 0.3s ease',
//   },
//   navItemHover: {
//     color: '#3498db', // Hover màu xanh
//   },
//   logoutButtonContainer: {
//     marginLeft: 'auto', // Đẩy nút "Đăng xuất" sang góc phải
//   },
//   logoutButton: {
//     color: '#ecf0f1',
//     background: 'none',
//     border: 'none',
//     padding: '8px 16px',
//     fontSize: '16px',
//     fontWeight: '500',
//     cursor: 'pointer',
//     textDecoration: 'none',
//     display: 'inline-block',
//     transition: 'color 0.3s ease',
//   },
// };
const styles = {
  header: {
    background: 'linear-gradient(90deg, rgba(124,58,237,0.12), rgba(6,182,212,0.12)), rgba(11,15,26,0.82)',
    WebkitBackdropFilter: 'blur(10px)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(148,163,184,0.12)',
    padding: '12px 20px',
    color: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1200,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    userSelect: 'none',
  },
  brandGradient: {
    background: 'linear-gradient(90deg,#d946ef,#22d3ee)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    fontWeight: 900,
    fontSize: 22,
    letterSpacing: '-0.02em',
  },
  brandLight: {
    color: '#e2e8f0',
    fontWeight: 700,
  },
  brandPill: {
    marginLeft: 6,
    fontSize: 12,
    color: '#94a3b8',
    border: '1px solid rgba(148,163,184,0.25)',
    borderRadius: 999,
    padding: '2px 6px',
  },
  navList: {
    listStyleType: 'none',
    display: 'flex',
    padding: 0,
    margin: 0,
    width: '100%',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginLeft: 24,
  },
  navItem: {
    color: '#e2e8f0',
    margin: '0 14px',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 600,
    padding: '8px 12px',
    display: 'inline-block',
    borderRadius: 10,
    transition: 'all 0.2s ease',
  },
  navItemHover: {
    color: '#22d3ee',
    background: 'rgba(148,163,184,0.08)',
  },
  logoutButtonContainer: {
    marginLeft: 'auto',
  },
  logoutButton: {
    color: '#e2e8f0',
    background: 'transparent',
    border: '1px solid rgba(148,163,184,0.25)',
    borderRadius: 10,
    padding: '8px 12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'all 0.2s ease',
  },
  logoutButtonHover: { color: '#22d3ee', background: 'rgba(148,163,184,0.08)' },
  // Media query cho màn hình nhỏ hơn
  '@media (max-width: 768px)': {
    header: {
      flexDirection: 'column', // Chuyển header thành cột
      alignItems: 'flex-start',
      padding: '10px 20px',
    },
    nav: {
      flexDirection: 'column', // Chuyển navigation thành cột
      alignItems: 'flex-start',
      width: '100%',
    },
    navList: {
      flexDirection: 'column', // Các mục trong danh sách xếp dọc
      width: '100%',
      alignItems: 'flex-start',
    },
    navItem: {
      margin: '10px 0', // Thêm khoảng cách giữa các mục
      fontSize: '14px', // Giảm kích thước chữ
      width: '100%', // Đảm bảo mục chiếm toàn bộ chiều ngang
      textAlign: 'left', // Canh trái
    },
    logoutButtonContainer: {
      marginLeft: 0, // Đặt lại margin
      width: '100%',
      textAlign: 'center', // Canh giữa nút "Đăng xuất"
    },
    logoutButton: {
      fontSize: '14px', // Giảm kích thước chữ
      padding: '10px 20px',
    },
  },
};

export default App;
