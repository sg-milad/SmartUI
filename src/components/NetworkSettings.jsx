import React from 'react';

function NetworkSettings({ 
  selectedChain, 
  setSelectedChain, 
  customRpc, 
  setCustomRpc, 
  connected, 
  connectWallet 
}) {
  return (
    <div className="network-settings">
      <h2>Network Settings</h2>
      <div className="form-group">
        <label>Select Network:</label>
        <select 
          value={selectedChain} 
          onChange={(e) => setSelectedChain(e.target.value)}
          className="select-styled"
        >
          <option value="localhost">Localhost</option>
          <option value="mainnet">Mainnet</option>
          <option value="sepolia">Sepolia</option>
          <option value="goerli">Goerli</option>
          <option value="custom">Custom RPC</option>
        </select>
      </div>

      {selectedChain === 'custom' && (
        <div className="form-group">
          <label>Custom RPC URL:</label>
          <input
            type="text"
            value={customRpc}
            onChange={(e) => setCustomRpc(e.target.value)}
            placeholder="Enter custom RPC URL"
          />
        </div>
      )}

      <button 
        className={`button ${connected ? 'secondary' : 'primary'}`}
        onClick={connectWallet}
      >
        {connected ? 'Connected' : 'Connect Wallet'}
      </button>
    </div>
  );
}

export default NetworkSettings; 