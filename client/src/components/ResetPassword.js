import React, { useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

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
      const res = await axios.post(\${API_URL}/api/auth/reset-password/${token}`, { password });
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
        {error && <p style={{color: 'red'}}>{error}</p>}
        <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
        <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={styles.input} />
        <button type="submit" style={styles.button}>Update Password</button>
      </form>
    </div>
  );
};

const styles = { /* ... similar styles to LoginPage ... */ };
export default ResetPassword;