import { Test, TestingModule } from "@nestjs/testing";
import { LeadsInfoController } from "./leads_info.controller";

describe("LeadsInfoController", () => {
  let controller: LeadsInfoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadsInfoController],
    }).compile();

    controller = module.get<LeadsInfoController>(LeadsInfoController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
