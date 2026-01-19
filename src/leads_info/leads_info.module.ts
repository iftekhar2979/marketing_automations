import { Module } from '@nestjs/common';
import { LeadsInfoController } from './leads_info.controller';
import { LeadsInfoService } from './leads_info.service';

@Module({
  controllers: [LeadsInfoController],
  providers: [LeadsInfoService]
})
export class LeadsInfoModule {}
