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
      <h3>{selectedEvent.name}</h3>
      
      <div className="filters">
        <h4>Event Filters</h4>
        {selectedEvent.inputs.filter(input => input.indexed).map((input, index) => (
          <div key={`${input.name}-${index}`} className="form-group">
            <label>
              {input.name} ({input.type}):
              <input
                type="text"
                value={filterValues[input.name] || ''}
                onChange={(e) => onFilterChange(input.name, e.target.value)}
                placeholder={`Filter by ${input.name}`}
              />
            </label>
          </div>
        ))}

        <div className="block-range">
          <div className="form-group">
            <label>
              From Block:
              <input
                type="text"
                value={fromBlock}
                onChange={(e) => setFromBlock(e.target.value)}
                placeholder="From block number"
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              To Block:
              <input
                type="text"
                value={toBlock}
                onChange={(e) => setToBlock(e.target.value)}
                placeholder="To block number (or latest)"
              />
            </label>
          </div>
        </div>

        <button onClick={onGetEvents}>Get Events</button>
      </div>

      {eventLogs.length > 0 && (
        <div className="event-logs">
          <h4>Event Logs</h4>
          {eventLogs.map((log) => (
            <div key={`${log.blockNumber}-${log.logIndex}`} className="event-log">
              <div>Block: {log.blockNumber}</div>
              <div>Transaction: {log.transactionHash}</div>
              {log.decodeError ? (
                <div className="error">Decode Error: {log.decodeError}</div>
              ) : (
                <div className="args">
                  {Object.entries(log.args || {}).map(([key, value]) => (
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
  );
}

export default EventInteraction; 