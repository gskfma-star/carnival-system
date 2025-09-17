import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// A simple reusable modal component
const Modal = ({ children, onClose }) => (
  <div style={styles.modalBackdrop}>
    <div style={styles.modalContent}>
      <button onClick={onClose} style={styles.closeButton}>X</button>
      {children}
    </div>
  </div>
);

const AdminDashboard = () => {
  // --- STATE MANAGEMENT ---
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // State for creating students
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');

  // State for the recharge modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rechargeAmount, setRechargeAmount] = useState('');

  const navigate = useNavigate();

  // --- API & EVENT HANDLERS ---

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      const res = await axios.get(\${API_URL}/api/admin/view-users', config);
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.fullName.toLowerCase().includes(term) || 
        user.username.toLowerCase().includes(term) ||
        (user.email && user.email.toLowerCase().includes(term))
      );
    }
    setFilteredUsers(result);
  }, [searchTerm, users]);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMessage('');
    try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        const body = { username: newUsername, email: newEmail, role: 'Student' };
        const res = await axios.post('http://localhost:5000/api/admin/users', body, config);
        setSuccessMessage(`Successfully created student '${res.data.username}' and sent an email.`);
        setNewUsername(''); setNewEmail('');
        fetchUsers();
    } catch (err) {
        setError(err.response?.data?.msg || 'Failed to create student.');
    }
  };
  
  const handleRecharge = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMessage('');
    if (Number(rechargeAmount) <= 0) {
        setError("Recharge amount must be a positive number.");
        return;
    }
    try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        const body = { userId: selectedUser._id, amount: rechargeAmount };
        const res = await axios.post('http://localhost:5000/api/admin/recharge', body, config);
        setSuccessMessage(res.data.msg);
        setIsModalOpen(false);
        fetchUsers();
    } catch (err) {
        setError(err.response?.data?.msg || 'Failed to recharge wallet.');
    }
  };

  const openRechargeModal = (user) => {
    setSelectedUser(user);
    setRechargeAmount('');
    setIsModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (isLoading) return <div style={styles.container}><p>Loading...</p></div>;

  // --- JSX RENDER ---
  return (
    <div style={styles.container}>
      {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)}>
              <h2>Recharge Wallet for {selectedUser.fullName}</h2>
              <form onSubmit={handleRecharge}>
                  <input type="number" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} style={styles.input} placeholder="Amount to add" min="1" required />
                  <button type="submit" style={styles.button}>Confirm Recharge</button>
              </form>
          </Modal>
      )}

      <div style={styles.header}>
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </div>
      
      {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
      {successMessage && <p style={{color: 'green', textAlign: 'center'}}>{successMessage}</p>}
      
      <div style={styles.formContainer}>
        <h3>Create New Student</h3>
        <p>A password will be auto-generated and emailed to the student.</p>
        <form onSubmit={handleCreateStudent}>
          <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Username" required style={styles.input}/>
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email Address" required style={styles.input}/>
          <button type="submit" style={styles.button}>Create Student</button>
        </form>
      </div>

      <div style={styles.filters}>
        <input type="text" placeholder="Search by name, username, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput}/>
      </div>

      <div style={styles.tableContainer}>
        <h3>Students & Vendors ({filteredUsers.length})</h3>
        <table style={styles.table}>
            <thead><tr><th style={styles.th}>User</th><th style={styles.th}>Email</th><th style={styles.th}>Role</th><th style={styles.th}>Balance</th><th style={styles.th}>Actions</th></tr></thead>
            <tbody>
                {filteredUsers.map(user => (
                    <tr key={user._id}>
                        <td style={styles.td}>{user.fullName}<br/><small>{user.username}</small></td>
                        <td style={styles.td}>{user.email}</td>
                        <td style={styles.td}>{user.role}</td>
                        <td style={styles.td}>{user.walletInfo ? `${user.walletInfo.balance} Tokens` : 'N/A'}</td>
                        <td style={styles.td}><button onClick={() => openRechargeModal(user)} style={styles.actionButton}>Recharge Wallet</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
    container: { padding: '2rem', fontFamily: 'Arial, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
    logoutButton: { padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    formContainer: { marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' },
    filters: { display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' },
    searchInput: { padding: '8px', width: '300px' },
    tableContainer: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { backgroundColor: '#f2f2f2', padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' },
    td: { padding: '12px', borderBottom: '1px solid #ddd', verticalAlign: 'middle' },
    actionButton: { padding: '6px 12px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', borderRadius: '4px' },
    modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px', position: 'relative' },
    closeButton: { position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
    input: { display: 'block', width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' },
    button: { padding: '10px 15px', border: 'none', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', cursor: 'pointer' },
};

export default AdminDashboard;