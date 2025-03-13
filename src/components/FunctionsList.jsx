import React from 'react';

function FunctionsList({ functions, selectedFunction, onFunctionSelect }) {
  return (
    <div className="functions-list">
      <h2>Contract Functions</h2>
      <div className="list">
        {functions.map((func, index) => (
          <div
            key={`${func.name}-${index}`}
            className={`function-item ${selectedFunction === func ? 'selected' : ''}`}
            onClick={() => onFunctionSelect(func)}
          >
            <span className={`badge ${func.stateMutability}`}>
              {func.stateMutability}
            </span>
            <span className="name">{func.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FunctionsList; 