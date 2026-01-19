export interface LeadgenLead {
  id: string;
  created_time: string; // ISO 8601 string
  field_data: LeadFieldData[];
}

export interface LeadFieldData {
  name: LeadFieldName | string;
  values: string[];
}

export type LeadFieldName =
  | "FULL_NAME"
  | "EMAIL"
  | "PHONE_NUMBER"
  | "FIRST_NAME"
  | "LAST_NAME"
  | "COMPANY_NAME"
  | "JOB_TITLE"
  | "CUSTOM";
