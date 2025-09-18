import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// 1. Define the API_URL variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      // Corrected the API call to use the variable
      const res = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setMessage(res.data.msg);
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>Forgot Password</h2>
        <p style={{marginBottom: '1rem'}}>Enter your email address and we'll send you a link to reset your password.</p>
        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}
        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
        <button type="submit" style={styles.button}>Send Reset Link</button>
        <div style={styles.linkContainer}>
            <Link to="/login" style={styles.link}>Back to Login</Link>
        </div>
      </form>
    </div>
  );
};

// 2. Added the full styles object
const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
    form: { padding: '2rem', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px', backgroundColor: 'white', width: '350px', textAlign: 'center' },
    input: { width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '1rem' },
    button: { width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' },
    success: { color: 'green', textAlign: 'center', marginBottom: '1rem' },
    error: { color: 'red', textAlign: 'center', marginBottom: '1rem' },
    linkContainer: { marginTop: '1rem' },
    link: { color: '#007bff', textDecoration: 'none', fontSize: '0.9rem' }
};

export default ForgotPassword;