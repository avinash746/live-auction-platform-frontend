import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for synchronized countdown timer
 * Prevents client-side timer manipulation
 */
export const useCountdown = (endTime, serverTime) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Calculate initial time offset between server and client
    const clientTime = Date.now();
    const timeOffset = serverTime - clientTime;

    const updateTimer = () => {
      // Use server-synchronized time
      const now = Date.now() + timeOffset;
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);

      // Clear interval when auction ends
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    // Update immediately
    updateTimer();

    // Update every 100ms for smooth countdown
    intervalRef.current = setInterval(updateTimer, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [endTime, serverTime]);

  // Format time remaining
  const formatTime = () => {
    const totalSeconds = Math.floor(timeRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isExpired = timeRemaining <= 0;
  const isLastMinute = timeRemaining <= 60000 && timeRemaining > 0;
  const isLastTenSeconds = timeRemaining <= 10000 && timeRemaining > 0;

  return {
    timeRemaining,
    formattedTime: formatTime(),
    isExpired,
    isLastMinute,
    isLastTenSeconds
  };
};