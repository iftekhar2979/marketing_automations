import { InjectRepository } from "@nestjs/typeorm";
import { firstValueFrom } from "rxjs";
import { DataSource, Repository } from "typeorm";

import { HttpService } from "@nestjs/axios";
import { InjectQueue } from "@nestjs/bull";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bull";
import { AgencyProfilesService } from "src/agency_profiles/agency_profiles.service";
import { AgencyProfile } from "src/agency_profiles/entities/agency_profiles.entity";
import { RedisService } from "src/redis/redis.service";
import { User } from "src/user/entities/user.entity";
import { UserService } from "src/user/user.service";
import { UpdateMetaBusinessProfileDto } from "./dto/update_meta_buisness_profile.dto";
import { MetaBuisnessProfiles } from "./entites/meta_buisness.entity";
import { FacebookPage } from "./types/buisness.types";
import { LeadgenLead } from "./types/leadgen.types";
import { PageDataMap } from "./types/page_info.types";
@Injectable()
export class PageSessionService {
  private metaGraphApiUrl = "https://graph.facebook.com/v24.0";
  private metaAccessToken: string;

  constructor(
    @InjectRepository(MetaBuisnessProfiles)
    private readonly _profileRepository: Repository<MetaBuisnessProfiles>,
    private readonly _configService: ConfigService,
    private readonly _httpService: HttpService,
    private readonly _userService: UserService,
    private readonly _dataSource: DataSource,
    private readonly _agencyProfileService: AgencyProfilesService,
    private readonly _redisService: RedisService,
    @InjectQueue("global") private readonly _globalQueueService: Queue
  ) {
    this.metaAccessToken = this._configService.get<string>("META_ACCESS_TOKEN");
    if (!this.metaAccessToken) {
      throw new Error("META_ACCESS_TOKEN is not configured");
    }
  }

  async getallBuisness() {
    try {
      const metaBusinessData = await this.fetchMetaBusinessData();
      return metaBusinessData;
    } catch (error) {
      throw new BadRequestException(`Failed to create profile: ${error.message}`);
    }
  }

  async getBuisness() {
    try {
      const metaBusinessData = await this.fetchMetaBusinessData();
      return metaBusinessData;
    } catch (error) {
      throw new BadRequestException(`Failed to create profile: ${error.message}`);
    }
  }

  async updateUserBuisnessProfile() {
    try {
    } catch (error) {
      throw new BadRequestException(`Failed to update profile: ${error.message}`);
    }
  }
  async findAll(): Promise<MetaBuisnessProfiles[]> {
    try {
      return await this._profileRepository.find({
        order: {
          created_at: "DESC",
        },
      });
    } catch (error) {
      throw new InternalServerErrorException("Failed to fetch profiles");
    }
  }

  async findOne(id: number): Promise<MetaBuisnessProfiles> {
    try {
      const profile = await this._profileRepository.findOne({
        where: { id },
      });

      if (!profile) {
        throw new NotFoundException(`Profile with ID ${id} not found`);
      }

      return profile;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to fetch profile");
    }
  }

