import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

// We have removed <React.StrictMode> to prevent issues with the camera library
// in the development environment.
root.render(
  <App />
);