import React, { createContext, useContext, useEffect, useState } from 'react';

const RealtimeContext = createContext({
  isConnected: false,
  lastEvent: null,
  eventCounter: 0
});

export function RealtimeProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [eventCounter, setEventCounter] = useState(0);

  useEffect(() => {
    let ws;
    let reconnectTimer;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:5000`;
      
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastEvent(data);
            setEventCounter((c) => c + 1);
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimer = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setIsConnected(false);
          ws.close();
        };
      } catch (err) {
        setIsConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEvent, eventCounter }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
