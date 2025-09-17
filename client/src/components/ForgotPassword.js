import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(\${API_URL}/api/auth/forgot-password', { email });
      setMessage(res.data.msg);
    } catch (err) {
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>Forgot Password</h2>
        <p>Enter your email address and we'll send you a link to reset your password.</p>
        {message && <p style={{color: 'green'}}>{message}</p>}
        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
        <button type="submit" style={styles.button}>Send Reset Link</button>
        <Link to="/login" style={styles.link}>Back to Login</Link>
      </form>
    </div>
  );
};

const styles = { /* ... similar styles to LoginPage ... */ };
export default ForgotPassword;