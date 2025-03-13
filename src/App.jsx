import React, { useState, useEffect } from 'react';
import { 
  createPublicClient, 
  http,
  createWalletClient,
  custom
} from 'viem';
import { hardhat, mainnet, sepolia, goerli } from 'viem/chains';

function App() {
  const [contractAddress, setContractAddress] = useState('');
  const [contractAbi, setContractAbi] = useState('');
  const [selectedChain, setSelectedChain] = useState('localhost');
  const [customRpc, setCustomRpc] = useState('http://localhost:8545');
  const [client, setClient] = useState(null);
  const [walletClient, setWalletClient] = useState(null);
  const [abi, setAbi] = useState(null);
  const [functions, setFunctions] = useState([]);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [result, setResult] = useState(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  // Chain configuration
  const chains = {
    localhost: { ...hardhat, id: 31337, rpcUrls: { default: { http: ['http://localhost:8545'] } } },
    mainnet: mainnet,
    sepolia: sepolia,
    goerli: goerli,
    custom: { id: 1, name: 'Custom', rpcUrls: { default: { http: [customRpc] } } }
  };

  // Set up the client when the chain changes
  useEffect(() => {
    try {
      const newClient = createPublicClient({
        chain: chains[selectedChain],
        transport: http(selectedChain === 'custom' ? customRpc : chains[selectedChain].rpcUrls.default.http[0])
      });
      setClient(newClient);
      setStatus(`Connected to ${selectedChain}`);
    } catch (err) {
      setError(`Failed to connect to ${selectedChain}: ${err.message}`);
    }
  }, [selectedChain, customRpc]);

  // Connect to wallet (Metamask)
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('No Ethereum wallet found. Please install MetaMask.');
        return;
      }

      const wallet = createWalletClient({
        chain: chains[selectedChain],
        transport: custom(window.ethereum)
      });

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletClient(wallet);
      setConnected(true);
      setStatus(`Connected to wallet: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
    } catch (err) {
      setError(`Failed to connect wallet: ${err.message}`);
    }
  };

  // Parse ABI when the ABI string changes - IMPROVED VERSION
  const parseContractAbi = () => {
    try {
      if (!contractAbi) {
        setError('Please enter a valid ABI');
        return;
      }

      // Try to parse the ABI string
      let parsedAbi;
      try {
        parsedAbi = JSON.parse(contractAbi);
      } catch (parseErr) {
        setError(`Invalid JSON format: ${parseErr.message}`);
        return;
      }

      // Check if it's an array
      if (!Array.isArray(parsedAbi)) {
        // Some ABIs might be wrapped in an object with an "abi" property
        if (parsedAbi.abi && Array.isArray(parsedAbi.abi)) {
          parsedAbi = parsedAbi.abi;
        } else {
          setError('ABI must be an array of function definitions');
          return;
        }
      }

      // Validate each entry in the ABI
      const validAbi = parsedAbi.filter(item => {
        // Basic validation for required properties
        if (item.type === 'function') {
          return item.name && Array.isArray(item.inputs) && Array.isArray(item.outputs);
        }
        // Keep other valid types (event, constructor, etc.)
        return true;
      });

      if (validAbi.length === 0) {
        setError('No valid function definitions found in ABI');
        return;
      }

      setAbi(validAbi);

      // Extract function definitions from ABI
      const abiFunctions = validAbi.filter(item => item.type === 'function');
      setFunctions(abiFunctions);
      setStatus(`ABI parsed successfully. Found ${abiFunctions.length} function(s).`);
    } catch (err) {
      setError(`Failed to parse ABI: ${err.message}`);
    }
  };

  // Handle function selection
  const handleFunctionSelect = (func) => {
    setSelectedFunction(func);
    setInputValues({});  // Reset input values
    setResult(null);     // Reset results
  };

  // Handle input changes
  const handleInputChange = (name, value) => {
    setInputValues(prev => ({ ...prev, [name]: value }));
  };

  // Execute the selected function
  const executeFunction = async () => {
    if (!contractAddress || !selectedFunction || !client) {
      setError('Missing required information');
      return;
    }

    try {
      setStatus('Executing transaction...');
      setError('');
      
      const args = selectedFunction.inputs.map(input => {
        const value = inputValues[input.name];
        
        // Convert string numbers to actual numbers for numeric types
        if (input.type.includes('int') && value) {
          return BigInt(value);
        }
        // Convert string 'true'/'false' to boolean for bool type
        if (input.type === 'bool') {
          return value === 'true';
        }
        // Handle arrays
        if (input.type.includes('[]') && value) {
          try {
            return JSON.parse(value);
          } catch {
            return value.split(',').map(v => v.trim());
          }
        }
        
        return value;
      });

      if (selectedFunction.stateMutability === 'view' || selectedFunction.stateMutability === 'pure') {
        // Read function
        const data = await client.readContract({
          address: contractAddress,
          abi,
          functionName: selectedFunction.name,
          args
        });
        
        setResult(JSON.stringify(data, (_, value) => 
          typeof value === 'bigint' ? value.toString() : value
        ));
        setStatus('Read successful');
      } else {
        // Write function
        if (!walletClient || !connected) {
          setError('Wallet not connected. Please connect your wallet first.');
          return;
        }
        
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi,
          functionName: selectedFunction.name,
          args,
          account: accounts[0]
        });
        
        setResult(`Transaction sent: ${hash}`);
        setStatus('Write transaction submitted');
      }
    } catch (err) {
      setError(`Error executing function: ${err.message}`);
    }
  };

  return (
    <div className="container">
      <h1>Smart Contract Interaction Tool</h1>
      
      <div className="network-section">
        <h2>Network Settings</h2>
        <div className="form-group">
          <label>Select Network:</label>
          <select 
            value={selectedChain} 
            onChange={(e) => setSelectedChain(e.target.value)}
          >
            <option value="localhost">Localhost</option>
            <option value="mainnet">Ethereum Mainnet</option>
            <option value="sepolia">Sepolia Testnet</option>
            <option value="goerli">Goerli Testnet</option>
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
              placeholder="e.g., https://rpc.example.com"
            />
          </div>
        )}
        
        <button onClick={connectWallet} className="button">
          {connected ? 'Wallet Connected' : 'Connect Wallet'}
        </button>
      </div>
      
      <div className="contract-section">
        <h2>Contract Configuration</h2>
        <div className="form-group">
          <label>Contract Address:</label>
          <input 
            type="text" 
            value={contractAddress} 
            onChange={(e) => setContractAddress(e.target.value)} 
            placeholder="0x..."
          />
        </div>
        
        <div className="form-group">
          <label>Contract ABI:</label>
          <textarea 
            value={contractAbi} 
            onChange={(e) => setContractAbi(e.target.value)} 
            placeholder="[{...}]"
            rows={5}
          />
          <div className="helper-text">Paste the raw ABI JSON array or an object containing an 'abi' field</div>
        </div>
        
        <button onClick={parseContractAbi} className="button">
          Parse ABI
        </button>
      </div>
      
      {functions.length > 0 && (
        <div className="functions-section">
          <h2>Contract Functions ({functions.length})</h2>
          <div className="functions-list">
            {functions.map(func => (
              <div 
                key={`${func.name}-${func.inputs.map(i => i.type).join('-')}`}
                className={`function-item ${selectedFunction && selectedFunction.name === func.name ? 'selected' : ''}`}
                onClick={() => handleFunctionSelect(func)}
              >
                <span className={`function-type ${func.stateMutability}`}>
                  {func.stateMutability || 'nonpayable'}
                </span>
                <span className="function-name">{func.name}</span>
                <span className="function-signature">
                  ({func.inputs.map(input => `${input.type} ${input.name}`).join(', ')})
                  {func.outputs && func.outputs.length > 0 ? 
                    ` → (${func.outputs.map(output => output.type).join(', ')})` : 
                    ''
                  }
                </span>
              </div>
            ))}
          </div>
          
          {selectedFunction && (
            <div className="function-interaction">
              <h3>Function: {selectedFunction.name}</h3>
              
              {selectedFunction.inputs.length > 0 && (
                <div className="function-inputs">
                  <h4>Inputs</h4>
                  {selectedFunction.inputs.map(input => (
                    <div key={input.name || `input-${Math.random()}`} className="form-group">
                      <label>{input.name || 'param'} ({input.type}):</label>
                      <input 
                        type="text" 
                        value={inputValues[input.name] || ''} 
                        onChange={(e) => handleInputChange(input.name || 'param', e.target.value)} 
                        placeholder={`${input.type}`}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <button onClick={executeFunction} className="button execute-button">
                {selectedFunction.stateMutability === 'view' || selectedFunction.stateMutability === 'pure' 
                  ? 'Read' : 'Write'}
              </button>
              
              {result && (
                <div className="result-box">
                  <h4>Result:</h4>
                  <pre>{result}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {status && <div className="status-message">{status}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default App;