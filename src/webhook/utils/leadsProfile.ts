import { LeadFieldName, LeadgenLead, LeadProfile } from "src/page_session/types/leadgen.types";

export function parseLeadInfo(leadInfo: LeadgenLead): LeadProfile {
  const obj: LeadProfile = {};

  const fieldMap: Partial<Record<LeadFieldName, (value: string) => void>> = {
    [LeadFieldName.FULL_NAME]: (v) => (obj.name = v),
    [LeadFieldName.EMAIL]: (v) => (obj.email = v),
    [LeadFieldName.email]: (v) => (obj.email = v),
    [LeadFieldName.PHONE_NUMBER]: (v) => (obj.phone = v),
    [LeadFieldName.FIRST_NAME]: (v) => (obj.firstName = v),
    [LeadFieldName.LAST_NAME]: (v) => (obj.lastName = v),
    [LeadFieldName.COMPANY_NAME]: (v) => (obj.companyName = v),
    [LeadFieldName.JOB_TITLE]: (v) => (obj.jobTitle = v),
    [LeadFieldName.ZIP_CODE]: (v) => (obj.zipCode = v),
    [LeadFieldName.POSTAL_CODE]: (v) => (obj.postalCode = v),
    [LeadFieldName.full_name]: (v) => (obj.name = v),
    [LeadFieldName.phone_number]: (v) => (obj.phone = v),
    [LeadFieldName.zip_code]: (v) => (obj.zipCode = v),
    [LeadFieldName.postal_code]: (v) => (obj.postalCode = v),
    [LeadFieldName.name]: (v) => (obj.name = v),
    [LeadFieldName.job_title]: (v) => (obj.jobTitle = v),
  };

  leadInfo.field_data.forEach(({ name, values }) => {
    const value = values?.[0];
    if (!value) return;

    fieldMap[name]?.(value);
  });

  return obj;
}
