import React, { useState, useEffect } from 'react';
import { useCountdown } from '../hooks/useCountdown';
import './AuctionCard.css';

const AuctionCard = ({ item, onBid, currentUserId, serverTime }) => {
  const [bidding, setBidding] = useState(false);
  const [flashState, setFlashState] = useState('none'); // none, green, red
  const { formattedTime, isExpired, isLastMinute, isLastTenSeconds } = useCountdown(
    item.endTime,
    serverTime
  );

  const isWinning = item.highestBidder === currentUserId && !isExpired;
  const nextBidAmount = item.currentBid + 10;

  // Handle bid button click
  const handleBid = async () => {
    if (bidding || isExpired) return;

    setBidding(true);
    try {
      await onBid(item.id, nextBidAmount);
    } catch (error) {
      console.error('Bid error:', error);
    } finally {
      // Keep button disabled briefly to prevent spam
      setTimeout(() => setBidding(false), 1000);
    }
  };

  // Flash animation on bid update
  useEffect(() => {
    if (item.currentBid > item.startingPrice) {
      setFlashState('green');
      const timer = setTimeout(() => setFlashState('none'), 500);
      return () => clearTimeout(timer);
    }
  }, [item.currentBid, item.startingPrice]);

  return (
    <div className={`auction-card ${flashState} ${isExpired ? 'expired' : ''}`}>
      {/* Image */}
      <div className="card-image-container">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="card-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
        
        {/* Timer Badge */}
        <div className={`timer-badge ${isExpired ? 'expired' : ''} ${isLastTenSeconds ? 'critical' : isLastMinute ? 'warning' : ''}`}>
          <span className="timer-icon">⏱️</span>
          <span className="timer-text">
            {isExpired ? 'ENDED' : formattedTime}
          </span>
        </div>

        {/* Winning Badge */}
        {isWinning && (
          <div className="winning-badge">
            <span className="badge-icon">👑</span>
            <span className="badge-text">You're Winning!</span>
          </div>
        )}

        {/* Ended Badge */}
        {isExpired && (
          <div className="ended-overlay">
            <span className="ended-text">AUCTION ENDED</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="card-content">
        <h3 className="card-title">{item.title}</h3>
        <p className="card-description">{item.description}</p>

        {/* Price Info */}
        <div className="price-section">
          <div className="price-label">Current Bid</div>
          <div className="price-amount">${item.currentBid.toLocaleString()}</div>
          {item.bidCount > 0 && (
            <div className="bid-count">{item.bidCount} bid{item.bidCount !== 1 ? 's' : ''}</div>
          )}
        </div>

        {/* Bid Button */}
        {!isExpired && (
          <button
            className={`bid-button ${bidding ? 'bidding' : ''} ${isWinning ? 'winning' : ''}`}
            onClick={handleBid}
            disabled={bidding}
          >
            {bidding ? (
              <>
                <span className="button-spinner"></span>
                Placing Bid...
              </>
            ) : (
              <>
                <span className="button-icon">💰</span>
                Bid ${nextBidAmount.toLocaleString()}
              </>
            )}
          </button>
        )}

        {isExpired && item.highestBidder === currentUserId && (
          <div className="winner-message">
            <span className="winner-icon">🎉</span>
            <span>You won this auction!</span>
          </div>
        )}

        {isExpired && item.highestBidder && item.highestBidder !== currentUserId && (
          <div className="lost-message">
            <span>Auction won by another bidder</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionCard;