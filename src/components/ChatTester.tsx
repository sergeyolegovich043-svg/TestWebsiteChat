import {
  Badge,
  Box,
  Button,
  Code,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';
import { createApiClient } from '../api/client';
import { ChatDto, MessageDto, TypingEvent } from '../api/types';
import { useStompClient } from '../hooks/useStompClient';
import { destinations, topics } from '../ws/topics';

function formatDate(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}

const ChatTester = () => {
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [chats, setChats] = useState<ChatDto[]>([]);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [incoming, setIncoming] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState('TEXT');
  const [mediaUrl, setMediaUrl] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = useMemo(() => (baseUrl && token ? createApiClient(baseUrl, token) : null), [baseUrl, token]);

  const handleIncoming = useCallback(
    (message: unknown) => {
      setIncoming((prev) => [...prev, typeof message === 'string' ? message : JSON.stringify(message)]);
    },
    [setIncoming]
  );

  const { isConnected, connect, disconnect, send, logs } = useStompClient({
    baseUrl,
    token,
    chatId,
    onMessage: (message) => {
      try {
        const body = JSON.parse(message.body);
        handleIncoming(body);
      } catch (err) {
        handleIncoming(message.body);
      }
    },
  });

  const availableTopics = useMemo(() => (chatId ? [topics.chatMessages(chatId), topics.chatTyping(chatId)] : []), [chatId]);

  const loadChats = async () => {
    if (!api) return;
    setError(null);
    setLoadingChats(true);
    try {
      const data = await api.listChats();
      setChats(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async () => {
    if (!api || !chatId) return;
    setError(null);
    setLoadingMessages(true);
    try {
      const data = await api.listMessages(chatId);
      setMessages(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendRestMessage = async () => {
    if (!api || !chatId || !messageText) return;
    setError(null);
    try {
      const msg = await api.sendMessage(chatId, messageText, messageType, mediaUrl || undefined);
      setMessages((prev) => [...prev, msg]);
      setMessageText('');
      setMediaUrl('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const sendTyping = (isTyping: boolean) => {
    if (!chatId) return;
    const payload: TypingEvent = { chatId, isTyping };
    send(destinations.typing, payload);
  };

  return (
    <Stack spacing={6}>
      <Grid templateColumns={{ base: '1fr', md: '2fr 1fr' }} gap={6}>
        <GridItem>
          <VStack align="stretch" spacing={4}>
            <FormControl>
              <FormLabel>Базовый URL API</FormLabel>
              <Input placeholder="https://securechat.local" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>JWT токен</FormLabel>
              <Textarea placeholder="eyJ..." value={token} onChange={(e) => setToken(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Chat ID</FormLabel>
              <Input value={chatId} onChange={(e) => setChatId(e.target.value)} />
            </FormControl>
            <HStack>
              <Button colorScheme="blue" onClick={loadChats} isLoading={loadingChats} isDisabled={!api}>
                Загрузить чаты
              </Button>
              <Button colorScheme="blue" variant="outline" onClick={loadMessages} isLoading={loadingMessages} isDisabled={!api || !chatId}>
                Загрузить сообщения
              </Button>
            </HStack>
            {error && (
              <Box bg="red.50" borderRadius="md" p={3} borderWidth="1px" borderColor="red.200">
                <Text color="red.700">{error}</Text>
              </Box>
            )}
          </VStack>
        </GridItem>

        <GridItem>
          <Box borderWidth="1px" borderRadius="md" p={4} bg="white">
            <Flex align="center" justify="space-between" mb={3}>
              <Text fontWeight="bold">WebSocket</Text>
              <Badge colorScheme={isConnected ? 'green' : 'gray'}>{isConnected ? 'подключено' : 'отключено'}</Badge>
            </Flex>
            <HStack>
              <Button colorScheme="teal" onClick={() => connect(availableTopics)} isDisabled={!chatId || !token || isConnected}>
                Подключиться
              </Button>
              <Button onClick={disconnect} isDisabled={!isConnected}>
                Отключиться
              </Button>
            </HStack>
            <HStack mt={3}>
              <Button size="sm" onClick={() => sendTyping(true)} isDisabled={!isConnected}>
                Отправить typing
              </Button>
              <Button size="sm" variant="outline" onClick={() => sendTyping(false)} isDisabled={!isConnected}>
                Остановить typing
              </Button>
            </HStack>
          </Box>
        </GridItem>
      </Grid>

      <Grid templateColumns={{ base: '1fr', md: '2fr 1fr' }} gap={6} alignItems="start">
        <GridItem>
          <Box borderWidth="1px" borderRadius="md" p={4} bg="white">
            <Text fontWeight="bold" mb={3}>
              Сообщения чата
            </Text>
            <VStack align="stretch" spacing={3} maxH="320px" overflowY="auto">
              {messages.map((m) => (
                <Box key={m.id} p={3} borderWidth="1px" borderRadius="md">
                  <HStack justify="space-between" mb={1}>
                    <Text fontWeight="medium">{m.authorId}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {formatDate(m.createdAt)}
                    </Text>
                  </HStack>
                  <Text>{m.content}</Text>
                  <HStack mt={2} spacing={2}>
                    <Badge>{m.type}</Badge>
                    {m.mediaUrl && (
                      <Badge colorScheme="purple" title={m.mediaUrl}>
                        media
                      </Badge>
                    )}
                  </HStack>
                </Box>
              ))}
              {messages.length === 0 && <Text color="gray.500">Сообщений нет</Text>}
            </VStack>
            <Box mt={4}>
              <Text fontWeight="medium" mb={2}>
                Новое сообщение
              </Text>
              <Stack spacing={2}>
                <Textarea placeholder="Текст" value={messageText} onChange={(e) => setMessageText(e.target.value)} />
                <InputGroup>
                  <Input placeholder="Тип (TEXT|MEDIA)" value={messageType} onChange={(e) => setMessageType(e.target.value)} />
                  <InputRightElement width="6rem">
                    <Text fontSize="sm" color="gray.500">
                      {messageType}
                    </Text>
                  </InputRightElement>
                </InputGroup>
                <Input placeholder="Media URL (опционально)" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
                <Button colorScheme="blue" onClick={sendRestMessage} isDisabled={!api || !chatId || !messageText}>
                  Отправить через REST
                </Button>
              </Stack>
            </Box>
          </Box>
        </GridItem>

        <GridItem>
          <VStack align="stretch" spacing={4}>
            <Box borderWidth="1px" borderRadius="md" p={4} bg="white">
              <Text fontWeight="bold" mb={2}>
                Список чатов
              </Text>
              <VStack align="stretch" spacing={2}>
                {chats.map((chat) => (
                  <Box key={chat.id} p={2} borderWidth="1px" borderRadius="md">
                    <Text fontWeight="medium">{chat.name || chat.id}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {chat.type} · {chat.members?.length ?? 0} участника(ов)
                    </Text>
                  </Box>
                ))}
                {chats.length === 0 && <Text color="gray.500">Чаты не загружены</Text>}
              </VStack>
            </Box>

            <Box borderWidth="1px" borderRadius="md" p={4} bg="white">
              <Text fontWeight="bold" mb={2}>
                Входящие события
              </Text>
              <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto">
                {[...incoming].reverse().map((item, index) => (
                  <Code key={index} whiteSpace="pre-wrap" p={2} borderRadius="md">
                    {item}
                  </Code>
                ))}
                {incoming.length === 0 && <Text color="gray.500">Нет событий</Text>}
              </VStack>
            </Box>

            <Box borderWidth="1px" borderRadius="md" p={4} bg="white">
              <Text fontWeight="bold" mb={2}>
                Логи STOMP
              </Text>
              <VStack align="stretch" spacing={1} maxH="200px" overflowY="auto">
                {[...logs].reverse().map((log, idx) => (
                  <Box key={idx} p={2} borderWidth="1px" borderRadius="md" borderColor={log.type === 'error' ? 'red.200' : 'gray.200'}>
                    <Text fontSize="sm" color="gray.600">
                      {log.timestamp.toLocaleTimeString()} · {log.type}
                    </Text>
                    <Code whiteSpace="pre-wrap" display="block" mt={1}>
                      {log.message}
                    </Code>
                  </Box>
                ))}
                {logs.length === 0 && <Text color="gray.500">Нет логов</Text>}
              </VStack>
            </Box>
          </VStack>
        </GridItem>
      </Grid>
    </Stack>
  );
};

export default ChatTester;
