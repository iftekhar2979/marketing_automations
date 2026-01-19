import { Test, TestingModule } from '@nestjs/testing';
import { ContructorsController } from './contructors.controller';

describe('ContructorsController', () => {
  let controller: ContructorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContructorsController],
    }).compile();

    controller = module.get<ContructorsController>(ContructorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
