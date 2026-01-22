import { HttpModule } from "@nestjs/axios";
import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AgencyProfilesModule } from "src/agency_profiles/agency_profiles.module";
import { AuthModule } from "src/auth/auth.module";
import { UserModule } from "src/user/user.module";
import { MetaBuisnessProfiles } from "./entites/meta_buisness.entity";
import { PageSessionController } from "./page_session.controller";
import { PageSessionService } from "./page_session.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([MetaBuisnessProfiles]),
    HttpModule,
    AuthModule,
    AgencyProfilesModule,
    UserModule,
    BullModule.registerQueue({ name: "global" }),
  ],
  providers: [PageSessionService],
  controllers: [PageSessionController],
  exports: [PageSessionService],
})
export class PageSessionModule {}
