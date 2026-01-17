import { Test, TestingModule } from '@nestjs/testing';
import { PageSessionService } from './page_session.service';

describe('PageSessionService', () => {
  let service: PageSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PageSessionService],
    }).compile();

    service = module.get<PageSessionService>(PageSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
