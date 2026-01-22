import { Query } from "@nestjs/common";
// meta-business-profiles.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Roles } from "src/user/decorators/roles.decorator";
import { UserRoles } from "src/user/enums/role.enum";
import { UpdateMetaBusinessProfileDto } from "./dto/update_meta_buisness_profile.dto";
import { MetaBuisnessProfiles } from "./entites/meta_buisness.entity";
import { PageSessionService } from "./page_session.service";

@ApiTags("Meta Business Profiles")
@Controller("meta-business-profiles")
export class PageSessionController {
  constructor(private readonly _metaBusinessProfilesService: PageSessionService) {}

  //   @Post()
  //   @HttpCode(HttpStatus.CREATED)
  //   @ApiOperation({ summary: "Create a new Meta business profile" })
  //   @ApiResponse({
  //     status: 201,
  //     description: "Profile created successfully",
  //     type: metaBuisnessProfiles,
  //   })
  //   @ApiResponse({
  //     status: 400,
  //     description: "Invalid page ID or missing required fields",
  //   })
  //   create(@Body() createProfileDto: CreateMetaBusinessProfileDto): Promise<metaBuisnessProfiles> {
  //     return this._metaBusinessProfilesService.create(createProfileDto);
  //   }

  //   @Get()
  //   @ApiOperation({ summary: "Get all Meta business profiles" })
  //   @ApiResponse({
  //     status: 200,
  //     description: "List of all profiles",
  //     type: [metaBuisnessProfiles],
  //   })
  //   findAll(): Promise<metaBuisnessProfiles[]> {
  //     return this._metaBusinessProfilesService.findAll();
  //   }

  @Post(":page_id")
  @ApiOperation({ summary: "Get a profile by Meta page ID" })
  @ApiParam({
    name: "page_id",
    description: "The Meta page ID",
  })
  @ApiResponse({
    status: 200,
    description: "Profile found",
    type: MetaBuisnessProfiles,
  })
  @ApiResponse({
    status: 404,
    description: "Profile not found",
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRoles.ADMIN)
  findByPage(@Param("page_id") page_id: string, @Query("user_id") user_id: string) {
    return this._metaBusinessProfilesService.connectFacebookPage({ page_id, user_id });
  }

  @Get()
  @ApiOperation({ summary: "Get all Meta business profiles" })
  @ApiResponse({
    status: 200,
    description: "List of all profiles",
    type: [MetaBuisnessProfiles],
  })
  retriveAll() {
    return this._metaBusinessProfilesService.syncWithMeta();
  }
  // @Get("by-user/:userId")
  // @ApiOperation({ summary: "Get all profiles for a specific user" })
  // @ApiParam({
  //   name: "userId",
  //   description: "The user ID to filter profiles",
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: "List of profiles for the user",
  //   type: [metaBuisnessProfiles],
  // })
  // findByUserId(@Param("userId") userId: string): Promise<metaBuisnessProfiles[]> {
  //   return this._metaBusinessProfilesService.findByUserId(userId);
  // }

  @Get("by-page/:pageId")
  @ApiOperation({ summary: "Get a profile by Meta page ID" })
  @ApiParam({
    name: "pageId",
    description: "The Meta page ID",
  })
  @ApiResponse({
    status: 200,
    description: "Profile found",
    type: MetaBuisnessProfiles,
  })
  @ApiResponse({
    status: 404,
    description: "Profile not found",
  })
  findByPageId(@Param("pageId") pageId: string): Promise<MetaBuisnessProfiles> {
    return this._metaBusinessProfilesService.findByPageId(pageId);
  }

  // @Get(":id")
  // @ApiOperation({ summary: "Get a profile by ID" })
  // @ApiParam({
  //   name: "id",
  //   description: "The profile ID",
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: "Profile found",
  //   type: MetaBuisnessProfiles,
  // })
  // @ApiResponse({
  //   status: 404,
  //   description: "Profile not found",
  // })
  // findOne(@Param("id", ParseIntPipe) id: number): Promise<MetaBuisnessProfiles> {
  //   return this._metaBusinessProfilesService.findOne(id);
  // }

  @Patch(":id")
  @ApiOperation({ summary: "Update a Meta business profile" })
  @ApiParam({
    name: "id",
    description: "The profile ID",
  })
  @ApiResponse({
    status: 200,
    description: "Profile updated successfully",
    type: MetaBuisnessProfiles,
  })
  @ApiResponse({
    status: 404,
    description: "Profile not found",
  })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateProfileDto: UpdateMetaBusinessProfileDto
  ): Promise<MetaBuisnessProfiles> {
    return this._metaBusinessProfilesService.update(id, updateProfileDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a Meta business profile" })
  @ApiParam({
    name: "id",
    description: "The profile ID",
  })
  @ApiResponse({
    status: 200,
    description: "Profile deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Profile not found",
  })
  remove(@Param("id", ParseIntPipe) id: number): Promise<{ message: string }> {
    return this._metaBusinessProfilesService.remove(id);
  }

  //   @Post(":id/sync")
  //   @HttpCode(HttpStatus.OK)
  //   @ApiOperation({ summary: "Sync profile data with Meta API" })
  //   @ApiParam({
  //     name: "id",
  //     description: "The profile ID",
  //   })
  //   @ApiResponse({
  //     status: 200,
  //     description: "Profile synced successfully with latest Meta data",
  //     type: metaBuisnessProfiles,
  //   })
  //   @ApiResponse({
  //     status: 404,
  //     description: "Profile not found",
  //   })
  //   syncWithMeta(@Param("id", ParseIntPipe) id: number): Promise<metaBuisnessProfiles> {
  //     return this._metaBusinessProfilesService.syncWithMeta(id);
  //   }
}
