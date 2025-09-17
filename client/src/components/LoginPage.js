import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password,
      });
      const token = response.data.token;
      localStorage.setItem('token', token);
      const decodedToken = jwtDecode(token);
      const userRole = decodedToken.user.role;
      switch (userRole) {
        case 'Student': navigate('/dashboard'); break;
        case 'Vendor': navigate('/vendor'); break;
        case 'Admin': navigate('/admin'); break;
        case 'SubAdmin': navigate('/subadmin'); break;
        case 'SuperAdmin': navigate('/superadmin'); break;
        default:
          setError('Unknown user role. Cannot log in.');
          localStorage.removeItem('token');
          break;
      }
    } catch (err) {
      setError('Invalid username or password. Please try again.');
      console.error('Login failed:', err);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h2>Carnival Login 🎟️</h2>
        {error && <p style={styles.error}>{error}</p>}
        <div style={styles.inputGroup}>
          <label htmlFor="username">Username</label>
          <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={styles.input}/>
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input}/>
        </div>
        <button type="submit" style={styles.button}>Login</button>
        <div style={styles.linkContainer}>
            <Link to="/forgot-password" style={styles.link}>Forgot Password?</Link>
        </div>
      </form>
    </div>
  );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
    form: { padding: '2rem', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px', backgroundColor: 'white', width: '320px', textAlign: 'center' },
    inputGroup: { marginBottom: '1.5rem', textAlign: 'left' },
    input: { width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' },
    button: { width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' },
    error: { color: 'red', textAlign: 'center', marginBottom: '1rem' },
    linkContainer: { marginTop: '1rem' },
    link: { color: '#007bff', textDecoration: 'none', fontSize: '0.9rem' }
};
export default LoginPage;