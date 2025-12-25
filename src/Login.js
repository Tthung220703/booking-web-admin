import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { useNavigate } from 'react-router-dom';
import './Auth.css'; // Import CSS mới

// Inline Icons
const Icons = {
  Mail: () => <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Lock: () => <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Eye: () => <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  EyeOff: () => <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.574-2.59M5.266 5.266a10.093 10.093 0 011.724-1.09C8.385 3.58 10.15 3.25 12 3.25c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.574 2.59M9.88 9.88a3 3 0 104.24 4.24" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" /></svg>,
  Alert: () => <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
};

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State ẩn/hiện mật khẩu
  const [error, setError] = useState(''); // State thông báo lỗi
  const [loading, setLoading] = useState(false); // State loading khi đang đăng nhập
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Đăng nhập thành công thì chuyển hướng ngay, không cần alert phiền phức
      navigate('/');
    } catch (error) {
      console.error('Lỗi đăng nhập:', error.code);
      // Xử lý thông báo lỗi thân thiện hơn
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': // Firebase mới thường trả về mã này
          setError('Email hoặc mật khẩu không chính xác.');
          break;
        case 'auth/too-many-requests':
          setError('Quá nhiều lần thử. Vui lòng thử lại sau.');
          break;
        case 'auth/invalid-email':
            setError('Định dạng email không hợp lệ.');
            break;
        default:
          setError('Đăng nhập thất bại. Vui lòng kiểm tra lại đường truyền.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Chào mừng trở lại!</h2>
          <p>Đăng nhập để quản lý khách sạn của bạn</p>
        </div>

        {error && (
          <div className="error-box">
            <Icons.Alert /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          {/* Email Input */}
          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon"><Icons.Mail /></span>
              <input
                type="email"
                placeholder="Email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon"><Icons.Lock /></span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1" // Không focus vào nút này khi nhấn Tab
              >
                {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? <div className="spinner"></div> : 'Đăng nhập'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Chưa có tài khoản? </span>
          <button 
            onClick={() => navigate('/signup')} 
            className="link-btn"
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;