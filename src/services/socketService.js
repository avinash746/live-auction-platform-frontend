import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.autoReconnectEnabled = true;
  }

  /**
   * Connect to Socket.io server
   */
  connect() {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    // Disconnect existing connection if any
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: this.autoReconnectEnabled,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      this.connected = false;
      
      if (reason === 'io server disconnect') {
        console.log('Server forcefully disconnected the socket');
      } else if (reason === 'io client disconnect') {
        console.log('Client manually disconnected');
      } else if (reason === 'transport close') {
        console.log('Connection lost (network issue)');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      this.connected = true;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after all attempts');
      this.connected = false;
    });

    return this.socket;
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Manually disconnecting from server...');
      this.socket.disconnect();
      this.connected = false;
    }
  }

  /**
   * Reconnect to server
   */
  reconnect() {
    console.log('🔄 Manually reconnecting to server...');
    if (this.socket && !this.connected) {
      this.socket.connect();
    } else {
      this.connect();
    }
  }

  /**
   * Set auto-reconnect behavior
   * @param {boolean} enabled - Enable or disable auto-reconnect
   */
  setAutoReconnect(enabled) {
    this.autoReconnectEnabled = enabled;
    
    if (this.socket && this.socket.io) {
      this.socket.io.opts.reconnection = enabled;
      console.log(`⚡ Auto-reconnect ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Get auto-reconnect status
   * @returns {boolean}
   */
  getAutoReconnect() {
    return this.autoReconnectEnabled;
  }

  /**
   * Emit event to server
   */
  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      console.error('Socket not connected');
    }
  }

  /**
   * Listen to server event
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      
      // Store listener for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      // Remove from stored listeners
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
      this.listeners.delete(event);
    }
  }

  /**
   * Place a bid
   */
  placeBid(itemId, bidAmount) {
    this.emit('BID_PLACED', { itemId, bidAmount });
  }

  /**
   * Request time sync
   */
  requestSync() {
    this.emit('REQUEST_SYNC');
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

// Create singleton instance
const socketServiceInstance = new SocketService();

// Export singleton instance
export default socketServiceInstance;
