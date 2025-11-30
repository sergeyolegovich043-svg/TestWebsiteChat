import { ChakraProvider, Container } from '@chakra-ui/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider>
      <Container maxW="6xl" py={8}>
        <App />
      </Container>
    </ChakraProvider>
  </React.StrictMode>
);
