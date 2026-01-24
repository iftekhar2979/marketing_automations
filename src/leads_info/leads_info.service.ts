import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { Lead } from "./entities/lead.entity";

type CreateLeadParams = {
  page_id: string;
  meta_lead_id: string;
  form_id: string;
  user: User;
  contructor_id?: string;
} & Record<string, string>;

@Injectable()
export class LeadsInfoService {
  constructor(@InjectRepository(Lead) private readonly _leadRepository: Repository<Lead>) {}
  async createLead({
    page_id,
    meta_lead_id,
    form_id,
    user,
    contructor_id,
    ...otherFields
  }: {
    page_id: string;
    meta_lead_id: string;
    form_id: string;
    user: User;
    contructor_id?: string;
  } & Record<string, string>) {
    console.log({
      meta_lead_id,
      agency: user,
      agency_id: user.id,
      contructor_id: contructor_id || null,
      form_id,
      ...otherFields,
    });
    const lead = this._leadRepository.create({
      meta_lead_id,
      agency: user,
      agency_id: user.id,
      contructor_id: contructor_id || null,
      form_id,
      ...otherFields,
    });
    await this._leadRepository.save(lead);
  }
}
