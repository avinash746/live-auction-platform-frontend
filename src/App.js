import React, { useState, useEffect, useCallback } from 'react';
import AuctionCard from './components/AuctionCard';
import Notification from './components/Notification';
import socketService from './services/socketService';
import apiService from './services/apiService';
import './App.css';

function App() {
  const [items, setItems] = useState([]);
  const [serverTime, setServerTime] = useState(Date.now());
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [autoReconnect, setAutoReconnect] = useState(true);

  // Show notification
  const showNotification = useCallback((message, type) => {
    setNotification({ message, type, id: Date.now() });
  }, []);

  // Hide notification
  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Manual disconnect
  const handleDisconnect = useCallback(() => {
    socketService.disconnect();
    setConnected(false);
    setCurrentUserId(null);
    showNotification('Disconnected from server', 'info');
  }, [showNotification]);

  // Manual reconnect
  const handleReconnect = useCallback(() => {
    console.log('🔄 Reconnect button clicked');
    showNotification('Reconnecting to server...', 'info');
    
    // Reconnect socket
    socketService.reconnect();
    
    // Note: connected state will be updated by the 'connect' event listener
    // which is already set up in the useEffect below
  }, [showNotification]);

  // Toggle auto-reconnect
  const toggleAutoReconnect = useCallback(() => {
    setAutoReconnect(prev => {
      const newValue = !prev;
      socketService.setAutoReconnect(newValue);
      showNotification(
        `Auto-reconnect ${newValue ? 'enabled' : 'disabled'}`,
        'info'
      );
      return newValue;
    });
  }, [showNotification]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await apiService.getItems();
        setItems(response.data);
        setServerTime(response.serverTime);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        showNotification('Failed to load auction items', 'error');
        setLoading(false);
      }
    };

    loadInitialData();
  }, [showNotification]);

  // Initialize Socket.io connection
  useEffect(() => {
    const socket = socketService.connect();
    setCurrentUserId(socket.id);

    // Connection events
    socketService.on('connect', () => {
      console.log('✅ Socket connected');
      setConnected(true);
      setCurrentUserId(socketService.socket.id);
      showNotification('Connected to auction server', 'success');
    });

    socketService.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
      showNotification('Disconnected from server', 'warning');
    });

    socketService.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setConnected(true);
      setCurrentUserId(socketService.socket.id);
      showNotification('Reconnected to server!', 'success');
    });

    // Initial data from server
    socketService.on('INITIAL_DATA', (data) => {
      console.log('Received initial data:', data);
      setItems(data.items);
      setServerTime(data.serverTime);
    });

    // Bid update event
    socketService.on('UPDATE_BID', (data) => {
      console.log('Bid update:', data);
      
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === data.itemId
            ? {
                ...item,
                currentBid: data.currentBid,
                highestBidder: data.highestBidder,
                bidCount: (item.bidCount || 0) + 1
              }
            : item
        )
      );

      // Show notification if this user placed the winning bid
      if (data.highestBidder === socketService.socket?.id) {
        showNotification('Your bid has been placed!', 'success');
      }
    });

    // Bid success event
    socketService.on('BID_SUCCESS', (data) => {
      console.log('Bid success:', data);
    });

    // Bid error event
    socketService.on('BID_ERROR', (data) => {
      console.log('Bid error:', data);
      showNotification(data.message, 'error');
    });

    // Outbid event
    socketService.on('OUTBID', (data) => {
      console.log('You were outbid:', data);
      showNotification(
        `You've been outbid on an item! New bid: $${data.currentBid}`,
        'outbid'
      );
    });

    // Auction ended event
    socketService.on('AUCTION_ENDED', (data) => {
      console.log('Auction ended:', data);
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === data.itemId
            ? { ...item, isActive: false }
            : item
        )
      );
    });

    // Time sync event
    socketService.on('TIME_SYNC', (data) => {
      setServerTime(data.serverTime);
    });

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [showNotification]);

  // Periodic time sync
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (connected) {
        socketService.requestSync();
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [connected]);

  // Handle bid placement
  const handleBid = useCallback((itemId, bidAmount) => {
    if (!connected) {
      showNotification('Not connected to server', 'error');
      return;
    }

    socketService.placeBid(itemId, bidAmount);
  }, [connected, showNotification]);

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading auctions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">🔨</span>
            Live Auction Platform
          </h1>
          
          <div className="header-controls">
            {/* Connection Status */}
            <div className="connection-status">
              <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
              <span className="status-text">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Connection Controls */}
            <div className="connection-controls">
              {connected ? (
                <button 
                  className="control-button disconnect-btn"
                  onClick={handleDisconnect}
                  title="Disconnect from server"
                >
                  <span className="button-icon">🔌</span>
                  Disconnect
                </button>
              ) : (
                <button 
                  className="control-button reconnect-btn"
                  onClick={handleReconnect}
                  title="Reconnect to server"
                >
                  <span className="button-icon">🔄</span>
                  Reconnect
                </button>
              )}
              
              {/* Auto-reconnect Toggle */}
              <button 
                className={`control-button auto-reconnect-btn ${autoReconnect ? 'active' : ''}`}
                onClick={toggleAutoReconnect}
                title={`Auto-reconnect: ${autoReconnect ? 'ON' : 'OFF'}`}
              >
                <span className="button-icon">⚡</span>
                Auto-reconnect: {autoReconnect ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <div className="auction-grid">
          {items.map((item) => (
            <AuctionCard
              key={item.id}
              item={item}
              onBid={handleBid}
              currentUserId={currentUserId}
              serverTime={serverTime}
            />
          ))}
        </div>

        {items.length === 0 && (
          <div className="empty-state">
            <p>No auctions available at the moment.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Built with React, Node.js & Socket.io | Real-time Bidding Platform
        </p>
      </footer>

      {/* Notifications */}
      {notification && (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
    </div>
  );
}

export default App;