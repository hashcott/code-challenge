export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Score {
  id: string;
  userId: string;
  score: number;
  lastUpdated: Date;
}

export interface ActionLog {
  id: string;
  userId: string;
  actionId: string;
  scoreIncrement: number;
  actionHash: string;
  timestamp: Date;
  ipAddress?: string;
  createdAt: Date;
}

export interface ScoreboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  lastUpdated: Date;
}

export interface ScoreboardResponse {
  success: boolean;
  data: {
    scoreboard: ScoreboardEntry[];
    totalUsers: number;
    lastUpdated: Date;
  };
}

export interface ScoreUpdateRequest {
  actionId: string;
  scoreIncrement: number;
  timestamp: string;
  actionHash: string;
}

export interface ScoreUpdateResponse {
  success: boolean;
  data: {
    userId: string;
    newScore: number;
    rank: number;
    message: string;
  };
}

export interface UserScoreResponse {
  success: boolean;
  data: {
    userId: string;
    username: string;
    score: number;
    rank: number;
    totalUsers: number;
  };
}

export interface AuthRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      username: string;
      email: string;
    };
  };
}

export interface WebSocketMessage {
  type: 'scoreboard_update' | 'connection_status' | 'error';
  data: any;
  timestamp: Date;
}

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}
