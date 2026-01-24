import { Module } from "@nestjs/common";
import { LangChainOpenAiController } from "./lang-chain-open-ai.controller";
import { LangChainOpenAIService } from "./lang-chain-open-ai.service";

@Module({
  controllers: [LangChainOpenAiController],
  providers: [LangChainOpenAIService],
})
export class LangChainOpenAiModule {}
