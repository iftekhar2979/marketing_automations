import { Test, TestingModule } from '@nestjs/testing';
import { PageSessionController } from './page_session.controller';

describe('PageSessionController', () => {
  let controller: PageSessionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PageSessionController],
    }).compile();

    controller = module.get<PageSessionController>(PageSessionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
