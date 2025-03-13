import React from 'react';

function TransactionDetails({ details }) {
  if (!details) return null;

  return (
    <div className="transaction-details">
      <h2>Transaction Details</h2>
      <div className="details-grid">
        <div className="detail-item">
          <label>Status:</label>
          <span className={`status ${details.status.toLowerCase()}`}>
            {details.status}
          </span>
        </div>
        <div className="detail-item">
          <label>Hash:</label>
          <a 
            href={`https://etherscan.io/tx/${details.hash}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {details.hash.slice(0, 10)}...{details.hash.slice(-8)}
          </a>
        </div>
        <div className="detail-item">
          <label>Block:</label>
          <span>{details.blockNumber}</span>
        </div>
        <div className="detail-item">
          <label>Gas Used:</label>
          <span>{details.gasUsed} wei</span>
        </div>
        <div className="detail-item">
          <label>Gas Price:</label>
          <span>{details.effectiveGasPrice} ETH</span>
        </div>
      </div>

      {details.events && details.events.length > 0 && (
        <div className="events-section">
          <h3>Emitted Events</h3>
          {details.events.map((event, index) => (
            <div key={index} className="event-item">
              <div className="event-header">
                <h4>{event.eventName}</h4>
                <span className="event-block">Block: {event.blockNumber}</span>
              </div>
              <div className="event-args">
                {Object.entries(event.args).map(([key, value]) => (
                  <div key={key} className="event-arg">
                    <span className="arg-name">{key}:</span>
                    <span className="arg-value">
                      {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TransactionDetails; 