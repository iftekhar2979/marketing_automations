import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "src/auth/auth.module";
import { UserModule } from "src/user/user.module";
import { AgencyProfilesController } from "./agency_profiles.controller";
import { AgencyProfilesService } from "./agency_profiles.service";
import { AgencyProfile } from "./entities/agency_profiles.entity";

@Module({
  imports: [TypeOrmModule.forFeature([AgencyProfile]), AuthModule, UserModule],
  controllers: [AgencyProfilesController],
  providers: [AgencyProfilesService],
  exports: [AgencyProfilesService],
})
export class AgencyProfilesModule {}
