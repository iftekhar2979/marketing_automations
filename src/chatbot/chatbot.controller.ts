import {
    Body,
    Controller,
    InternalServerErrorException,
    Post,
    UsePipes,
    ValidationPipe,
} from "@nestjs/common";
import { ChatbotService } from "./chatbot.service";
import { ChatRequestDto } from "./dto/ChatRequest.dto";

@Controller("chatbot")
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}
  @Post("message")
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleChat(@Body() chatRequest: ChatRequestDto) {
    try {
      const { clientId, userMessage, formData, userInfo } = chatRequest;

      const response = await this.chatbotService.chat(clientId, userMessage, formData, userInfo);

      return response;
    } catch (error) {
      // Mapping the service error to a NestJS HTTP Exception
      throw new InternalServerErrorException({
        message: "Could not process chat message",
        detail: error.message,
      });
    }
  }
  @Post("message/raw")
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleRawMessaging(@Body() chatRequest: any) {
    try {
      const { clientId, userMessage, userInfo } = chatRequest;

      const response = await this.chatbotService.sendRawMessage(clientId, userMessage, userInfo);

      return response;
    } catch (error) {
      // Mapping the service error to a NestJS HTTP Exception
      throw new InternalServerErrorException({
        message: "Could not process chat message",
        detail: error.message,
      });
    }
  }
}
