import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authorization token found. Please log in.');
          setLoading(false);
          return;
        }
        const config = { headers: { 'x-auth-token': token } };
        const [userResponse, transactionsResponse] = await Promise.all([
          axios.get(\${API_URL}/api/users/me', config),
          axios.get('http://localhost:5000/api/transactions/history', config),
        ]);
        setUserData(userResponse.data);
        setTransactions(transactionsResponse.data);
      } catch (err) {
        setError('Failed to load dashboard data. Please try logging in again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div style={styles.container}><h2>Loading Dashboard...</h2></div>;
  if (error) return <div style={{...styles.container, color: 'red'}}><h2>{error}</h2></div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Welcome, {userData?.user.fullName}! 👋</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </div>
       <div style={styles.mainContent}>
        <div style={styles.leftColumn}>
          <div style={styles.walletCard}>
            <h3 style={styles.walletTitle}>Your Balance</h3>
            <p style={styles.walletBalance}>{userData?.wallet.balance} Tokens</p>
          </div>
          <div style={styles.transactionsSection}>
            <h3>Recent Transactions</h3>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <div key={tx._id} style={styles.transactionItem}>
                  <div>
                    <span style={{fontWeight: 'bold'}}>
                      {tx.type === 'credit' ? 'Received from' : 'Paid to'} {tx.otherParty}
                    </span>
                    <br/>
                    <small>{new Date(tx.timestamp).toLocaleString()}</small>
                  </div>
                  <span style={{color: tx.type === 'credit' ? 'green' : 'red'}}>
                    {tx.type === 'credit' ? '+' : '-'}{tx.amount} Tokens
                  </span>
                </div>
              ))
            ) : (
              <p>You have no transactions yet.</p>
            )}
          </div>
        </div>
        <div style={styles.rightColumn}>
          <div style={styles.qrCard}>
            <h3>Your Carnival Pass</h3>
            <div style={styles.qrCode}>
              {userData && <QRCodeSVG value={userData.user._id} size={200} />}
            </div>
            <p style={styles.qrInstruction}>Show this code to vendors for payment.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
    container: { padding: '2rem', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    logoutButton: { padding: '10px 20px', fontSize: '1rem', color: 'white', backgroundColor: '#dc3545', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    mainContent: { display: 'flex', flexDirection: 'row', gap: '2rem', flexWrap: 'wrap' },
    leftColumn: { flex: 2, minWidth: '300px' },
    rightColumn: { flex: 1, minWidth: '300px' },
    walletCard: { backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', marginBottom: '2rem' },
    walletTitle: { margin: 0, color: '#555' },
    walletBalance: { fontSize: '2.5rem', fontWeight: 'bold', color: '#007bff', margin: '0.5rem 0 0 0' },
    transactionsSection: { backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
    transactionItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #eee' },
    qrCard: { backgroundColor: '#fff', borderRadius: '8px', padding: '2rem', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', textAlign: 'center' },
    qrCode: { padding: '1rem', backgroundColor: 'white', display: 'inline-block', marginTop: '1rem' },
    qrInstruction: { marginTop: '1rem', color: '#666', fontSize: '0.9rem' }
};

export default StudentDashboard;