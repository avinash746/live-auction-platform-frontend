import React from 'react';
import './ConnectionManager.css';

const ConnectionManager = ({ 
  connected, 
  onDisconnect, 
  onReconnect, 
  autoReconnect, 
  onToggleAutoReconnect 
}) => {
  return (
    <div className="connection-manager">
      {/* Connection Status */}
      <div className="connection-status-detailed">
        <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`}>
          <span className="dot-pulse"></span>
        </div>
        <div className="status-info">
          <span className="status-label">
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          <span className="status-description">
            {connected 
              ? 'Real-time updates active' 
              : 'Click reconnect to resume'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="connection-actions">
        {connected ? (
          <button 
            className="action-btn disconnect-btn"
            onClick={onDisconnect}
            title="Disconnect from server"
          >
            <span className="btn-icon">🔌</span>
            <span className="btn-text">Disconnect</span>
          </button>
        ) : (
          <button 
            className="action-btn reconnect-btn"
            onClick={onReconnect}
            title="Reconnect to server"
          >
            <span className="btn-icon">🔄</span>
            <span className="btn-text">Reconnect</span>
          </button>
        )}

        {/* Auto-reconnect Toggle */}
        <button 
          className={`action-btn toggle-btn ${autoReconnect ? 'active' : 'inactive'}`}
          onClick={onToggleAutoReconnect}
          title={`Auto-reconnect is ${autoReconnect ? 'ON' : 'OFF'}`}
        >
          <span className="btn-icon">{autoReconnect ? '⚡' : '⚫'}</span>
          <span className="btn-text">
            Auto-reconnect: {autoReconnect ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ConnectionManager;