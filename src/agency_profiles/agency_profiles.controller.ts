import { Body, Controller, Patch, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { JwtAuthenticationGuard } from "src/auth/guards/session-auth.guard";
import { User } from "src/user/entities/user.entity";
import { AgencyProfilesService } from "./agency_profiles.service";
import { UpdateAgencyProfileDto } from "./dtos/update_agency.dto";
@ApiBearerAuth()
@Controller("agency-profiles")
export class AgencyProfilesController {
  constructor(private readonly _agencyProfileService: AgencyProfilesService) {}
  @Patch("me")
  @UseGuards(JwtAuthenticationGuard)
  @ApiOperation({ summary: "Update my agency profile" })
  async updateMyAgencyProfile(@Req() req, @Body() dto: UpdateAgencyProfileDto, @GetUser() user: User) {
    return this._agencyProfileService.updateMyAgencyProfile(user, dto);
  }
}
