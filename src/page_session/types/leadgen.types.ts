export interface LeadgenLead {
  id: string;
  created_time: string; // ISO 8601 string
  field_data: Field[];
}

export interface LeadFieldData {
  name: LeadFieldName | string;
  values: string[];
}

export enum LeadFieldName {
  FULL_NAME = "FULL_NAME",
  EMAIL = "EMAIL",
  PHONE_NUMBER = "PHONE_NUMBER",
  FIRST_NAME = "FIRST_NAME",
  LAST_NAME = "LAST_NAME",
  COMPANY_NAME = "COMPANY_NAME",
  JOB_TITLE = "JOB_TITLE",
  CUSTOM = "CUSTOM",
  ZIP_CODE = "ZIP_CODE",
  POSTAL_CODE = "POSTAL_CODE",
  full_name = "full_name",
  phone_number = "phone_number",
  email = "email",
  zip_code = "zip_code",
  postal_code = "postal_code",
  name = "name",
  job_title = "job_title",
}

export interface LeadProfile {
  name?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  jobTitle?: string;
  zipCode?: string;
  postalCode?: string;
}
export type Field = {
  name: LeadFieldName;
  values: string[];
};
