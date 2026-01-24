import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "src/auth/auth.module";
import { UserModule } from "src/user/user.module";
import { Lead } from "./entities/lead.entity";
import { LeadsInfoController } from "./leads_info.controller";
import { LeadsInfoService } from "./leads_info.service";

@Module({
  imports: [TypeOrmModule.forFeature([Lead]), AuthModule, UserModule],
  controllers: [LeadsInfoController],
  providers: [LeadsInfoService],
  exports: [LeadsInfoService],
})
export class LeadsInfoModule {}
