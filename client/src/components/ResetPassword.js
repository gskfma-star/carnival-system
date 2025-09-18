import React, { useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

// 1. Define the API_URL variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { token } = useParams(); // Gets the token from the URL

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    setError('');
    try {
      // Corrected the API call to use the variable
      const res = await axios.post(`${API_URL}/api/auth/reset-password/${token}`, { password });
      setMessage(res.data.msg);
    } catch (err) {
      setError(err.response?.data?.msg || 'An error occurred.');
    }
  };

  if (message) {
    return (
        <div style={styles.container}>
            <div style={styles.form}>
                <h2 style={{color: 'green'}}>Success!</h2>
                <p>{message}</p>
                <Link to="/login" style={styles.link}>Proceed to Login</Link>
            </div>
        </div>
    );
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>Reset Your Password</h2>
        {error && <p style={styles.error}>{error}</p>}
        <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
        <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={styles.input} />
        <button type="submit" style={styles.button}>Update Password</button>
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
    error: { color: 'red', textAlign: 'center', marginBottom: '1rem' },
    link: { color: '#007bff', textDecoration: 'none', fontSize: '0.9rem' }
};

export default ResetPassword;