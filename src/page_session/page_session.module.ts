import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MetaBuisnessProfiles } from "./entites/meta_buisness.entity";
import { PageSessionController } from "./page_session.controller";
import { PageSessionService } from "./page_session.service";

@Module({
  imports: [TypeOrmModule.forFeature([MetaBuisnessProfiles]), HttpModule],
  providers: [PageSessionService],
  controllers: [PageSessionController],
  exports: [PageSessionService],
})
export class PageSessionModule {}
