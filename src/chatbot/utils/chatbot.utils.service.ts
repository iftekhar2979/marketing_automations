import { Injectable } from "@nestjs/common";
import {
    FormFieldMessageClientContext,
    NormalizedClientUserInfo,
    RawMessageClientContext,
} from "../types/chatbot.types";

@Injectable()
export class ChatbotUtilsService {
  extractClientUserInfo(
    context: RawMessageClientContext | FormFieldMessageClientContext
  ): NormalizedClientUserInfo {
    const user = context.userInfo;

    // form-based Meta profile
    if ("users" in user) {
      return {
        first_name: user.users.first_name,
        last_name: user.users.last_name,
        buisness_category: user.buisness_category,
        buisness_name: user.buisness_name,
        phone: user.users.phone,
        email: user.users.email,
      };
    }

    // raw message user
    return {
      first_name: user.first_name,
      last_name: user.last_name,
      buisness_category: user.buisness_profiles.buisness_category,
      buisness_name: user.buisness_profiles.buisness_name,
      phone: user.phone,
      email: user.email,
    };
  }
}
