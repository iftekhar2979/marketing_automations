import { Test, TestingModule } from '@nestjs/testing';
import { ContructorsService } from './contructors.service';

describe('ContructorsService', () => {
  let service: ContructorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContructorsService],
    }).compile();

    service = module.get<ContructorsService>(ContructorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
