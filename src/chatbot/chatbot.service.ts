import { Injectable } from "@nestjs/common";
import { LangChainOpenAIService } from "src/lang-chain-open-ai/lang-chain-open-ai.service";
import { ConversationMemoryService } from "./services/chat-conversation.service";
import { ConversationStateService } from "./services/conversation-state.service";
import { ChatResponse, ClientContext, DynamicFormData, Message } from "./types/chatbot.types";

@Injectable()
export class ChatbotService {
  constructor(
    private langchain: LangChainOpenAIService,
    private memoryService: ConversationMemoryService,
    private stateService: ConversationStateService
  ) {}

  async chat(
    clientId: string,
    userMessage: string,
    formData: DynamicFormData,
    userInfo: any
  ): Promise<ChatResponse> {
    try {
      // 1. Get or initialize context
      let context = await this.memoryService.getClientContext(clientId);
      if (!context) {
        context = await this.stateService.initializeContext(clientId, formData, userInfo);
      }

      // 2. Save user message
      const userMsg: Message = {
        role: "user",
        content: userMessage,
        timestamp: new Date(),
      };

      await this.memoryService.saveMessage(clientId, userMsg);
      context.conversationHistory.push(userMsg);
      console.log("User Message:", userMsg);

      // 3. Extract structured data
      const extractedData = await this.langchain.extractStructuredData(userMessage, formData.fields);

      console.log("Extracted Data:", extractedData);

      extractedData.forEach((value, key) => {
        context.collectedData.set(key, value);
      });

      // 4. Determine next status
      const nextStatus = await this.stateService.determineNextStatus(context);
      context.status = nextStatus;

      // 5. Generate AI response
      const aiResponse = await this.langchain.generateResponse(context, userMessage);

      console.log("AI Response:", aiResponse);

      // 6. Save assistant message
      const assistantMsg: Message = {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      await this.memoryService.saveMessage(clientId, assistantMsg);
      context.conversationHistory.push(assistantMsg);

      // 7. Persist context
      await this.memoryService.saveClientContext(clientId, context);

      // 8. Return response
      return {
        message: aiResponse,
        nextAction: this.getNextAction(context.status),
        suggestedQuestions: this.generateSuggestedQuestions(context),
        collectedFields: context.collectedData,
      };
    } catch (error) {
      console.error("Chat service error:", {
        clientId,
        userMessage,
        error,
      });

      // You can customize this error
      throw new Error("Failed to process chat message");
      // OR (NestJS way):
      // throw new InternalServerErrorException("Chat processing failed");
    }
  }

  private getNextAction(status: ClientContext["status"]): string {
    const actions = {
      greeting: "Establish rapport and understand client needs",
      information_gathering: "Collect missing required information",
      appointment_scheduling: "Propose and confirm appointment/demo",
      closing: "Summarize and schedule follow-up",
    };
    return actions[status];
  }

  private generateSuggestedQuestions(context: ClientContext): string[] {
    const questions: string[] = [];
    const fieldStatus = this.stateService.getRequiredFieldsStatus(context);

    if (context.status === "greeting") {
      questions.push("Tell me about your project");
      questions.push("What are your main challenges?");
    }

    if (context.status === "information_gathering" && fieldStatus.remaining.length > 0) {
      const field = context.formData.fields.find((f) => f.name === fieldStatus.remaining[0]);
      if (field) {
        questions.push(`What's your ${field.name}?`);
      }
    }

    if (context.status === "appointment_scheduling") {
      questions.push("When are you available for a call?");
      questions.push("Would you like a demo?");
      questions.push("Can we schedule this week?");
    }

    return questions;
  }

  async getConversationHistory(clientId: string): Promise<Message[]> {
    return this.memoryService.getConversationHistory(clientId);
  }

  async getClientContext(clientId: string): Promise<ClientContext | null> {
    return this.memoryService.getClientContext(clientId);
  }

  async clearConversation(clientId: string): Promise<void> {
    await this.memoryService.clearConversation(clientId);
  }

  async getSessionStats(clientId: string): Promise<any> {
    const context = await this.memoryService.getClientContext(clientId);
    if (!context) return null;

    const fieldStatus = this.stateService.getRequiredFieldsStatus(context);

    return {
      clientId,
      status: context.status,
      startedAt: context.metadata.startedAt,
      lastActivityAt: context.metadata.lastActivityAt,
      duration: new Date().getTime() - context.metadata.startedAt.getTime(),
      messageCount: context.conversationHistory.length,
      fieldsCollected: fieldStatus.collected,
      totalFieldsRequired: fieldStatus.total,
      collectionProgress: `${Math.round((fieldStatus.collected / fieldStatus.total) * 100)}%`,
      representative: context.userInfo.name,
      collectedData: Object.fromEntries(context.collectedData),
    };
  }
}
