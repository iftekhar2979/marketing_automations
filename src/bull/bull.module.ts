import { Module } from "@nestjs/common";
import { FirebaseModule } from "src/firebase/firebase.module";
import { MailModule } from "src/mail/mail.module";
import { NotificationsModule } from "src/notifications/notifications.module";
import { BullController } from "./bull.controller";
import { BullService } from "./bull.service";

@Module({
  imports: [MailModule, FirebaseModule, NotificationsModule],
  providers: [BullService],
  controllers: [BullController],
})
export class BullModule {}
