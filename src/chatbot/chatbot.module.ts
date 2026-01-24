import { Module } from "@nestjs/common";
import { LangChainOpenAiModule } from "src/lang-chain-open-ai/lang-chain-open-ai.module";
import { LangChainOpenAIService } from "src/lang-chain-open-ai/lang-chain-open-ai.service";
import { ChatbotController } from "./chatbot.controller";
import { ChatbotService } from "./chatbot.service";
import { ConversationMemoryService } from "./services/chat-conversation.service";
import { ConversationStateService } from "./services/conversation-state.service";

@Module({
  imports: [LangChainOpenAiModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, LangChainOpenAIService, ConversationMemoryService, ConversationStateService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
