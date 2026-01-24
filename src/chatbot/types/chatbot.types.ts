export interface DynamicFormField {
  name: string;

  values?: string[]; // For select/multiselect
}

export interface DynamicFormData {
  formId?: string;
  formName?: string;
  fields: DynamicFormField[];
  createdAt?: Date;
}

export interface UserInfo {
  id: string;
  name: string;
  role?: string; // e.g., "Sales Representative", "Business Development"
  email: string;
  phone: string;
  company?: string;
  department?: string;
  bio?: string;
}

export interface ClientContext {
  id: string;
  formData: DynamicFormData;
  userInfo: UserInfo;
  conversationHistory: Message[];
  status: "greeting" | "information_gathering" | "appointment_scheduling" | "closing";
  collectedData: Map<string, string>;
  metadata: {
    startedAt: Date;
    lastActivityAt: Date;
    sourceChannel: string; // 'website', 'phone', 'email', etc.
  };
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  message: string;
  nextAction?: string;
  suggestedQuestions?: string[];
  collectedFields?: Map<string, string>;
}