  async findByPageId(pageId: string): Promise<MetaBuisnessProfiles> {
    const client = this._redisService.getClient();
    const cacheKey = `meta_profile:page:${pageId}`;

    try {
      // 1️⃣ Check cache
      const cached = await client.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as MetaBuisnessProfiles;
      }

      // 2️⃣ Fetch from DB
      const profile = await this._profileRepository.findOne({
        where: { page_id: pageId },
        relations: ["users"],
      });

      if (!profile) {
        throw new NotFoundException(`Profile with page ID ${pageId} not found`);
      }

      // 3️⃣ Cache result (TTL 10 minutes)
      await client.set(cacheKey, JSON.stringify(profile), { EX: 600 });

      return profile;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to fetch profile");
    }
  }

  async connectFacebookPage({ page_id, user_id }: { page_id: string; user_id: string }) {
    // 1. Start the QueryRunner
    const queryRunner = this._dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2. Fetch user INSIDE transaction to ensure it's not deleted mid-process
      const user = await queryRunner.manager.findOne(User, {
        where: { id: user_id },
        relations: ["buisness_profiles"],
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${user_id} not found`);
      }
      if (user.buisness_profiles) {
        throw new BadRequestException(`User with ID ${user_id} already has a business profile`);
      }

      // 3. Validate Meta Data
      const metaData = await this.validateMetaPageExists(page_id);
      const pageInfo = metaData.data?.[page_id];

      if (!pageInfo) {
        throw new NotFoundException(`Meta page with ID ${page_id} not found in Meta response`);
      }

      // 4. Create Business Profile
      const newProfile = queryRunner.manager.create(MetaBuisnessProfiles, {
        page_id: pageInfo.id,
        buisness_name: pageInfo.name,
        buisness_category: pageInfo.category || "Uncategorized",
        users: user, // Link to user
      });

      const savedProfile = await queryRunner.manager.save(newProfile);

      // 5. Update Agency Profile link
      await queryRunner.manager.update(
        AgencyProfile,
        { agency_owner_id: user.id },
        { buisness_profile: savedProfile }
      );

      user.buisness_profiles = savedProfile;
      await queryRunner.manager.save(user);

      // 6. Commit DB changes
      await queryRunner.commitTransaction();

      // 7. CLEAR REDIS CACHE (Critical for Efficiency)
      await this._globalQueueService.add("invalidate-user-cache", { user_id: user.id });

      return {
        ok: true,
        message: "Business configured successfully",
        data: savedProfile,
      };
    } catch (error) {
      // Rollback and then THROW so the user gets the error message
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Failed to connect Facebook page: ${error.message}`);
    } finally {
      // Always release the connection
      await queryRunner.release();
    }
  }

  async update(id: number, updateProfileDto: UpdateMetaBusinessProfileDto): Promise<MetaBuisnessProfiles> {
    try {
      const profile = await this.findOne(id);

      if (updateProfileDto.page_id && updateProfileDto.page_id !== profile.page_id) {
        await this.validateMetaPageExists(updateProfileDto.page_id);
      }

      Object.assign(profile, updateProfileDto);
      return await this._profileRepository.save(profile);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to update profile: ${error.message}`);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      const profile = await this.findOne(id);
      await this._profileRepository.remove(profile);
      return { message: `Profile with ID ${id} successfully deleted` };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to delete profile");
    }
  }

  private async fetchMetaBusinessData(): Promise<{ data: FacebookPage[] }> {
    try {
      const response = await firstValueFrom(
        this._httpService.get(
          `${this.metaGraphApiUrl}/me/accounts?limit=100&fields=link,name,access_token,category,category_list`,
          {
            params: {
              //   fields: "id,name,category,picture,about,website",
              access_token: this.metaAccessToken,
            },
          }
        )
      );
      if (response.status === 400) {
        throw new Error("Meta API returned a bad request ! Renew access token");
      }
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async syncWithMeta() {
    try {
      const metaBusinessData = await this.fetchMetaBusinessData();
      if (!metaBusinessData || !metaBusinessData.data || metaBusinessData.data.length === 0) {
        throw new NotFoundException("No business data found from Meta");
      }

      // const buisness = metaBusinessData.data;

      // const incomingBuisnesses = buisness.map((item) => {
      //   if (item.id && item.name) {
      //     return {
      //       page_id: item.id,
      //       buisness_name: item.name,
      //       buisness_category: item.category || "Uncategorized",
      //     };
      //   }
      // });

      // // 1. Get existing pageIds
      // const existingPages = await this._profileRepository.find({
      //   select: ["page_id"],
      //   where: {
      //     page_id: In(incomingBuisnesses.map((p) => p.page_id)),
      //   },
      // });
      // const existingIds = new Set(existingPages.map((p) => p.page_id));
      // // 2. Filter only new pages
      // const newPages = incomingBuisnesses.filter((p) => !existingIds.has(p.page_id));
      // if (!newPages.length) {
      //   return { message: "No new pages to sync", ok: true };
      // }
      // if (newPages.length) {
      //   await this._profileRepository.insert(newPages);
      // }
      return { message: "All pages retrived successfully", data: metaBusinessData.data, ok: true };
    } catch (error) {
      throw new BadRequestException(`Failed to sync with Meta: ${error.message}`);
    }
  }

  async validateMetaPageExists(page_id: string): Promise<{ data: PageDataMap }> {
    try {
      return await firstValueFrom(
        this._httpService.get(`${this.metaGraphApiUrl}?ids=${page_id}&fields=id,name,access_token,category`, {
          params: {
            access_token: this.metaAccessToken,
          },
        })
      );
    } catch (error) {
      //   console.log(error);
      throw new BadRequestException(
        `Invalid Meta page ID: ${error.response?.data?.error?.message || "Page not found"}`
      );
    }
  }
  async leadInformations({
    lead_id,
    access_token,
  }: {
    lead_id: string;
    access_token: string;
  }): Promise<{ data: LeadgenLead }> {
    try {
      return await firstValueFrom(
        this._httpService.get(`${this.metaGraphApiUrl}/${lead_id}`, {
          params: {
            access_token: access_token,
          },
        })
      );
    } catch (error) {
      //   console.log(error);
      throw new BadRequestException(
        `Invalid Meta Lead ID: ${error.response?.data?.error?.message || "Page not found"}`
      );
    }
  }
}
