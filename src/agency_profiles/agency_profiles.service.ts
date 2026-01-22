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
    console.log("From Job", dto);
    const obj = this._agencyProfileRepo.create({ ...dto, agency_owner_id: user.id, agency_owner: user });
    console.log(obj);
    const data = await this._agencyProfileRepo.save(obj);
    return {
      ok: true,
      message: "Agency Information updated successfully",
      data,
    };
  }

  async updatePictures(user: User, dto) {
    try {
      // 1. Validate ID exists
      if (!user?.id) {
        throw new Error("User ID is missing");
      }
      delete dto.user_id;
      // 2. Perform the update
      const result = await this._agencyProfileRepo.update({ agency_owner_id: user.id }, dto);

      // 3. Check if any rows were actually affected
      if (result.affected === 0) {
        console.warn("No rows were updated. Check if the ID exists in the correct table.");
      }

      return { ok: true, message: "Updated successfully" };
    } catch (error) {
      console.error("Update failed:", error);
      throw error;
    }
  }

  // async updateMyAgencyProfile(
  //   user: User,
  //   dto: UpdateAgencyProfileDto
  // ): Promise<{ ok: boolean; message: string; data: AgencyProfile }> {
  //   console.log("From Job");
  //   const obj = this._agencyProfileRepo.create({ ...dto, agency_owner_id: user.id, agency_owner: user });

  //   const data = await this._agencyProfileRepo.save(obj);
  //   return {
  //     ok: true,
  //     message: "Agency Information updated successfully",
  //     data,
  //   };
  // }
}
