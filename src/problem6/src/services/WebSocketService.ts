import type { WebSocketMessage, ScoreboardEntry } from '../types';

export class WebSocketService {
  private static connections: Map<string, any> = new Map();

  static addConnection(connectionId: string, connection: any): void {
    this.connections.set(connectionId, connection);
    console.log(`WebSocket connection added: ${connectionId}. Total connections: ${this.connections.size}`);
  }

  static removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
    console.log(`WebSocket connection removed: ${connectionId}. Total connections: ${this.connections.size}`);
  }

  static broadcastScoreboardUpdate(scoreboard: ScoreboardEntry[]): void {
    const message: WebSocketMessage = {
      type: 'scoreboard_update',
      data: {
        scoreboard,
        totalUsers: scoreboard.length,
        lastUpdated: new Date()
      },
      timestamp: new Date()
    };

    this.broadcast(message);
  }

  static broadcastConnectionStatus(status: 'connected' | 'disconnected', userId?: string): void {
    const message: WebSocketMessage = {
      type: 'connection_status',
      data: {
        status,
        userId,
        timestamp: new Date()
      },
      timestamp: new Date()
    };

    this.broadcast(message);
  }

  static broadcastError(error: string, userId?: string): void {
    const message: WebSocketMessage = {
      type: 'error',
      data: {
        error,
        userId,
        timestamp: new Date()
      },
      timestamp: new Date()
    };

    this.broadcast(message);
  }

  private static broadcast(message: WebSocketMessage): void {
    const messageString = JSON.stringify(message);
    
    this.connections.forEach((connection, connectionId) => {
      try {
        if (connection.readyState === 1) { // WebSocket.OPEN
          connection.send(messageString);
        } else {
          // Remove dead connections
          this.removeConnection(connectionId);
        }
      } catch (error) {
        console.error(`Error sending message to connection ${connectionId}:`, error);
        this.removeConnection(connectionId);
      }
    });
  }

  static getConnectionCount(): number {
    return this.connections.size;
  }

  static getConnections(): string[] {
    return Array.from(this.connections.keys());
  }
}
