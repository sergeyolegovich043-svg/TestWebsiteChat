export const topics = {
  chatMessages: (chatId: string) => `/topic/chats/${chatId}/messages`,
  chatTyping: (chatId: string) => `/topic/chats/${chatId}/typing`,
};

export const destinations = {
  typing: '/app/typing',
};
