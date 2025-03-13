import React from 'react';

function EventsList({ events, selectedEvent, onEventSelect }) {
  return (
    <div className="events-list">
      <h2>Contract Events</h2>
      <div className="list">
        {events.map((event, index) => (
          <div
            key={`${event.name}-${index}`}
            className={`event-item ${selectedEvent === event ? 'selected' : ''}`}
            onClick={() => onEventSelect(event)}
          >
            <span className="badge event">event</span>
            <span className="name">{event.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventsList; 