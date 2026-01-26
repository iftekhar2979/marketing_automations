import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { AgencyProfilesService } from "src/agency_profiles/agency_profiles.service";
import { ChatbotService } from "src/chatbot/chatbot.service";
import { LeadsInfoService } from "src/leads_info/leads_info.service";
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
    private readonly _chatbotService: ChatbotService
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
    console.log("joB rUN sUCESSFULLY");
    const { page_id, lead_id, form_id, field_data, destructedLeadsInfo } = job.data;
    console.log("Distruction Issue", job.data);
    const { firstName, lastName, name, email, phone, zipCode, postalCode } = destructedLeadsInfo;
    console.log("Distruction Issue=2");
    const pageInfo = await this._metaBuisnesService.findByPageId(page_id);
    console.log("Page Information", pageInfo);
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
    console.log("Message Processsing");
    // const result = await this._chatbotService.chat(
    //   lead_id,
    //   `Hi My Information is`,
    //   {
    //     formId: form_id,
    //     fields: field_data,
    //     formName: "Lead Information",
    //   },
    //   pageInfo.users
    // );
    // console.log(result);
  }
}
