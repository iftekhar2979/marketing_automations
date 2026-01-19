import { Test, TestingModule } from '@nestjs/testing';
import { AgencyProfilesController } from './agency_profiles.controller';

describe('AgencyProfilesController', () => {
  let controller: AgencyProfilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgencyProfilesController],
    }).compile();

    controller = module.get<AgencyProfilesController>(AgencyProfilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
