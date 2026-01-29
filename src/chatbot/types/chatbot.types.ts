import { MetaBuisnessProfiles } from "src/page_session/entites/meta_buisness.entity";
import { User } from "src/user/entities/user.entity";

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
export type ConversationStatus =
  | "greeting"
  | "information_gathering"
  | "appointment_scheduling"
  | "closing"
  | "conversation";

export interface FormField {
  name: string;
  values: string[];
}
export interface ClientContext<TUser = unknown, TForm = FormField[]> {
  id: string;
  formData?: TForm;
  userInfo: TUser;
  conversationHistory: Message[];
  status: ConversationStatus;
  collectedData: Map<string, string>;
  metadata: {
    startedAt: Date;
    lastActivityAt: Date;
    sourceChannel: string; // 'website', 'phone', 'email', etc.
  };
}

export type RawMessageClientContext = ClientContext<User, never>;
export type FormFieldMessageClientContext = ClientContext<MetaBuisnessProfiles, FormField[]>;
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
type Status = "greeting" | "information_gathering" | "appointment_scheduling" | "closing" | "conversation";

export interface FormAwareContext {
  formData: { name: string }[];
  collectedData: Map<string, string>;
  status: Status;
}

export interface NormalizedClientUserInfo {
  first_name: string;
  last_name: string;
  buisness_category: string;
  buisness_name: string;
  phone: string;
  email: string;
}
