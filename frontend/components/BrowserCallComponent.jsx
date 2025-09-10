import React, { useState, useEffect } from 'react';
import { Device } from '@twilio/voice-sdk';

const BrowserCallComponent = () => {
  const [device, setDevice] = useState(null);
  const [connection, setConnection] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState('');
  const [toNumber, setToNumber] = useState('');
  const [callStatus, setCallStatus] = useState('idle');
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [selectedFromNumber, setSelectedFromNumber] = useState('');

  // Initialize Twilio Device
  useEffect(() => {
    const initDevice = async () => {
      try {
        const response = await fetch('/api/twilio/access-token', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to get access token');
        }

        const { token, availableNumbers } = await response.json();
        setAvailableNumbers(availableNumbers || []);
        
        if (availableNumbers && availableNumbers.length > 0) {
          setSelectedFromNumber(availableNumbers[0].phoneNumber);
        }
        
        const dev = new Device(token, {
          debug: true,
          enableRingingState: true
        });
        
        dev.on('ready', () => {
          setCallStatus('ready');
          setError('');
        });
        
        dev.on('connect', (conn) => {
          setConnection(conn);
          setIsConnected(true);
          setIsCalling(false);
          setCallStatus('connected');
        });
        
        dev.on('disconnect', () => {
          setConnection(null);
          setIsConnected(false);
          setIsCalling(false);
          setCallStatus('idle');
        });
        
        dev.on('error', (error) => {
          if (error.code === 31005 || error.message.includes('HANGUP')) {
            setConnection(null);
            setIsConnected(false);
            setIsCalling(false);
            setCallStatus('idle');
          } else {
            setError(`Device error: ${error.message}`);
            setCallStatus('error');
          }
        });
        
        setDevice(dev);
      } catch (error) {
        setError(`Failed to initialize: ${error.message}`);
        setCallStatus('error');
      }
    };

    initDevice();

    // Cleanup on unmount
    return () => {
      if (device) {
        device.destroy();
      }
    };
  }, []);

  const makeCall = async () => {
    if (!device || isCalling || isConnected) return;
    if (!toNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    try {
      setIsCalling(true);
      setCallStatus('calling');
      setError('');
      
      const conn = await device.connect({ 
        To: toNumber,
        From: selectedFromNumber
      });
      setConnection(conn);
      
    } catch (error) {
      if (error.code === 31005 || error.message.includes('HANGUP')) {
        setError('');
        setCallStatus('idle');
      } else {
        setError(`Call failed: ${error.message}`);
        setCallStatus('error');
      }
      setIsCalling(false);
    }
  };

  const hangUp = () => {
    if (connection) {
      connection.disconnect();
    }
    setConnection(null);
    setIsConnected(false);
    setIsCalling(false);
    setCallStatus('idle');
    setError('');
  };

  const toggleMute = () => {
    if (connection) {
      const muted = !connection.isMuted();
      connection.mute(muted);
      setIsMuted(muted);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h2>🎙️ Browser Call</h2>
      
      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffe6e6', 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '10px' 
        }}>
          ❌ {error}
        </div>
      )}
      
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '10px', 
        borderRadius: '5px', 
        marginBottom: '20px' 
      }}>
        <p><strong>Status:</strong> {callStatus}</p>
        <p><strong>Device Ready:</strong> {device ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Muted:</strong> {isMuted ? '✅ Yes' : '❌ No'}</p>
      </div>
      
      {!isConnected ? (
        <div>
          {availableNumbers.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="fromNumber" style={{ display: 'block', marginBottom: '5px' }}>
                Call From:
              </label>
              <select
                id="fromNumber"
                value={selectedFromNumber}
                onChange={(e) => setSelectedFromNumber(e.target.value)}
                disabled={isCalling}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  border: '1px solid #ccc' 
                }}
              >
                {availableNumbers.map(number => (
                  <option key={number.phoneNumber} value={number.phoneNumber}>
                    {number.phoneNumber} {number.friendlyName ? `(${number.friendlyName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="toNumber" style={{ display: 'block', marginBottom: '5px' }}>
              Phone Number to Call:
            </label>
            <input
              id="toNumber"
              type="tel"
              value={toNumber}
              onChange={(e) => setToNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              disabled={isCalling}
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '5px', 
                border: '1px solid #ccc' 
              }}
            />
          </div>
          
          <button 
            onClick={makeCall} 
            disabled={!device || isCalling || !toNumber.trim()}
            style={{
              backgroundColor: isCalling ? '#ccc' : '#007bff',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: isCalling ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {isCalling ? '📞 Connecting...' : '🎙️ Start Call'}
          </button>
        </div>
      ) : (
        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '15px', 
          borderRadius: '5px', 
          textAlign: 'center' 
        }}>
          <h3>📞 Connected to {toNumber}</h3>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={toggleMute}
              style={{
                backgroundColor: isMuted ? '#dc3545' : '#28a745',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {isMuted ? '🔇 Unmute' : '🎤 Mute'}
            </button>
            <button 
              onClick={hangUp}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              📞 Hang Up
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowserCallComponent;
