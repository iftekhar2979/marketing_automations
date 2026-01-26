import { Injectable } from "@nestjs/common";
import { User } from "src/user/entities/user.entity";
import { ClientContext, RawMessageClientContext } from "../types/chatbot.types";
import { ConversationMemoryService } from "./chat-conversation.service";

@Injectable()
export class ConversationStateService {
  constructor(private memoryService: ConversationMemoryService) {}

  async initializeContext(
    clientId: string,
    formData: { name: string; values: string[] }[],
    userInfo: User,
    sourceChannel: string = "website"
  ): Promise<ClientContext> {
    const context: ClientContext = {
      id: clientId,
      formData,
      userInfo,
      conversationHistory: [],
      status: "greeting",
      collectedData: new Map(),
      metadata: {
        startedAt: new Date(),
        lastActivityAt: new Date(),
        sourceChannel,
      },
    };

    await this.memoryService.saveClientContext(clientId, context);
    return context;
  }
  async initiateRawContext(clientId: string, userInfo: User): Promise<RawMessageClientContext> {
    const context: RawMessageClientContext = {
      id: clientId,
      userInfo,
      conversationHistory: [],
      status: "information_gathering",
      collectedData: new Map(),
      metadata: {
        startedAt: new Date(),
        lastActivityAt: new Date(),
        sourceChannel: "message",
      },
    };

    await this.memoryService.saveRawClient(clientId, context);
    return context;
  }

  async updateContext(clientId: string, updates: Partial<ClientContext>): Promise<ClientContext> {
    const context = await this.memoryService.getClientContext(clientId);
    if (!context) throw new Error("Client context not found");

    Object.assign(context, updates);
    context.metadata.lastActivityAt = new Date();

    await this.memoryService.saveClientContext(clientId, context);
    return context;
  }

  async determineNextStatus(context: ClientContext): Promise<ClientContext["status"]> {
    const requiredFields = context.formData.filter((f) => f.name);
    const collectedCount = requiredFields.filter((f) => context.collectedData.has(f.name)).length;
    const collectionProgress = collectedCount / requiredFields.length;

    if (collectionProgress === 0) return "greeting";
    if (collectionProgress < 0.7) return "information_gathering";
    if (collectionProgress >= 0.7 && collectionProgress < 1) return "appointment_scheduling";
    return "closing";
  }

  getRequiredFieldsStatus(context: ClientContext): {
    total: number;
    collected: number;
    remaining: string[];
  } {
    const requiredFields = context.formData.filter((f) => f.name);
    const collected = requiredFields.filter((f) => context.collectedData.has(f.name)).length;
    const remaining = requiredFields.filter((f) => !context.collectedData.has(f.name)).map((f) => f.name);

    return {
      total: requiredFields.length,
      collected,
      remaining,
    };
  }
}
