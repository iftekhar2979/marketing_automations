import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { AgencyProfilesService } from "src/agency_profiles/agency_profiles.service";
import { ChatbotService } from "src/chatbot/chatbot.service";
import { ConversationsService } from "src/conversations/conversations.service";
import { LeadsInfoService } from "src/leads_info/leads_info.service";
import { MessageDirection } from "src/messages/entities/messages.entity";
import { MessagesService } from "src/messages/messages.service";
import { PageSessionService } from "src/page_session/page_session.service";
import { Field, LeadProfile } from "src/page_session/types/leadgen.types";
import { RedisService } from "src/redis/redis.service";
import { UserService } from "src/user/user.service";

@Processor("leads")
export class LeadsQueueProcessor {
  constructor(
    private readonly _redisService: RedisService,
    private readonly _agencyService: AgencyProfilesService,
    private readonly _userService: UserService,
    private readonly _metaBuisnesService: PageSessionService,
    private readonly _leadsService: LeadsInfoService,
    private readonly _chatbotService: ChatbotService,
    private readonly _conversationService: ConversationsService,
    private readonly _messageService: MessagesService
  ) {}
  @Process("seed")
  async seedLead(
    job: Job<{
      page_id: string;
      lead_id: string;
      form_id: string;
      destructedLeadsInfo: LeadProfile;
      field_data: Field[];
    }>
  ) {
    const { page_id, lead_id, form_id, field_data, destructedLeadsInfo } = job.data;
    const { firstName, lastName, name, email, phone, zipCode, postalCode } = destructedLeadsInfo;
    const pageInfo = await this._metaBuisnesService.findByPageId(page_id);
    const leadsField = JSON.stringify(field_data);
    const lead = await this._leadsService.createLead({
      page_id,
      meta_lead_id: lead_id,
      form_id,
      email,
      name,
      user: pageInfo.users[0],
      phone,
      form_info: leadsField,
    });
    const user = pageInfo.users[0];
    console.log("User", pageInfo);
    const conversations = await this._conversationService.createConversation({ lead, user });
    console.log("conversation", conversations);
    const result = await this._chatbotService.chat(
      lead.id,
      "Hey , I have provided my informations.If you need anything you can ask me .",
      field_data,
      pageInfo
    );
    await this._messageService.sendMessage({
      sender: user,
      conversation_id: conversations.id,
      direction: MessageDirection.INBOUND,
    });
  }
}
