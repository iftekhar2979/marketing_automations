import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { PageSessionModule } from "src/page_session/page_session.module";
import { UserModule } from "src/user/user.module";
import { StripeController } from "./stripe.controller";
import { StripeService } from "./stripe.service";

// @Global()
@Module({
  imports: [
    // TypeOrmModule.forFeature()
    UserModule,
    AuthModule,
    PageSessionModule,
    // WalletsModule
  ],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
