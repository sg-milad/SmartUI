import React from 'react';

function FunctionInteraction({
  selectedFunction,
  inputValues,
  onInputChange,
  onExecute,
  result,
  isTransactionPending
}) {
  return (
    <div className="function-interaction">
      <div className="function-header">
        <h2>Function: {selectedFunction.name}</h2>
        <span className={`function-type ${selectedFunction.stateMutability}`}>
          {selectedFunction.stateMutability}
        </span>
      </div>

      {selectedFunction.inputs.length > 0 ? (
        <div className="function-inputs">
          <h3>Inputs</h3>
          {selectedFunction.inputs.map((input, index) => (
            <div key={index} className="form-group">
              <label>
                {input.name} ({input.type}):
                <input
                  type="text"
                  value={inputValues[input.name] || ''}
                  onChange={(e) => onInputChange(input.name, e.target.value)}
                  placeholder={`Enter ${input.type}`}
                  disabled={isTransactionPending}
                />
              </label>
            </div>
          ))}
        </div>
      ) : (
        <p>This function takes no inputs.</p>
      )}

      <button 
        className={`button primary ${isTransactionPending ? 'loading' : ''}`}
        onClick={onExecute}
        disabled={isTransactionPending}
      >
        {isTransactionPending ? (
          <>
            <span className="spinner"></span>
            Processing...
          </>
        ) : (
          `Execute ${selectedFunction.name}`
        )}
      </button>

      {result && (
        <div className="result-container">
          <h3>Result:</h3>
          <pre>{result}</pre>
        </div>
      )}

      {selectedFunction.outputs && selectedFunction.outputs.length > 0 && (
        <div className="function-outputs">
          <h3>Expected Output Types:</h3>
          <ul>
            {selectedFunction.outputs.map((output, index) => (
              <li key={index}>
                {output.name ? `${output.name}: ` : ''}{output.type}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FunctionInteraction; 