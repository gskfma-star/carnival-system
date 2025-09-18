import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 1. Define the API_URL variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const VendorDashboard = () => {
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    if (!studentId) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { qrbox: { width: 250, height: 250 }, fps: 5 },
        false
      );
      const onScanSuccess = (decodedText) => {
        setStudentId(decodedText);
        setMessage('');
        scanner.clear();
      };
      const onScanError = (errorMessage) => { /* console.warn(errorMessage); */ };
      scanner.render(onScanSuccess, onScanError);
      return () => {
        if (scanner && scanner.getState() === 2) {
             scanner.clear().catch(error => console.error("Failed to clear scanner:", error));
        }
      };
    }
  }, [studentId]);

  const handleCharge = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      const body = { studentId, amount: Number(amount) };
      // 2. Corrected the API call
      const response = await axios.post(`${API_URL}/api/transactions/charge`, body, config);
      setMessage(`Success! Charged ${amount} tokens. Student's new balance: ${response.data.newBalance}`);
      setStudentId('');
      setAmount('');
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Transaction failed. Please try again.';
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanAgain = () => {
      setStudentId('');
      setMessage('');
      setAmount('');
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Vendor Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </div>
      
      {!studentId ? (
        <div style={styles.scannerContainer}>
          <h3>Scan Student QR Code</h3>
          <div id="qr-reader" style={{ width: '100%' }}></div>
        </div>
      ) : (
        <div style={styles.chargeForm}>
          <h3>Charge Student</h3>
          <p>Student ID: <strong>{studentId}</strong></p>
          <form onSubmit={handleCharge}>
            <input
              type="number"
              placeholder="Amount to charge"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
              min="1"
              required
            />
            <button type="submit" style={styles.button} disabled={isLoading}>
              {isLoading ? 'Processing...' : `Charge ${amount} Tokens`}
            </button>
          </form>
          <button onClick={handleScanAgain} style={styles.cancelButton}>Scan Again</button>
        </div>
      )}

      {message && <p style={{ ...styles.message, color: message.startsWith('Error') ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
};

const styles = {
    container: { padding: '2rem', fontFamily: 'Arial, sans-serif', textAlign: 'center' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    logoutButton: { padding: '10px 20px', fontSize: '1rem', color: 'white', backgroundColor: '#dc3545', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    scannerContainer: { maxWidth: '500px', margin: 'auto' },
    chargeForm: { maxWidth: '400px', margin: 'auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' },
    input: { width: '100%', padding: '10px', boxSizing: 'border-box', marginBottom: '1rem' },
    button: { width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' },
    cancelButton: { width: '100%', padding: '10px', marginTop: '0.5rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    message: { marginTop: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }
};

export default VendorDashboard;