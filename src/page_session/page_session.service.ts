import { InjectRepository } from "@nestjs/typeorm";
import { firstValueFrom } from "rxjs";
import { In, Repository } from "typeorm";

import { HttpService } from "@nestjs/axios";
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UpdateMetaBusinessProfileDto } from "./dto/update_meta_buisness_profile.dto";
import { metaBuisnessProfiles } from "./entites/page_session.entity";
import { FacebookPage } from "./types/buisness.types";
import { PageDataMap } from "./types/page_info.types";

@Injectable()
export class PageSessionService {
  private metaGraphApiUrl = "https://graph.facebook.com/v24.0";
  private metaAccessToken: string;

  constructor(
    @InjectRepository(metaBuisnessProfiles)
    private readonly _profileRepository: Repository<metaBuisnessProfiles>,
    private readonly _configService: ConfigService,
    private readonly _httpService: HttpService
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
  async findAll(): Promise<metaBuisnessProfiles[]> {
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

  async findOne(id: number): Promise<metaBuisnessProfiles> {
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

  async findByPageId(pageId: string): Promise<metaBuisnessProfiles> {
    try {
      const profile = await this._profileRepository.findOne({
        where: { page_id: pageId },
      });

      if (!profile) {
        throw new NotFoundException(`Profile with page ID ${pageId} not found`);
      }

      return profile;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to fetch profile");
    }
  }

  //   async findByUserId(userId: string): Promise<metaBuisnessProfiles[]> {
  //     try {
  //       return await this._profileRepository.find({
  //         where: { user_id: userId },
  //         order: {
  //           created_at: "DESC",
  //         },
  //       });
  //     } catch (error) {
  //       throw new InternalServerErrorException("Failed to fetch user profiles");
  //     }
  //   }

  async update(id: number, updateProfileDto: UpdateMetaBusinessProfileDto): Promise<metaBuisnessProfiles> {
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

  //   async syncWithMeta(id: number): Promise<metaBuisnessProfiles> {
  //     try {
  //       const profile = await this.findOne(id);
  //       const metaData = await this.fetchMetaBusinessData(profile.page_id);

  //       profile.buisness_name = metaData.name;
  //       return await this._profileRepository.save(profile);
  //     } catch (error) {
  //       if (error instanceof NotFoundException) throw error;
  //       throw new InternalServerErrorException(`Failed to sync with Meta: ${error.message}`);
  //     }
  //   }

  private async fetchMetaBusinessData(): Promise<{ data: FacebookPage[] }> {
    try {
      const response = await firstValueFrom(
        this._httpService.get(`${this.metaGraphApiUrl}/me/accounts?limit=100`, {
          params: {
            //   fields: "id,name,category,picture,about,website",
            access_token: this.metaAccessToken,
          },
        })
      );

      return response.data;
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch Meta business data: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  async syncWithMeta() {
    try {
      const metaBusinessData = await this.fetchMetaBusinessData();
      if (!metaBusinessData || !metaBusinessData.data || metaBusinessData.data.length === 0) {
        throw new NotFoundException("No business data found from Meta");
      }

      const buisness = metaBusinessData.data;

      const incomingBuisnesses = buisness.map((item) => {
        if (item.id && item.name) {
          return {
            page_id: item.id,
            buisness_name: item.name,
            buisness_category: item.category || "Uncategorized",
          };
        }
      });

      // 1. Get existing pageIds
      const existingPages = await this._profileRepository.find({
        select: ["page_id"],
        where: {
          page_id: In(incomingBuisnesses.map((p) => p.page_id)),
        },
      });
      const existingIds = new Set(existingPages.map((p) => p.page_id));
      // 2. Filter only new pages
      const newPages = incomingBuisnesses.filter((p) => !existingIds.has(p.page_id));
      if (!newPages.length) {
        return { message: "No new pages to sync", ok: true };
      }
      if (newPages.length) {
        await this._profileRepository.insert(newPages);
      }
      return { message: "Sync completed successfully" };
    } catch (error) {}
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
      throw new BadRequestException(
        `Invalid Meta page ID: ${error.response?.data?.error?.message || "Page not found"}`
      );
    }
  }
}
