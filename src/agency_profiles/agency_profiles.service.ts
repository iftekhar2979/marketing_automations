import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RedisService } from "src/redis/redis.service";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { UpdateAgencyProfileDto } from "./dtos/update_agency.dto";
import { AgencyProfile } from "./entities/agency_profiles.entity";

@Injectable()
export class AgencyProfilesService {
  constructor(
    @InjectRepository(AgencyProfile)
    private readonly _agencyProfileRepo: Repository<AgencyProfile>,
    private readonly _redisService: RedisService
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

  async getAgencyByUserId(userId: string, relations: string[] = ["agency_owner"]): Promise<AgencyProfile> {
    const client = this._redisService.getClient();

    // 1. Generate a consistent cache key
    const relationKey = relations.sort().join(",");
    const cacheKey = `agency:owner:${userId}:${relationKey}`;

    // 2. Check Redis Cache
    const cachedData = await client.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // 3. Database Query
    const agency = await this._agencyProfileRepo.findOne({
      where: { agency_owner_id: userId },
      relations: relations,
    });

    if (!agency) {
      throw new NotFoundException("Agency profile not found");
    }

    // 4. Store in Redis (TTL 1 Hour)
    await client.set(cacheKey, JSON.stringify(agency), { EX: 3600 });

    return agency;
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
