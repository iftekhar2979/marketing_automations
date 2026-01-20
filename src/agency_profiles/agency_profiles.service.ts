import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { UpdateAgencyProfileDto } from "./dtos/update_agency.dto";
import { AgencyProfile } from "./entities/agency_profiles.entity";

@Injectable()
export class AgencyProfilesService {
  constructor(
    @InjectRepository(AgencyProfile)
    private readonly _agencyProfileRepo: Repository<AgencyProfile>
  ) {}

  async updateMyAgencyProfile(
    user: User,
    dto: UpdateAgencyProfileDto
  ): Promise<{ ok: boolean; message: string; data: AgencyProfile }> {
    const obj = this._agencyProfileRepo.create({ ...dto, agency_owner_id: user.id, agency_owner: user });

    const data = await this._agencyProfileRepo.save(obj);

    return {
      ok: true,
      message: "Agency Information updated successfully",
      data,
    };
  }
}
