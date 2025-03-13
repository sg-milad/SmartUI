import React from 'react';

function FunctionInteraction({
  selectedFunction,
  inputValues,
  onInputChange,
  onExecute,
  result
}) {
  return (
    <div className="function-interaction">
      <h3>{selectedFunction.name}</h3>
      <div className="inputs">
        {selectedFunction.inputs.map((input, index) => (
          <div key={`${input.name}-${index}`} className="form-group">
            <label>
              {input.name} ({input.type}):
              <input
                type="text"
                value={inputValues[input.name] || ''}
                onChange={(e) => onInputChange(input.name, e.target.value)}
                placeholder={input.type}
              />
            </label>
          </div>
        ))}
      </div>

      <button onClick={onExecute}>
        {selectedFunction.stateMutability === 'view' ? 'Read' : 'Write'}
      </button>

      {result && (
        <div className="result">
          <h4>Result:</h4>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
}

export default FunctionInteraction; 