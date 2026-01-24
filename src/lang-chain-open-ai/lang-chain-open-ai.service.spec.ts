import { Test, TestingModule } from '@nestjs/testing';
import { LangChainOpenAiService } from './lang-chain-open-ai.service';

describe('LangChainOpenAiService', () => {
  let service: LangChainOpenAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LangChainOpenAiService],
    }).compile();

    service = module.get<LangChainOpenAiService>(LangChainOpenAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
