export type CurrentUserProfile = {
  id: string;
  displayName: string;
  avatarBase64: string;
  secretKey: string;
};

export type PresenceUser = {
  id: string;
  displayName: string;
  avatarBase64: string | null;
};
