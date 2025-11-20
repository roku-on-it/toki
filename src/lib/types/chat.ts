export type ChatMessagePayload = {
  id: number;
  body: string;
  sentAt: string;
  author: {
    id: string;
    displayName: string;
    avatarBase64: string | null;
  };
};
