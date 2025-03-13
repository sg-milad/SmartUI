import React from 'react';

function EventInteraction({
  selectedEvent,
  filterValues,
  onFilterChange,
  fromBlock,
  toBlock,
  setFromBlock,
  setToBlock,
  onGetEvents,
  eventLogs
}) {
  return (
    <div className="event-interaction">
      <h2>Event: {selectedEvent.name}</h2>
      
      <div className="event-filters">
        <div className="form-group">
          <label>From Block:</label>
          <input
            type="number"
            value={fromBlock}
            onChange={(e) => setFromBlock(e.target.value)}
            placeholder="From block number"
          />
        </div>
        <div className="form-group">
          <label>To Block:</label>
          <input
            type="number"
            value={toBlock}
            onChange={(e) => setToBlock(e.target.value)}
            placeholder="To block number (or leave empty for latest)"
          />
        </div>
        
        {selectedEvent.inputs.filter(input => input.indexed).map((input, index) => (
          <div key={index} className="form-group">
            <label>{input.name} ({input.type}):</label>
            <input
              type="text"
              value={filterValues[input.name] || ''}
              onChange={(e) => onFilterChange(input.name, e.target.value)}
              placeholder={`Filter by ${input.name}`}
            />
          </div>
        ))}
      </div>

      <button className="button primary" onClick={onGetEvents}>
        Get Events
      </button>

      {eventLogs.length > 0 && (
        <div className="event-logs">
          <h3>Event Logs:</h3>
          {eventLogs.map((log, index) => (
            <div key={index} className="event-log">
              <p>Block: {log.blockNumber}</p>
              <p>Transaction: {log.transactionHash}</p>
              <pre>{JSON.stringify(log.args, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventInteraction; 