import { ChatDto, MessageDto, SessionDto } from './types';

interface RequestOptions extends RequestInit {
  token?: string;
  baseUrl: string;
}

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${options.baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function createApiClient(baseUrl: string, token: string) {
  const opts = { baseUrl, token };

  return {
    listChats: () => request<ChatDto[]>(`/api/v1/chats`, { ...opts }),
    getChatDetails: (chatId: string) => request<ChatDto>(`/api/v1/chats/${chatId}`, { ...opts }),
    createPrivateChat: (payload: unknown) => request<ChatDto>(`/api/v1/chats/private`, { ...opts, method: 'POST', body: JSON.stringify(payload) }),
    createGroupChat: (payload: unknown) => request<ChatDto>(`/api/v1/chats/group`, { ...opts, method: 'POST', body: JSON.stringify(payload) }),
    listMessages: (chatId: string, beforeMessageId?: string, limit = 50) => {
      const query = new URLSearchParams({ limit: String(limit) });
      if (beforeMessageId) query.set('beforeMessageId', beforeMessageId);
      return request<MessageDto[]>(`/api/v1/chats/${chatId}/messages?${query.toString()}`, { ...opts });
    },
    sendMessage: (chatId: string, content: string, type: string = 'TEXT', mediaUrl?: string) =>
      request<MessageDto>(`/api/v1/chats/${chatId}/messages`, {
        ...opts,
        method: 'POST',
        body: JSON.stringify({ content, type, mediaUrl }),
      }),
    addMember: (chatId: string, memberId: string) =>
      request<void>(`/api/v1/chats/${chatId}/members`, {
        ...opts,
        method: 'POST',
        body: JSON.stringify({ memberId }),
      }),
    removeMember: (chatId: string, memberId: string) =>
      request<void>(`/api/v1/chats/${chatId}/members/${memberId}`, { ...opts, method: 'DELETE' }),
    listSessions: (chatId: string) => request<SessionDto[]>(`/api/v1/chats/${chatId}/sessions`, { ...opts }),
    createSession: (chatId: string, payload: unknown) =>
      request<SessionDto>(`/api/v1/chats/${chatId}/sessions`, { ...opts, method: 'POST', body: JSON.stringify(payload) }),
    fetchBundles: (chatId: string) => request<Record<string, string>>(`/api/v1/chats/${chatId}/sessions/bundles`, { ...opts }),
  };
}
