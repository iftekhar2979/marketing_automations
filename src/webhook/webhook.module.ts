import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { PageSessionModule } from "src/page_session/page_session.module";
import { UserModule } from "src/user/user.module";
import { WebhookController } from "./webhook.controller";
import { WebhookService } from "./webhook.service";

// @Global()
@Module({
  imports: [
    // TypeOrmModule.forFeature()
    UserModule,
    AuthModule,
    PageSessionModule,
    BullModule.registerQueue({ name: "uploadQueue" }),
    // WalletsModule
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
