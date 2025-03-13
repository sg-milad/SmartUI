import React from 'react';

function StatusMessage({ status, error }) {
  if (!status && !error) return null;

  return (
    <div className="status-message">
      {status && <div className="status">{status}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default StatusMessage; 