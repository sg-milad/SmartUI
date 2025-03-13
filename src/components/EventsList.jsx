import React from 'react';

function EventsList({ events, selectedEvent, onEventSelect }) {
  // Group events by their type/category if needed
  return (
    <div className="events-list">
      <h2>Contract Events</h2>
      <div className="events-grid">
        {events.map((event, index) => (
          <button
            key={index}
            className={`event-button ${selectedEvent === event ? 'selected' : ''}`}
            onClick={() => onEventSelect(event)}
          >
            <span className="event-name">{event.name}</span>
            <span className="event-type">Event</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default EventsList; 