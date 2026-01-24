import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    PromptTemplate,
    SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientContext, DynamicFormField, Message } from "src/chatbot/types/chatbot.types";

@Injectable()
export class LangChainOpenAIService {
  private llm: ChatGoogleGenerativeAI;
  private systemPrompt: ChatPromptTemplate;

  constructor(private _configService: ConfigService) {
    this.initializeLLM();
    this.initializeSystemPrompt();
  }

  private initializeLLM(): void {
    this.llm = new ChatGoogleGenerativeAI({
      apiKey: this._configService.get("GEMINI_API_KEY"),
      model: this._configService.get("GEMINI_MODEL", "gemini-1.5-pro"),
      temperature: this._configService.get("GEMINI_TEMPERATURE", 0.7),
      maxOutputTokens: this._configService.get("GEMINI_MAX_TOKENS", 500),
    });
  }

  private initializeSystemPrompt(): void {
    this.systemPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`You are {representativeName}, a {representativeRole} at {company}.

Your Profile:
- Email: {representativeEmail}
- Phone: {representativePhone}

Your task is to have a natural, professional conversation with a potential client.

Context About This Conversation:
- Source: {sourceChannel}
- Current Status: {currentStatus}
- Client Name: {clientName}

Form Fields You're Gathering Information About:
{formFieldsInfo}

Information Already Collected:
{collectedData}

Guidelines:
1. Be warm, professional, and authentic - you are {representativeName}
2. Reference the form fields naturally in conversation
3. Only ask for required fields if not collected yet
4. Use the client's name when available
5. Provide specific value propositions
6. Be persuasive but never pushy
7. If enough information is collected, suggest next steps (demo, call, meeting)
8. Keep responses concise (2-4 sentences)
9. Build genuine rapport

Conversation History (Last 5 messages):
{conversationHistory}

Remember: You are {representativeName} from {company}, not a generic chatbot.`),
      HumanMessagePromptTemplate.fromTemplate("{userMessage}"),
    ]);
  }

  async generateResponse(clientContext: ClientContext, userMessage: string): Promise<string> {
    try {
      const prompt = await this.systemPrompt.formatPromptValue({
        representativeName: clientContext.userInfo.name,
        representativeRole: clientContext.userInfo.role,
        company: clientContext.userInfo.company,
        representativeEmail: clientContext.userInfo.email,
        representativePhone: clientContext.userInfo.phone,
        representativeBio: clientContext.userInfo.bio || "Not specified",
        sourceChannel: clientContext.metadata.sourceChannel,
        currentStatus: clientContext.status,
        clientName: clientContext.collectedData.get("full_name") || "Client",
        formFieldsInfo: this.formatFormFields(clientContext.formData.fields),
        collectedData: this.formatCollectedData(clientContext.collectedData),
        conversationHistory: this.formatConversationHistory(clientContext.conversationHistory),
        userMessage,
      });

      const response = await this.llm.invoke(prompt.toString());
      return response.content.toString();
    } catch (error) {
      console.error("LangChain OpenAI Error:", error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  async extractStructuredData(
    userMessage: string,
    formFields: DynamicFormField[]
  ): Promise<Map<string, string>> {
    const extractionPrompt = PromptTemplate.fromTemplate(`
Extract the following information from this message. Only extract data that is explicitly mentioned.
For phone numbers, ensure they are complete and valid.

Form Fields to Extract:
{formFields}

User Message: "{userMessage}"

Response in JSON format:
{{
  "extracted": {{
    "field_name": "value"
  }},
  "confidence": 0.0
}}
`);

    const formattedPrompt = await extractionPrompt.formatPromptValue({
      formFields: formFields.map((f) => `- ${f.name} `).join("\n"),
      userMessage,
    });

    const response = await this.llm.invoke(formattedPrompt.toString());
    const content = response.content.toString();

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const extracted = new Map<string, string>();

        Object.entries(parsed.extracted || {}).forEach(([key, value]) => {
          if (value) extracted.set(key, String(value));
        });

        return extracted;
      }
    } catch (error) {
      console.error("Extraction parsing error:", error);
    }

    return new Map();
  }

  private formatFormFields(fields: DynamicFormField[]): string {
    return fields
      .map((field) => {
        let fieldInfo = `- ${field.name} )`;
        // let fieldInfo = `- ${field.name} (${field.type})`;
        // if (field.label) fieldInfo += `: ${field.label}`;
        // if (field.required) fieldInfo += " [REQUIRED]";
        if (field.values) fieldInfo += ` [Options: ${field.values.join(", ")}]`;
        return fieldInfo;
      })
      .join("\n");
  }

  private formatCollectedData(data: Map<string, string>): string {
    if (data.size === 0) return "No information collected yet.";
    return Array.from(data.entries())
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n");
  }

  private formatConversationHistory(messages: Message[]): string {
    return messages
      .slice(-5)
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n");
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.llm.invoke("Say hello");
      return response.content.toString().length > 0;
    } catch (error) {
      console.error("OpenAI connection test failed:", error);
      return false;
    }
  }
}
