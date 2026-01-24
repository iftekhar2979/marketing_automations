import { Test, TestingModule } from "@nestjs/testing";
import { AgencyProfilesService } from "./agency_profiles.service";

describe("AgencyProfilesService", () => {
  let service: AgencyProfilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgencyProfilesService],
    }).compile();

    service = module.get<AgencyProfilesService>(AgencyProfilesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
