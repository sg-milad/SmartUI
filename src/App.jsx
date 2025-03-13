import React, { useState, useEffect } from 'react';
import NetworkSettings from './components/NetworkSettings';
import StatusMessage from './components/StatusMessage';
import FunctionsList from './components/FunctionsList';
import EventsList from './components/EventsList';
import FunctionInteraction from './components/FunctionInteraction';
import EventInteraction from './components/EventInteraction';
import TransactionDetails from './components/TransactionDetails';
import './App.css';
import { 
  createPublicClient, 
  http, 
  createWalletClient, 
  custom, 
  decodeEventLog, 
  formatEther 
} from 'viem';
import { 
  hardhat, 
  mainnet, 
  sepolia, 
  goerli 
} from 'viem/chains';

function ContractSelector({ contracts, selectedContract, onContractSelect }) {
  return (
    <div className="contract-selector">
      <h2>Contract Selection</h2>
      <select 
        value={selectedContract || ''} 
        onChange={(e) => onContractSelect(e.target.value)}
        className="select-styled"
      >
        <option value="">Select a contract</option>
        {Object.keys(contracts).map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </div>
  );
}

function App() {
  // Basic state
  const [contracts, setContracts] = useState({});
  const [selectedContract, setSelectedContract] = useState('');
  const [newContractName, setNewContractName] = useState('');
  const [newContractAddress, setNewContractAddress] = useState('');
  const [newContractAbi, setNewContractAbi] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  
  // Add states for functions and events
  const [functions, setFunctions] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [result, setResult] = useState(null);
  const [client, setClient] = useState(null);
  const [walletClient, setWalletClient] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [isTransactionPending, setIsTransactionPending] = useState(false);

  // Add these state variables at the top with other state declarations
  const [selectedChain, setSelectedChain] = useState('hardhat');
  const [customRpc, setCustomRpc] = useState('');
  const [connected, setConnected] = useState(false);

  // Initialize web3 clients
  useEffect(() => {
    const publicClient = createPublicClient({
      chain: hardhat,
      transport: http()
    });
    setClient(publicClient);

    if (window.ethereum) {
      const wallet = createWalletClient({
        chain: hardhat,
        transport: custom(window.ethereum)
      });
      setWalletClient(wallet);
    }
  }, []);

  // Handle contract selection
  const handleContractSelect = (contractName) => {
    setSelectedContract(contractName);
    if (contractName && contracts[contractName]) {
      const contract = contracts[contractName];
      
      // Parse ABI to separate functions and events
      const abi = contract.abi;
      const contractFunctions = abi.filter(item => item.type === 'function');
      const contractEvents = abi.filter(item => item.type === 'event');
      
      setFunctions(contractFunctions);
      setEvents(contractEvents);
      setStatus(`Loaded contract: ${contractName}`);
    } else {
      setFunctions([]);
      setEvents([]);
      setSelectedFunction(null);
      setSelectedEvent(null);
    }
  };

  // Handle function selection
  const handleFunctionSelect = (func) => {
    setSelectedFunction(func);
    setInputValues({}); // Reset input values
    setResult(null); // Reset result
    setStatus(`Selected function: ${func.name}`);
  };

  // Handle event selection
  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setStatus(`Selected event: ${event.name}`);
  };

  // Handle input change
  const handleInputChange = (name, value) => {
    setInputValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Execute function
  const executeFunction = async () => {
    if (!client || !walletClient) {
      setError('Web3 client not initialized');
      return;
    }

    if (!selectedContract || !contracts[selectedContract]) {
      setError('No contract selected');
      return;
    }

    // Create local variables to track state
    let localStatus = 'Preparing transaction...';
    let localError = '';
    let localResult = null;
    let localTransactionDetails = null;

    setIsTransactionPending(true);
    setStatus(localStatus);
    setError('');

    try {
      const contract = contracts[selectedContract];
      const { address, abi } = contract;

      // Prepare function arguments
      const args = selectedFunction.inputs.map(input => {
        const value = inputValues[input.name] || '';
        try {
          switch (input.type) {
            case 'uint256':
              return BigInt(value);
            case 'bool':
              return value.toLowerCase() === 'true';
            case 'address':
              return value;
            case 'string':
              return value;
            default:
              if (input.type.includes('[]')) {
                return JSON.parse(value);
              }
              return value;
          }
        } catch (err) {
          throw new Error(`Invalid input for ${input.name} (${input.type}): ${value}`);
        }
      });

      if (selectedFunction.stateMutability === 'view' || selectedFunction.stateMutability === 'pure') {
        // Read function
        const result = await client.readContract({
          address,
          abi,
          functionName: selectedFunction.name,
          args
        });
        localResult = typeof result === 'bigint' ? result.toString() : JSON.stringify(result, null, 2);
      } else {
        // Write function
        try {
          const [account] = await walletClient.requestAddresses();
          localStatus = 'Waiting for wallet approval...';
          setStatus(localStatus);

          const hash = await walletClient.writeContract({
            address,
            abi,
            functionName: selectedFunction.name,
            args,
            account
          });

          localStatus = `Transaction submitted: ${hash}`;
          setStatus(localStatus);

          const receipt = await client.waitForTransactionReceipt({ hash });

          const events = receipt.logs.map(log => {
            try {
              const event = decodeEventLog({
                abi,
                data: log.data,
                topics: log.topics,
              });

              return {
                eventName: event.eventName,
                args: Object.entries(event.args).reduce((acc, [key, value]) => {
                  acc[key] = typeof value === 'bigint' ? value.toString() : value;
                  return acc;
                }, {}),
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash
              };
            } catch (e) {
              return {
                eventName: 'Unknown',
                args: { data: log.data, topics: log.topics },
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash
              };
            }
          });

          localTransactionDetails = {
            hash: receipt.transactionHash,
            blockNumber:Number( receipt.blockNumber),
            gasUsed: receipt.gasUsed.toString(),
            effectiveGasPrice: formatEther(receipt.effectiveGasPrice),
            status: receipt.status == "success" ? "Success" : "Failed",
            events
          };
          console.log("status",receipt);
          

          localResult = `Transaction successful! Hash: ${hash}`;
        } catch (err) {
          if (err.message.includes('revert')) {
            const revertReason = err.message.match(/reason: ['"](.*?)['"]/)?.[1] || 'Unknown reason';
            throw new Error(`Transaction reverted: ${revertReason}`);
          }
          throw err;
        }
      }

      localStatus = 'Function executed successfully';
    } catch (err) {
      console.error('Function execution error:', err);
      localError = `Failed to execute function: ${err.message}`;
    } finally {
      // Update all states at once at the end
      setIsTransactionPending(false);
      setStatus(localStatus);
      setError(localError);
      if (localResult) setResult(localResult);
      if (localTransactionDetails) setTransactionDetails(localTransactionDetails);
    }
  };

  // Add contract function
  const addContract = () => {
    try {
      if (!newContractName || !newContractAddress || !newContractAbi) {
        setError('Please fill in all contract details');
        return;
      }

      const parsedAbi = JSON.parse(newContractAbi);
      
      setContracts(prev => ({
        ...prev,
        [newContractName]: {
          address: newContractAddress,
          abi: parsedAbi
        }
      }));

      // Reset form
      setNewContractName('');
      setNewContractAddress('');
      setNewContractAbi('');
      setStatus(`Contract ${newContractName} added successfully`);
      setError('');
    } catch (err) {
      setError(`Failed to add contract: ${err.message}`);
    }
  };

  // Add this function to handle wallet connection
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('No wallet found! Please install MetaMask.');
      }

      const [account] = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      // Initialize wallet client with selected chain
      const chain = selectedChain === 'hardhat' ? hardhat :
                   selectedChain === 'mainnet' ? mainnet :
                   selectedChain === 'sepolia' ? sepolia :
                   selectedChain === 'goerli' ? goerli : null;

      if (!chain) {
        throw new Error('Invalid chain selected');
      }

      const transport = selectedChain === 'custom' 
        ? http(customRpc)
        : http();

      const publicClient = createPublicClient({
        chain,
        transport
      });

      const wallet = createWalletClient({
        chain,
        transport: custom(window.ethereum)
      });

      setClient(publicClient);
      setWalletClient(wallet);
      setConnected(true);
      setStatus(`Connected to wallet: ${account}`);
    } catch (err) {
      setError(`Failed to connect wallet: ${err.message}`);
      setConnected(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Smart Contract Interaction Tool</h1>
      </header>

      <main className="main-content">
        <section className="network-section card">
          <NetworkSettings
            selectedChain={selectedChain}
            setSelectedChain={setSelectedChain}
            customRpc={customRpc}
            setCustomRpc={setCustomRpc}
            connected={connected}
            connectWallet={connectWallet}
          />
        </section>

        <section className="contract-management">
          {/* Add Contract Form */}
          <div className="card add-contract-form">
            <h2>Add New Contract</h2>
            <div className="form-group">
              <label>Contract Name:</label>
              <input
                type="text"
                placeholder="e.g., USDT, GoalKeeper"
                value={newContractName}
                onChange={(e) => setNewContractName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Contract Address:</label>
              <input
                type="text"
                placeholder="0x..."
                value={newContractAddress}
                onChange={(e) => setNewContractAddress(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Contract ABI:</label>
              <textarea
                placeholder="Paste ABI JSON here..."
                value={newContractAbi}
                onChange={(e) => setNewContractAbi(e.target.value)}
              />
            </div>
            <button className="button primary" onClick={addContract}>
              Add Contract
            </button>
          </div>

          {/* Contract Selector */}
          <div className="card">
            <ContractSelector
              contracts={contracts}
              selectedContract={selectedContract}
              onContractSelect={handleContractSelect}
            />
          </div>
        </section>

        {/* Display Functions and Events when a contract is selected */}
        {selectedContract && (
          <section className="contract-interaction">
            <div className="functions-events-container">
              <div className="card">
                <FunctionsList 
                  functions={functions}
                  selectedFunction={selectedFunction}
                  onFunctionSelect={handleFunctionSelect}
                />
              </div>
              <div className="card">
                <EventsList 
                  events={events}
                  selectedEvent={selectedEvent}
                  onEventSelect={handleEventSelect}
                />
              </div>
            </div>
          </section>
        )}

        {selectedFunction && (
          <div className="card">
            <FunctionInteraction
              selectedFunction={selectedFunction}
              inputValues={inputValues}
              onInputChange={handleInputChange}
              onExecute={executeFunction}
              result={result}
              isTransactionPending={isTransactionPending}
            />
          </div>
        )}

        {transactionDetails && (
          <div className="card">
            <TransactionDetails details={transactionDetails} />
          </div>
        )}

        <StatusMessage status={status} error={error} />
      </main>
    </div>
  );
}

export default App;