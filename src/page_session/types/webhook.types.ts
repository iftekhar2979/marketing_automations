export interface LeadgenWebhookPayload {
  object: "page";
  entry: WebhookEntry[];
}

export interface WebhookEntry {
  id: string; // Page ID
  time: number; // Unix timestamp (seconds)
  changes: WebhookChange[];
}

export interface WebhookChange {
  field: "leadgen";
  value: LeadgenChangeValue;
}

export interface LeadgenChangeValue {
  created_time: number;
  leadgen_id: string;
  page_id: string;
  form_id: string;
}
