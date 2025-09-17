import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SubAdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      const res = await axios.get(\${API_URL}/api/admin/search-students?search=${searchTerm}`, config);
      setSearchResults(res.data);
      if(res.data.length === 0) setMessage('No students found.');
    } catch (err) {
      setMessage('Error searching for students.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleRecharge = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        const body = { userId: selectedUser._id, amount: rechargeAmount };
        const res = await axios.post('http://localhost:5000/api/admin/recharge', body, config);
        
        setMessage(`${res.data.msg}. New Balance: ${res.data.newBalance}`);
        // Reset the form
        setSelectedUser(null);
        setSearchTerm('');
        setSearchResults([]);
        setRechargeAmount('');
    } catch (err) {
        setMessage(err.response?.data?.msg || 'Recharge failed.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Token Recharge Station</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </div>

      {message && <p style={{color: message.includes('successful') ? 'green' : 'red', textAlign: 'center', fontSize: '1.1rem'}}>{message}</p>}

      {!selectedUser ? (
        <div>
          <form onSubmit={handleSearch} style={styles.form}>
            <input
              type="text"
              placeholder="Search student by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.button} disabled={isLoading}>{isLoading ? 'Searching...' : 'Search'}</button>
          </form>
          <div style={styles.results}>
            {searchResults.map(user => (
              <div key={user._id} onClick={() => setSelectedUser(user)} style={styles.resultItem}>
                {user.fullName} ({user.username})
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <form onSubmit={handleRecharge} style={styles.form}>
            <h3>Recharging: {selectedUser.fullName}</h3>
            <input
              type="number"
              placeholder="Amount to add"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              style={styles.input}
              min="1"
              required
            />
            <button type="submit" style={styles.button} disabled={isLoading}>{isLoading ? 'Processing...' : 'Recharge Tokens'}</button>
            <button type="button" onClick={() => setSelectedUser(null)} style={{...styles.button, ...styles.cancelButton}}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
};

// --- STYLES ---
const styles = {
    container: { maxWidth: '700px', margin: '2rem auto', padding: '2rem', fontFamily: 'Arial, sans-serif', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px', backgroundColor: '#fff' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' },
    logoutButton: { padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px' },
    input: { width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' },
    button: { padding: '12px 15px', border: 'none', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' },
    cancelButton: { backgroundColor: '#6c757d', marginTop: '10px' },
    results: { marginTop: '1rem' },
    resultItem: { padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', marginBottom: '5px', ':hover': { backgroundColor: '#f9f9f9' } }
};

export default SubAdminDashboard;