// src/chatbot/dto/chat-request.dto.ts
import { IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  userMessage: string;

  //   @IsJSON()
  formData: any; // Ideally, replace 'any' with your DynamicFormData type

  @IsObject()
  @IsOptional()
  userInfo?: any;
}
