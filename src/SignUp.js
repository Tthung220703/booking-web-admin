import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { useNavigate } from 'react-router-dom';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Đăng ký thành công!');
      navigate('/login'); // Điều hướng đến trang đăng nhập
    } catch (error) {
      console.error('Lỗi đăng ký:', error.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <h2 style={styles.heading}>Đăng ký tài khoản</h2>
        <form onSubmit={handleSignUp} style={styles.form}>
          <div style={styles.inputGroup}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <button type="submit" style={styles.button}>Đăng ký</button>
        </form>
        <div style={styles.footer}>
          <span>Đã có tài khoản? </span>
          <button 
            onClick={() => navigate('/login')} 
            style={styles.linkButton}>Đăng nhập</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f3f4f6', // Màu nền nhẹ nhàng
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  heading: {
    textAlign: 'center',
    fontSize: '24px',
    marginBottom: '20px',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  button: {
    padding: '14px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  buttonHover: {
    backgroundColor: '#45a049',
  },
  footer: {
    textAlign: 'center',
    marginTop: '15px',
    fontSize: '14px',
    color: '#555',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#4CAF50',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

export default SignUp;
