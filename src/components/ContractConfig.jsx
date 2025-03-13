import React from 'react';

function ContractConfig({
  contractAddress,
  setContractAddress,
  contractAbi,
  setContractAbi,
  parseContractAbi
}) {
  return (
    <div className="contract-config">
      <h2>Contract Configuration</h2>
      <div className="form-group">
        <label>
          Contract Address:
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="Enter contract address"
          />
        </label>
      </div>

      <div className="form-group">
        <label>
          Contract ABI:
          <textarea
            value={contractAbi}
            onChange={(e) => setContractAbi(e.target.value)}
            placeholder="Paste contract ABI here"
            rows={5}
          />
        </label>
      </div>

      <button onClick={parseContractAbi}>Parse ABI</button>
    </div>
  );
}

export default ContractConfig; 