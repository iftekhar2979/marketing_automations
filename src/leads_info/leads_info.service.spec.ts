import { Test, TestingModule } from '@nestjs/testing';
import { LeadsInfoService } from './leads_info.service';

describe('LeadsInfoService', () => {
  let service: LeadsInfoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadsInfoService],
    }).compile();

    service = module.get<LeadsInfoService>(LeadsInfoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
