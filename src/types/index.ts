export interface Note {
  id: string;
  rootTxId: string;
  project: string;
  twitterHandle: string;
  user: string;
  nickname: string;
  userType?: string;
  iconUrl: string;
  content: string;
  status: 'added' | 'removed' | 'edited';
  timestamp: number;
  cmName: string;
  cmTwitterHandle?: string;
  dataUrl?: string;
}

export interface Project {
  name: string;
  description?: string;
}

export interface User {
  twitterHandle: string;
  displayName: string;
  notes: Note[];
}

export interface CMPermission {
  cm: string;
  project: string;
}

export interface ProjectIcon {
  name: string;
  url: string;
  txId?: string;
}

export interface Tweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  author: {
    name: string;
    username: string;
    profile_image_url?: string;
  };
} 