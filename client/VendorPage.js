// VendorPage.js (Simplified)
import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';

const VendorPage = () => {
  const [studentId, setStudentId] = useState(null);

  const handleScan = (data) => {
    if (data) {
      setStudentId(data.text);
      // Now, you can show a form to enter the amount
      // and make the API call to charge the student.
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  return (
    <div>
      <h1>Scan Student QR</h1>
      <QrScanner
        delay={300}
        onError={handleError}
        onScan={handleScan}
        style={{ width: '100%' }}
      />
      {studentId && <p>Scanned Student ID: {studentId}</p>}
    </div>
  );
};