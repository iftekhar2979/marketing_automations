import { Module } from '@nestjs/common';
import { AgencyProfilesController } from './agency_profiles.controller';
import { AgencyProfilesService } from './agency_profiles.service';

@Module({
  controllers: [AgencyProfilesController],
  providers: [AgencyProfilesService]
})
export class AgencyProfilesModule {}
