import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export type StompLogEntry = { timestamp: Date; type: 'info' | 'error' | 'event'; message: string; payload?: unknown };

interface UseStompClientParams {
  baseUrl: string;
  token: string;
  chatId: string;
  onMessage: (message: IMessage) => void;
}

export function useStompClient({ baseUrl, token, chatId, onMessage }: UseStompClientParams) {
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<StompLogEntry[]>([]);

  const appendLog = useCallback((entry: StompLogEntry) => {
    setLogs((prev) => [...prev, entry]);
  }, []);

  const disconnect = useCallback(() => {
    subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    subscriptionsRef.current = [];
    clientRef.current?.deactivate();
    setIsConnected(false);
    appendLog({ type: 'info', timestamp: new Date(), message: 'Disconnected from WebSocket' });
  }, [appendLog]);

  const connect = useCallback(
    (topics: string[]) => {
      if (!baseUrl || !token) {
        appendLog({ type: 'error', timestamp: new Date(), message: 'Base URL и токен обязательны для подключения' });
        return;
      }

      const wsUrl = `${baseUrl.replace(/^http/, 'ws')}/ws`;
      const client = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          appendLog({ type: 'info', timestamp: new Date(), message: 'Connected to WebSocket' });
          setIsConnected(true);
          subscriptionsRef.current = topics.map((topic) =>
            client.subscribe(topic, (message) => {
              appendLog({ type: 'event', timestamp: new Date(), message: `Received ${topic}`, payload: message.body });
              onMessage(message);
            })
          );
        },
        onWebSocketError: (event) => appendLog({ type: 'error', timestamp: new Date(), message: 'WebSocket error', payload: event }),
        onStompError: (frame) => appendLog({ type: 'error', timestamp: new Date(), message: 'Broker error', payload: frame }),
        debug: (str) => appendLog({ type: 'info', timestamp: new Date(), message: str }),
      });

      client.activate();
      clientRef.current = client;
    },
    [appendLog, baseUrl, onMessage, token]
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const send = useCallback(
    (destination: string, body: unknown) => {
      if (!clientRef.current || !isConnected) {
        appendLog({ type: 'error', timestamp: new Date(), message: 'Not connected' });
        return;
      }
      clientRef.current.publish({ destination, body: JSON.stringify(body) });
      appendLog({ type: 'info', timestamp: new Date(), message: `Sent to ${destination}`, payload: body });
    },
    [appendLog, isConnected]
  );

  return useMemo(
    () => ({ isConnected, connect, disconnect, send, logs }),
    [connect, disconnect, isConnected, logs, send]
  );
}
