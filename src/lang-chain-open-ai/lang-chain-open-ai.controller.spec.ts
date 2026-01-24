import { Test, TestingModule } from '@nestjs/testing';
import { LangChainOpenAiController } from './lang-chain-open-ai.controller';

describe('LangChainOpenAiController', () => {
  let controller: LangChainOpenAiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LangChainOpenAiController],
    }).compile();

    controller = module.get<LangChainOpenAiController>(LangChainOpenAiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
