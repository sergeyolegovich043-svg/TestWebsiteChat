import { Heading, Stack, Text } from '@chakra-ui/react';
import ChatTester from './components/ChatTester';

function App() {
  return (
    <Stack spacing={6}>
      <Heading as="h1" size="lg">
        SecureChat API tester
      </Heading>
      <Text color="gray.600">
        Простой стенд для работы с REST и WebSocket API securechat. Заполните базовый URL сервиса, JWT токен и идентификатор чата.
      </Text>
      <ChatTester />
    </Stack>
  );
}

export default App;
