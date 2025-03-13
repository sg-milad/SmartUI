import React from 'react';

function StatusMessage({ status, error }) {
  if (!status && !error) return null;

  return (
    <div className={`status-message ${error ? 'error' : 'success'}`}>
      {error ? error : status}
    </div>
  );
}

export default StatusMessage; 