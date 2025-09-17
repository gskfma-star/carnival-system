import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Modal = ({ children, onClose }) => (
  <div style={styles.modalBackdrop}>
    <div style={styles.modalContent}>
      <button onClick={onClose} style={styles.closeButton}>X</button>
      {children}
    </div>
  </div>
);

const SuperAdminDashboard = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Student');
  const [roleFilter, setRoleFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalContent, setModalContent] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);
  const [userTransactions, setUserTransactions] = useState([]);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      const res = await axios.get('http://localhost:5000/api/admin/users', config);
      setAllUsers(res.data);
    } catch (err) {
      setError('Failed to fetch users.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let result = allUsers;
    if (roleFilter !== 'All') result = result.filter(user => user.role === roleFilter);
    if (searchTerm) {
      result = result.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredUsers(result);
  }, [roleFilter, searchTerm, allUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMessage('');
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      const body = { username: newUsername, email: newEmail, role: newRole };
      const res = await axios.post('http://localhost:5000/api/admin/users', body, config);
      setSuccessMessage(`Successfully created user '${res.data.username}' and sent email.`);
      setNewUsername(''); setNewEmail(''); setNewRole('Student');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create user.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, config);
        fetchUsers();
      } catch (err) {
        setError('Failed to delete user.');
      }
    }
  };
  
  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        const body = { userId: selectedUser._id, amount: adjustmentAmount };
        await axios.post('http://localhost:5000/api/admin/wallet/adjust', body, config);
        setModalContent(null);
        fetchUsers();
    } catch (err) {
        setError('Failed to adjust balance.');
    }
  };
  
  const handleViewTransactions = async (user) => {
    setSelectedUser(user);
    try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        const res = await axios.get(`http://localhost:5000/api/admin/transactions/${user._id}`, config);
        setUserTransactions(res.data);
        setModalContent('transactions');
    } catch (err) {
        setError('Failed to fetch transactions.');
    }
  };

  const openAdjustModal = (user) => {
    setSelectedUser(user);
    setAdjustmentAmount(0);
    setModalContent('adjust');
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (isLoading) return <div style={styles.container}><p>Loading...</p></div>;

  return (
    <div style={styles.container}>
        {modalContent === 'adjust' && (
            <Modal onClose={() => setModalContent(null)}>
                <h2>Adjust Balance for {selectedUser.fullName}</h2>
                <form onSubmit={handleAdjustBalance}>
                    <input type="number" value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} style={styles.input} placeholder="e.g., 500 or -50" required/>
                    <button type="submit" style={styles.button}>Submit Adjustment</button>
                </form>
            </Modal>
        )}
        {modalContent === 'transactions' && (
            <Modal onClose={() => setModalContent(null)}>
                <h2>Transaction History for {selectedUser.fullName}</h2>
                {userTransactions.length > 0 ? userTransactions.map(tx => (
                    <div key={tx._id} style={styles.transactionItem}>
                        <div>
                            <span>From: <strong>{tx.sender.fullName}</strong> To: <strong>{tx.receiver.fullName}</strong></span>
                            <br/>
                            <small>{new Date(tx.createdAt).toLocaleString()}</small>
                        </div>
                        <span>{tx.amount} Tokens</span>
                    </div>
                )) : <p>No transactions found.</p>}
            </Modal>
        )}

        <div style={styles.header}>
            <h1>Super Admin Dashboard</h1>
            <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
        </div>
        {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
        {successMessage && <p style={{color: 'green', textAlign: 'center'}}>{successMessage}</p>}
        
        <div style={styles.formContainer}>
          <h3>Create New User</h3>
          <form onSubmit={handleCreateUser}>
            <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Username" required style={styles.input}/>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email Address" required style={styles.input}/>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} style={styles.input}>
              <option value="Student">Student</option> <option value="Vendor">Vendor</option> <option value="Admin">Admin</option>
              <option value="SubAdmin">SubAdmin</option> <option value="SuperAdmin">SuperAdmin</option>
            </select>
            <button type="submit" style={styles.button}>Create User & Send Email</button>
          </form>
        </div>
        
        <div style={styles.filters}>
            <input type="text" placeholder="Search by name, username, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput}/>
            <div>
                {['All', 'Student', 'Vendor', 'Admin', 'SubAdmin', 'SuperAdmin'].map(role => (
                    <button key={role} onClick={() => setRoleFilter(role)} style={roleFilter === role ? styles.activeFilterButton : styles.filterButton}>{role}</button>
                ))}
            </div>
        </div>

        <div style={styles.tableContainer}>
            <h3>All Users ({filteredUsers.length})</h3>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>User</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Role</th>
                        <th style={styles.th}>Balance</th>
                        <th style={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map(user => (
                        <tr key={user._id}>
                            <td style={styles.td}>{user.fullName}<br/><small>{user.username}</small></td>
                            <td style={styles.td}>{user.email}</td>
                            <td style={styles.td}>{user.role}</td>
                            <td style={styles.td}>{user.walletInfo ? `${user.walletInfo.balance} Tokens` : 'N/A'}</td>
                            <td style={styles.td}>
                                <button onClick={() => handleViewTransactions(user)} style={styles.actionButton}>History</button>
                                <button onClick={() => openAdjustModal(user)} style={styles.actionButton}>Adjust</button>
                                <button onClick={() => handleDeleteUser(user._id)} style={{...styles.actionButton, ...styles.deleteButton}}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

const styles = {
    container: { padding: '2rem', fontFamily: 'Arial, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
    logoutButton: { padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    formContainer: { marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' },
    filters: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' },
    searchInput: { padding: '8px', width: '300px' },
    filterButton: { padding: '8px 16px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' },
    activeFilterButton: { padding: '8px 16px', border: '1px solid #007bff', background: '#007bff', color: 'white', cursor: 'pointer' },
    tableContainer: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { backgroundColor: '#f2f2f2', padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' },
    td: { padding: '12px', borderBottom: '1px solid #ddd', verticalAlign: 'middle' },
    actionButton: { marginRight: '8px', marginBottom: '5px', padding: '6px 12px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', borderRadius: '4px' },
    deleteButton: { borderColor: '#dc3545', color: '#dc3545' },
    modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px', position: 'relative' },
    closeButton: { position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
    input: { display: 'block', width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' },
    button: { padding: '10px 15px', border: 'none', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', cursor: 'pointer' },
    transactionItem: { borderBottom: '1px solid #eee', padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
};

export default SuperAdminDashboard;