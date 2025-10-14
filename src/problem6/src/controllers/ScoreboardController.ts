import type { FastifyRequest, FastifyReply } from 'fastify';
import { ScoreboardService } from '../services/ScoreboardService';
import { WebSocketService } from '../services/WebSocketService';
import type { ScoreboardResponse, ScoreUpdateResponse, UserScoreResponse, ScoreUpdateRequest } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth';

export class ScoreboardController {
  static async getScoreboard(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const scoreboard = await ScoreboardService.getTopScores(10);
      const totalUsers = await ScoreboardService.getTotalUsers();

      const response: ScoreboardResponse = {
        success: true,
        data: {
          scoreboard,
          totalUsers,
          lastUpdated: new Date()
        }
      };

      reply.send(response);
    } catch (error) {
      console.error('Get scoreboard error:', error);
      
      reply.status(500).send({
        success: false,
        error: {
          code: 'SCOREBOARD_FETCH_FAILED',
          message: 'Failed to fetch scoreboard'
        }
      });
    }
  }

  static async updateScore(
    request: FastifyRequest<{ Body: ScoreUpdateRequest }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { actionId, scoreIncrement, timestamp, actionHash } = request.body;
      const ipAddress = request.ip;

      // Validate input
      if (!actionId || !scoreIncrement || !timestamp || !actionHash) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'All fields are required'
          }
        });
      }

      const result = await ScoreboardService.updateScore(
        authRequest.user.userId,
        { actionId, scoreIncrement, timestamp, actionHash },
        ipAddress
      );

      const response: ScoreUpdateResponse = {
        success: true,
        data: result
      };

      // Broadcast scoreboard update to all connected clients
      const updatedScoreboard = await ScoreboardService.getTopScores(10);
      WebSocketService.broadcastScoreboardUpdate(updatedScoreboard);

      reply.send(response);
    } catch (error) {
      console.error('Update score error:', error);
      
      const errorCode = error instanceof Error && error.message.includes('already been processed')
        ? 'DUPLICATE_ACTION'
        : error instanceof Error && error.message.includes('Invalid action hash')
        ? 'INVALID_ACTION_HASH'
        : error instanceof Error && error.message.includes('Score increment')
        ? 'INVALID_SCORE_INCREMENT'
        : 'SCORE_UPDATE_FAILED';

      reply.status(400).send({
        success: false,
        error: {
          code: errorCode,
          message: error instanceof Error ? error.message : 'Score update failed'
        }
      });
    }
  }

  static async getUserScore(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { userId } = request.params;

      if (!userId) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'MISSING_USER_ID',
            message: 'User ID is required'
          }
        });
      }

      const userScore = await ScoreboardService.getUserScore(userId);

      if (!userScore) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      const response: UserScoreResponse = {
        success: true,
        data: userScore
      };

      reply.send(response);
    } catch (error) {
      console.error('Get user score error:', error);
      
      reply.status(500).send({
        success: false,
        error: {
          code: 'USER_SCORE_FETCH_FAILED',
          message: 'Failed to fetch user score'
        }
      });
    }
  }

  static async generateActionData(
    request: FastifyRequest<{ Body: { scoreIncrement: number } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { scoreIncrement } = request.body;

      if (!scoreIncrement || scoreIncrement < 1 || scoreIncrement > 1000) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'INVALID_SCORE_INCREMENT',
            message: 'Score increment must be between 1 and 1000'
          }
        });
      }

      const actionId = ScoreboardService.generateActionId();
      const timestamp = new Date().toISOString();
      const actionHash = ScoreboardService.generateActionHash(actionId, scoreIncrement, timestamp);

      reply.send({
        success: true,
        data: {
          actionId,
          scoreIncrement,
          timestamp,
          actionHash
        }
      });
    } catch (error) {
      console.error('Generate action data error:', error);
      
      reply.status(500).send({
        success: false,
        error: {
          code: 'ACTION_GENERATION_FAILED',
          message: 'Failed to generate action data'
        }
      });
    }
  }
}
