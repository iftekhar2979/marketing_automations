import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "src/redis/redis.service";
import { ClientContext, Message } from "../types/chatbot.types";

@Injectable()
export class ConversationMemoryService {
  private redis;
  constructor(
    private readonly _configService: ConfigService,
    private readonly _redisService: RedisService
  ) {}
  async onModuleInit() {
    this.redis = await this._redisService.getClient();
  }

  async saveMessage(clientId: string, message: Message): Promise<void> {
    try {
      const key = `conversation:${clientId}`;
      await this.redis.lPush(key, JSON.stringify(message));
      await this.redis.expire(key, 86400); // 24 hours TTL
    } catch (error) {
      console.error("Error saving message:", error);
      throw error;
    }
  }

  async getConversationHistory(clientId: string, limit: number = 50): Promise<Message[]> {
    try {
      const key = `conversation:${clientId}`;
      const messages = await this.redis.lrange(key, 0, limit - 1);
      return messages.map((msg) => JSON.parse(msg)).reverse();
    } catch (error) {
      console.error("Error retrieving history:", error);
      return [];
    }
  }

  async saveClientContext(clientId: string, context: ClientContext): Promise<void> {
    try {
      const key = `context:${clientId}`;
      const serialized = JSON.stringify(context, (k, v) => {
        if (v instanceof Map) return Object.fromEntries(v);
        if (v instanceof Date) return v.toISOString();
        return v;
      });
      await this.redis.set(key, serialized);
      await this.redis.expire(key, 86400);
    } catch (error) {
      console.error("Error saving context:", error);
      throw error;
    }
  }

  async getClientContext(clientId: string): Promise<ClientContext | null> {
    try {
      const key = `context:${clientId}`;
      const data = await this.redis.get(key);
      if (!data) return null;

      const context = JSON.parse(data);
      context.collectedData = new Map(Object.entries(context.collectedData || {}));
      context.metadata.startedAt = new Date(context.metadata.startedAt);
      context.metadata.lastActivityAt = new Date(context.metadata.lastActivityAt);

      return context as ClientContext;
    } catch (error) {
      console.error("Error retrieving context:", error);
      return null;
    }
  }

  async clearConversation(clientId: string): Promise<void> {
    try {
      await this.redis.del(`conversation:${clientId}`, `context:${clientId}`);
    } catch (error) {
      console.error("Error clearing conversation:", error);
      throw error;
    }
  }

  async getAllClientSessions(): Promise<string[]> {
    try {
      const keys = await this.redis.keys("context:*");
      return keys.map((k) => k.replace("context:", ""));
    } catch (error) {
      console.error("Error getting sessions:", error);
      return [];
    }
  }

  async closeConnection(): Promise<void> {
    await this.redis.quit();
  }
}
