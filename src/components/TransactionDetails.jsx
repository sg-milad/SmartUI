import React from 'react';

function TransactionDetails({ details }) {
  return (
    <div className="transaction-details">
      <h3>Transaction Details</h3>
      <div className="details">
        <div>Hash: {details.hash}</div>
        <div>Block Number: {details.blockNumber}</div>
        <div>From: {details.from}</div>
        <div>To: {details.to}</div>
        <div>Value: {details.value} ETH</div>
        <div>Gas Used: {details.gasUsed}</div>
        <div>Effective Gas Price: {details.effectiveGasPrice}</div>
        <div>Status: {details.status}</div>
        
        {details.events && details.events.length > 0 && (
          <div className="events">
            <h4>Emitted Events</h4>
            {details.events.map((event, index) => (
              <div key={index} className="event">
                <div>Event: {event.eventName}</div>
                {event.error ? (
                  <div className="error">{event.error}</div>
                ) : (
                  <div className="args">
                    {Object.entries(event.args || {}).map(([key, value]) => (
                      <div key={key}>
                        {key}: {value.toString()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionDetails; 