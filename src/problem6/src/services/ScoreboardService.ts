import { prisma } from '../config/database';
import type { ScoreboardEntry, ScoreUpdateRequest, ScoreUpdateResponse, UserScoreResponse } from '../types';
import { cacheService } from './CacheService';
import crypto from 'crypto';

export class ScoreboardService {
  static async getTopScores(limit: number = 10): Promise<ScoreboardEntry[]> {
    // Try cache first for top 10 scores
    if (limit === 10) {
      const cached = await cacheService.getScoreboard();
      if (cached) {
        // Convert string dates back to Date objects
        return cached.map(entry => ({
          ...entry,
          lastUpdated: new Date(entry.lastUpdated)
        }));
      }
    }

    const scores = await prisma.score.findMany({
      take: limit,
      orderBy: [
        { score: 'desc' },
        { lastUpdated: 'asc' }
      ],
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    });

    const result = scores.map((score, index) => ({
      rank: index + 1,
      userId: score.userId,
      username: score.user.username,
      score: score.score,
      lastUpdated: score.lastUpdated
    }));

    // Cache the result if it's top 10 (convert Date to string for caching)
    if (limit === 10) {
      const cacheData = result.map(entry => ({
        ...entry,
        lastUpdated: entry.lastUpdated.toISOString()
      }));
      await cacheService.setScoreboard(cacheData);
    }

    return result;
  }

  static async getTotalUsers(): Promise<number> {
    return await prisma.user.count();
  }

  static async getUserScore(userId: string): Promise<UserScoreResponse['data'] | null> {
    // Try cache first for user score
    const cachedScore = await cacheService.getUserScore(userId);
    if (cachedScore !== null) {
      // Still need to get username and calculate rank from DB
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
      });

      if (!user) return null;

      // Calculate rank
      const rank = await prisma.score.count({
        where: {
          OR: [
            { score: { gt: cachedScore } },
            { 
              AND: [
                { score: cachedScore },
                { lastUpdated: { lt: new Date() } }
              ]
            }
          ]
        }
      }) + 1;

      const totalUsers = await this.getTotalUsers();

      return {
        userId,
        username: user.username,
        score: cachedScore,
        rank,
        totalUsers
      };
    }

    const score = await prisma.score.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    });

    if (!score) {
      return null;
    }

    // Get user's rank
    const rank = await prisma.score.count({
      where: {
        OR: [
          { score: { gt: score.score } },
          { 
            AND: [
              { score: score.score },
              { lastUpdated: { lt: score.lastUpdated } }
            ]
          }
        ]
      }
    }) + 1;

    const totalUsers = await this.getTotalUsers();

    const result = {
      userId: score.userId,
      username: score.user.username,
      score: score.score,
      rank,
      totalUsers
    };

    // Cache the user score
    await cacheService.setUserScore(userId, score.score);

    return result;
  }

  static async updateScore(
    userId: string, 
    updateData: ScoreUpdateRequest,
    ipAddress?: string
  ): Promise<ScoreUpdateResponse['data']> {
    const { actionId, scoreIncrement, timestamp, actionHash } = updateData;

    // Validate action ID uniqueness
    const existingAction = await prisma.actionLog.findUnique({
      where: { actionId }
    });

    if (existingAction) {
      throw new Error('Action ID has already been processed');
    }

    // Validate action hash
    const expectedHash = crypto
      .createHash('sha256')
      .update(`${actionId}-${scoreIncrement}-${timestamp}`)
      .digest('hex');

    if (actionHash !== expectedHash) {
      throw new Error('Invalid action hash');
    }

    // Validate score increment (reasonable limits)
    if (scoreIncrement < 1 || scoreIncrement > 1000) {
      throw new Error('Score increment must be between 1 and 1000');
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update user score
      const updatedScore = await tx.score.update({
        where: { userId },
        data: {
          score: { increment: scoreIncrement },
          lastUpdated: new Date()
        }
      });

      // Log the action
      await tx.actionLog.create({
        data: {
          userId,
          actionId,
          scoreIncrement,
          actionHash,
          timestamp: new Date(timestamp),
          ipAddress
        }
      });

      return updatedScore;
    });

    // Get user's new rank
    const rank = await prisma.score.count({
      where: {
        OR: [
          { score: { gt: result.score } },
          { 
            AND: [
              { score: result.score },
              { lastUpdated: { lt: result.lastUpdated } }
            ]
          }
        ]
      }
    }) + 1;

    // Invalidate related caches
    await cacheService.invalidateScoreboard();
    await cacheService.invalidateUserScore(userId);
    
    // Update user score cache with new value
    await cacheService.setUserScore(userId, result.score);

    return {
      userId: result.userId,
      newScore: result.score,
      rank,
      message: 'Score updated successfully'
    };
  }

  static async validateActionId(actionId: string): Promise<boolean> {
    const existing = await prisma.actionLog.findUnique({
      where: { actionId }
    });
    return !existing;
  }

  static generateActionHash(actionId: string, scoreIncrement: number, timestamp: string): string {
    return crypto
      .createHash('sha256')
      .update(`${actionId}-${scoreIncrement}-${timestamp}`)
      .digest('hex');
  }

  static generateActionId(): string {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  }
}
