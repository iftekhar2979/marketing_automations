import { Type } from "class-transformer";
import { IsArray, IsEnum, IsInt, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { AttachmentDto } from "src/attachment/dto/attachments.dto";
import { User } from "src/user/entities/user.entity";
import { MessageDirection } from "../entities/messages.entity";

export class SendMessageDto {
  @IsUUID()
  sender: User;

  @IsInt()
  conversation_id: number;

  @IsOptional()
  @IsString()
  msg?: string;

  @IsEnum(["OUTBOUND", "INBOUND"])
  direction?: MessageDirection;
  @IsOptional()
  @IsString()
  type?: "text" | "image" | "video" | "offer";

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
