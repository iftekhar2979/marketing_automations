import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  PromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/ollama";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DynamicFormField,
  FormFieldMessageClientContext,
  Message,
  RawMessageClientContext,
} from "src/chatbot/types/chatbot.types";
import { ChatbotUtilsService } from "src/chatbot/utils/chatbot.utils.service";
@Injectable()
export class LangChainOpenAIService {
  // private llm: ChatGoogleGenerativeAI;
  private llm: ChatOllama;
  private systemPrompt: ChatPromptTemplate;

  constructor(
    private _configService: ConfigService,
    private _chatbotUtils: ChatbotUtilsService
  ) {
    this.initializeLLM();
    this.initializeSystemPrompt();
  }

  private initializeLLM(): void {
    // this.llm = new ChatGoogleGenerativeAI({
    //   apiKey: this._configService.get("GEMINI_API_KEY"),
    //   model: this._configService.get("GEMINI_MODEL", "gemini-1.5-pro"),
    //   temperature: this._configService.get("GEMINI_TEMPERATURE", 0.7),
    //   maxOutputTokens: this._configService.get("GEMINI_MAX_TOKENS", 500),
    // });
    this.llm = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "mistral",
      temperature: 0.7,
    });
  }

  private initializeSystemPrompt(): void {
    this.systemPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
You are {representativeName}, a real human representative from {agency}.

Your Profile:
- Email: {representativeEmail}
- Phone: {representativePhone}

Your Role:
Have a natural, professional, human-like conversation with a potential client.
You are NOT a chatbot and must never sound automated.

Conversation Context:
- Source: {sourceChannel}
- Current Status: {currentStatus}
- Client Name: {clientName}

Form Fields Available:
{formFieldsInfo}

Information Already Collected:
{collectedData}

Rules (STRICT):
1. Be warm, professional, and concise (2–4 sentences max).
2. Use the client’s name when available.
3. ONLY ask for information that is missing from {collectedData}.
4. If a phone number is required and missing, ask for it politely.
5. If no work/project-related information exists, ask what type of work the client needs.
6. If no location/service-area information exists, ask where the work will take place.
7. NEVER ask questions already covered by collected data.
8. NEVER mention websites, forms, landing pages, or online submissions.
9. Reference questions naturally, like a real conversation.
10. Be persuasive but never pushy.
11. If enough information is collected, suggest the next step (call, visit, estimate, demo).

Conversation History (Last 5 messages):
{conversationHistory}

Remember: You are {representativeName} from {agency}, not a generic chatbot.
`),
      HumanMessagePromptTemplate.fromTemplate("{userMessage}"),
    ]);
  }

  getClientName = (data) => {
    const possibleKeys = [
      "full_name",
      "FULL_NAME",
      "FIRST_NAME",
      "LAST_NAME",
      "first_name",
      "last_name",
      "name",
    ];

    // Convert Map keys or Object keys to a searchable format
    for (const key of possibleKeys) {
      // This handles both Map .get() and standard Object lookup
      const foundKey = [...data.keys()].find((k) => k.toLowerCase() === key.toLowerCase());
      if (foundKey && data.get(foundKey)) return data.get(foundKey);
    }
    return "Client";
  };
  async generateResponse(
    clientContext: RawMessageClientContext | FormFieldMessageClientContext,
    userMessage: string
  ): Promise<string> {
    try {
      const clientUserInfo = this._chatbotUtils.extractClientUserInfo(clientContext);
      const prompt = await this.systemPrompt.formatPromptValue({
        representativeName: clientUserInfo.first_name + clientUserInfo.last_name,
        agency: clientUserInfo.buisness_name,
        representativeEmail: clientUserInfo.email,
        representativePhone: clientUserInfo.phone,
        representativeBio: clientUserInfo.buisness_category || "Not specified",
        sourceChannel: clientContext.metadata.sourceChannel,
        currentStatus: clientContext.status,
        clientName: this.getClientName(clientContext.collectedData),
        formFieldsInfo: this.formatFormFields(clientContext.formData),
        collectedData: this.formatCollectedData(clientContext.collectedData),
        conversationHistory: this.formatConversationHistory(clientContext.conversationHistory),
        userMessage,
      });

      const response = await this.llm.invoke(prompt.toString());
      return response.content.toString();
    } catch (error) {
      console.error("LangChain GenAI Error:", error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  async extractStructuredData(
    userMessage: string,
    formFields: { name: string; values: string[] }[]
  ): Promise<Map<string, string>> {
    console.log(formFields);
    const extractionPrompt = PromptTemplate.fromTemplate(`
Extract the following information from this message. 
- If the user provides new details, extract those.
- If the user refers to existing info (e.g., "that is my info" or "looks good" or "hey"), extract the values provided in the (Context) sections.

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

    const formFieldsDefinitions = formFields
      .map((f) => {
        const valueContext = f.values.length > 0 ? ` (Context: ${f.values.join(", ")})` : "";
        return `- ${f.name}${valueContext}`;
      })
      .join("\n");

    const formattedPrompt = await extractionPrompt.formatPromptValue({
      formFields: formFieldsDefinitions,
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
  async extractStructuredInformation(userMessage: string): Promise<Map<string, string>> {
    // 1. Define the fields you are trying to collect
    const targetFields = [
      { id: "name", label: "Full Name" },
      { id: "email", label: "Email Address" },
      { id: "phone", label: "Phone Number" },
    ];

    const fieldList = targetFields.map((f) => `- ${f.id} (${f.label})`).join("\n");

    // 2. Build the Prompt
    // We tell the AI to look for these fields specifically in the userMessage
    const extractionPrompt = PromptTemplate.fromTemplate(`
You are a data extraction specialist. 
Your task is to identify if the user provided any of the following fields in their message.

Fields to Look For:
{fieldList}

User Message: "{userMessage}"

Rules:
- If a value is provided, extract it.
- If the user is correcting a previous value, extract the new one.
- Return ONLY JSON.

Response Format:
{{
  "extracted": {{
    "field_id": "value"
  }}
}}
`);

    const formattedPrompt = await extractionPrompt.format({
      fieldList,
      userMessage,
    });

    try {
      const response = await this.llm.invoke(formattedPrompt);
      const content = response.content.toString();

      // 3. Extract JSON from potential conversational filler
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const result = new Map<string, string>();

        if (parsed.extracted) {
          Object.entries(parsed.extracted).forEach(([key, value]) => {
            if (value) result.set(key, String(value));
          });
        }
        return result;
      }
    } catch (error) {
      console.error("LLM Extraction Error:", error);
    }

    return new Map();
  }
  // private formatFormFields(fields: DynamicFormField[]): string {
  //   return fields
  //     .map((field) => {
  //       let fieldInfo = `- ${field.name} )`;
  //       if (field.values) fieldInfo += ` [Answer: ${field.values.join(", ")}]`;
  //       return fieldInfo;
  //     })
  //     .join("\n");
  // }

  private formatFormFields(fields: DynamicFormField[]): string {
    if (!fields || !Array.isArray(fields)) return ""; // Safety check for the whole array

    return fields
      .map((field) => {
        let fieldInfo = `- ${field.name}`;

        // Check if values exists AND is an array
        if (field.values && Array.isArray(field.values)) {
          fieldInfo += ` [Answer: ${field.values.join(", ")}]`;
        } else if (field.values) {
          // Fallback if values is just a string
          fieldInfo += ` [Answer: ${field.values}]`;
        }

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
