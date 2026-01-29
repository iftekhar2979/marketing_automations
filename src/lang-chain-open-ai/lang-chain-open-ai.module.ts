import { Module } from "@nestjs/common";
import { ChatbotUtilsService } from "src/chatbot/utils/chatbot.utils.service";
import { LangChainOpenAiController } from "./lang-chain-open-ai.controller";
import { LangChainOpenAIService } from "./lang-chain-open-ai.service";

@Module({
  controllers: [LangChainOpenAiController],
  providers: [LangChainOpenAIService, ChatbotUtilsService],
})
export class LangChainOpenAiModule {}
