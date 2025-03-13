import React, { useState, useEffect } from 'react';
import { 
  createPublicClient, 
  http,
  createWalletClient,
  custom,
  decodeEventLog,
  formatEther,
  formatGwei
} from 'viem';
import { hardhat, mainnet, sepolia, goerli } from 'viem/chains';
import NetworkSettings from './components/NetworkSettings';
import ContractConfig from './components/ContractConfig';
import FunctionsList from './components/FunctionsList';
import EventsList from './components/EventsList';
import FunctionInteraction from './components/FunctionInteraction';
import EventInteraction from './components/EventInteraction';
import TransactionDetails from './components/TransactionDetails';
import StatusMessage from './components/StatusMessage';

function App() {
  const [contractAddress, setContractAddress] = useState('');
  const [contractAbi, setContractAbi] = useState('');
  const [selectedChain, setSelectedChain] = useState('localhost');
  const [customRpc, setCustomRpc] = useState('http://localhost:8545');
  const [client, setClient] = useState(null);
  const [walletClient, setWalletClient] = useState(null);
  const [abi, setAbi] = useState(null);
  const [functions, setFunctions] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [eventFilterValues, setEventFilterValues] = useState({});
  const [result, setResult] = useState(null);
  const [eventLogs, setEventLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [fromBlock, setFromBlock] = useState('');
  const [toBlock, setToBlock] = useState('');

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
      setError('');
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
      setError('');
    } catch (err) {
      setError(`Failed to connect wallet: ${err.message}`);
    }
  };

  // Parse ABI when the ABI string changes
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
      
      // Extract event definitions from ABI
      const abiEvents = validAbi.filter(item => item.type === 'event');
      setEvents(abiEvents);
      
      setStatus(`ABI parsed successfully. Found ${abiFunctions.length} function(s) and ${abiEvents.length} event(s).`);
      setError('');
    } catch (err) {
      setError(`Failed to parse ABI: ${err.message}`);
    }
  };

  // Handle function selection
  const handleFunctionSelect = (func) => {
    setSelectedFunction(func);
    setSelectedEvent(null);
    setInputValues({});  // Reset input values
    setResult(null);     // Reset results
    setTransactionDetails(null); // Reset transaction details
  };

  // Handle event selection
  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setSelectedFunction(null);
    setEventFilterValues({}); // Reset filter values
    setEventLogs([]);         // Reset event logs
  };

  // Handle input changes
  const handleInputChange = (name, value) => {
    setInputValues(prev => ({ ...prev, [name]: value }));
  };

  // Handle event filter input changes
  const handleEventFilterChange = (name, value) => {
    setEventFilterValues(prev => ({ ...prev, [name]: value }));
  };

  // Get past events
  const getEvents = async () => {
    if (!contractAddress || !selectedEvent || !client || !abi) {
      setError('Missing required information for fetching events');
      return;
    }

    try {
      setStatus('Fetching events...');
      setError('');
      setEventLogs([]);
      
      // Prepare filter topics based on indexed parameters
      const indexedInputs = selectedEvent.inputs.filter(input => input.indexed);
      
      // Create filter object
      const filter = {
        address: contractAddress,
        event: selectedEvent,
        fromBlock: fromBlock ? BigInt(fromBlock) : undefined,
        toBlock: toBlock ? BigInt(toBlock) : undefined,
      };
      
      // Add indexed parameter filters if provided
      if (indexedInputs.length > 0) {
        const args = {};
        
        indexedInputs.forEach(input => {
          const value = eventFilterValues[input.name];
          if (value && value.trim() !== '') {
            args[input.name] = value;
          }
        });
        
        if (Object.keys(args).length > 0) {
          filter.args = args;
        }
      }

      // Get the logs
      const logs = await client.getLogs(filter);
      
      // Process logs to make them more readable
      const processedLogs = logs.map((log, index) => {
        try {
          // Decode the log data
          const decoded = decodeEventLog({
            abi,
            data: log.data,
            topics: log.topics,
          });
          
          return {
            id: index,
            blockNumber: Number(log.blockNumber),
            blockHash: log.blockHash,
            transactionHash: log.transactionHash,
            eventName: selectedEvent.name,
            args: decoded.args,
            rawLog: log
          };
        } catch (decodeErr) {
          return {
            id: index,
            blockNumber: Number(log.blockNumber),
            blockHash: log.blockHash,
            transactionHash: log.transactionHash,
            eventName: selectedEvent.name,
            decodeError: decodeErr.message,
            rawLog: log
          };
        }
      });
      
      setEventLogs(processedLogs);
      setStatus(`Found ${processedLogs.length} event logs`);
    } catch (err) {
      setError(`Error fetching events: ${err.message}`);
    }
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
      setTransactionDetails(null);
      
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
        
        try {
          // Get gas estimate first to check for potential reverts
          const gasEstimate = await client.estimateContractGas({
            address: contractAddress,
            abi,
            functionName: selectedFunction.name,
            args,
            account: accounts[0]
          });
          
          // If we get here, gas estimate was successful, now execute the transaction
          const hash = await walletClient.writeContract({
            address: contractAddress,
            abi,
            functionName: selectedFunction.name,
            args,
            account: accounts[0]
          });
          
          setResult(`Transaction sent: ${hash}`);
          setStatus('Write transaction submitted');
          
          // Wait for transaction receipt to get more details
          const receipt = await client.waitForTransactionReceipt({ 
            hash,
            confirmations: 1
          });
          
          // Check if transaction succeeded or reverted
          if (receipt.status === 'success') {
            setStatus('Transaction successful!');
            
            // Parse events from the receipt
            const events = receipt.logs.map(log => {
              try {
                const decoded = decodeEventLog({
                  abi,
                  data: log.data,
                  topics: log.topics,
                });
                return {
                  eventName: decoded.eventName,
                  args: decoded.args,
                  address: log.address,
                  blockNumber: Number(log.blockNumber),
                  transactionHash: log.transactionHash,
                  logIndex: Number(log.logIndex)
                };
              } catch (e) {
                return {
                  eventName: 'Unknown',
                  rawLog: log,
                  error: 'Could not decode event'
                };
              }
            });
            
            // Get transaction details
            const txDetails = await client.getTransaction({ hash });
            
            setTransactionDetails({
              hash: receipt.transactionHash,
              blockNumber: Number(receipt.blockNumber),
              gasUsed: formatGwei(receipt.gasUsed),
              effectiveGasPrice: formatGwei(receipt.effectiveGasPrice),
              status: receipt.status,
              events: events,
              from: txDetails.from,
              to: txDetails.to,
              value: txDetails.value ? formatEther(txDetails.value) : '0',
              nonce: txDetails.nonce
            });
          } else {
            setError('Transaction reverted');
          }
        } catch (err) {
          // Handle revert errors more explicitly
          setError(formatRevertError(err));
        }
      }
    } catch (err) {
      setError(formatRevertError(err));
    }
  };
  
  // Format revert errors to be more readable
  const formatRevertError = (error) => {
    // Check if it's a contract revert error
    if (error.message.includes('reverted') || error.message.includes('revert')) {
      let errorDetails = 'Transaction would revert';
      
      // Extract custom error message if available
      const revertReasonMatch = error.message.match(/reason="([^"]+)"/);
      if (revertReasonMatch && revertReasonMatch[1]) {
        errorDetails += `: "${revertReasonMatch[1]}"`;
      } 
      // Extract custom error name if available
      else if (error.message.includes('CUSTOM_ERROR')) {
        const customErrorMatch = error.message.match(/CUSTOM_ERROR\(([^)]+)\)/);
        if (customErrorMatch && customErrorMatch[1]) {
          errorDetails += `: Custom error "${customErrorMatch[1]}"`;
        }
      }
      
      // Add the gas estimation hint
      errorDetails += '\n\nThis usually indicates the transaction would fail on-chain. Possible reasons include:';
      errorDetails += '\n- Invalid parameters';
      errorDetails += '\n- Failed condition check in the contract';
      errorDetails += '\n- Insufficient permissions';
      errorDetails += '\n- Contract state preventing execution';
      
      return errorDetails;
    }
    
    // Handle other types of errors
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for gas * price + value';
    }
    
    // Default error handling
    return `Error executing function: ${error.message}`;
  };

  return (
    <div className="container">
      <h1>Smart Contract Interaction Tool</h1>
      
      <NetworkSettings
        selectedChain={selectedChain}
        setSelectedChain={setSelectedChain}
        customRpc={customRpc}
        setCustomRpc={setCustomRpc}
        connected={connected}
        connectWallet={connectWallet}
      />
      
      <ContractConfig
        contractAddress={contractAddress}
        setContractAddress={setContractAddress}
        contractAbi={contractAbi}
        setContractAbi={setContractAbi}
        parseContractAbi={parseContractAbi}
      />

      <div className="interaction-container">
        <div className="functions-container">
          <FunctionsList 
            functions={functions} 
            selectedFunction={selectedFunction}
            onFunctionSelect={handleFunctionSelect} 
          />
          <EventsList 
            events={events}
            selectedEvent={selectedEvent}
            onEventSelect={handleEventSelect}
          />
        </div>

        {selectedFunction && (
          <FunctionInteraction
            selectedFunction={selectedFunction}
            inputValues={inputValues}
            onInputChange={handleInputChange}
            onExecute={executeFunction}
            result={result}
          />
        )}

        {selectedEvent && (
          <EventInteraction
            selectedEvent={selectedEvent}
            filterValues={eventFilterValues}
            onFilterChange={handleEventFilterChange}
            fromBlock={fromBlock}
            toBlock={toBlock}
            setFromBlock={setFromBlock}
            setToBlock={setToBlock}
            onGetEvents={getEvents}
            eventLogs={eventLogs}
          />
        )}
      </div>

      {transactionDetails && (
        <TransactionDetails details={transactionDetails} />
      )}

      <StatusMessage status={status} error={error} />
    </div>
  );
}

export default App;