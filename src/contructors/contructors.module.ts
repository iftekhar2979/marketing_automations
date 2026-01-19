import { Module } from '@nestjs/common';
import { ContructorsController } from './contructors.controller';
import { ContructorsService } from './contructors.service';

@Module({
  controllers: [ContructorsController],
  providers: [ContructorsService]
})
export class ContructorsModule {}
