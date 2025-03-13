import React from 'react';

function FunctionsList({ functions, selectedFunction, onFunctionSelect }) {
  // Group functions by their stateMutability
  const groupedFunctions = functions.reduce((acc, func) => {
    const type = func.stateMutability || 'nonpayable';
    if (!acc[type]) acc[type] = [];
    acc[type].push(func);
    return acc;
  }, {});

  return (
    <div className="functions-list">
      <h2>Contract Functions</h2>
      {Object.entries(groupedFunctions).map(([type, funcs]) => (
        <div key={type} className="function-group">
          <h3 className="function-type-header">{type.toUpperCase()}</h3>
          <div className="functions-grid">
            {funcs.map((func, index) => (
              <button
                key={index}
                className={`function-button ${type} ${selectedFunction === func ? 'selected' : ''}`}
                onClick={() => onFunctionSelect(func)}
              >
                <span className="function-name">{func.name}</span>
                <span className="function-type">{type}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default FunctionsList; 