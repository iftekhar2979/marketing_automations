import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AgencyProfilesModule } from "src/agency_profiles/agency_profiles.module";
import { FirebaseModule } from "src/firebase/firebase.module";
import { LeadsInfoModule } from "src/leads_info/leads_info.module";
import { MailModule } from "src/mail/mail.module";
import { NotificationsModule } from "src/notifications/notifications.module";
import { OtpModule } from "src/otp/otp.module";
import { User } from "src/user/entities/user.entity";
import { Verification } from "src/user/entities/verification.entity";
import { UserModule } from "src/user/user.module";
import { BullController } from "./bull.controller";
import { BullService } from "./bull.service";
import { AuthQueueProcessor } from "./processors/AuthenticationQueue";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Verification]),
    ,
    MailModule,
    FirebaseModule,
    NotificationsModule,
    UserModule,
    OtpModule,
    UserModule,
    LeadsInfoModule,
    AgencyProfilesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>("JWT_SECRET") as any,
          signOptions: {
            expiresIn: configService.get<string>("EXPIRES_IN") as any,
          },
        };
      },
    }),
  ],
  providers: [BullService, AuthQueueProcessor],
  controllers: [BullController],
})
export class BullModule {}
