import { Body, Controller, Get, Headers, HttpException, HttpStatus, Post, Query } from "@nestjs/common";
import { StripeService } from "./stripe.service";
// import { ConfigService } from 'aws-sdk';

import { ConfigService } from "@nestjs/config";
import { PageSessionService } from "src/page_session/page_session.service";
import { LeadgenWebhookPayload } from "src/page_session/types/webhook.types";
import Stripe from "stripe";

@Controller("webhook")
export class StripeController {
  constructor(
    private readonly _stripeService: StripeService,
    private readonly _configService: ConfigService,
    private readonly _pageSessionService: PageSessionService
    // private readonly walletService: WalletsService
  ) {}

  //   @Post('payment')
  // @UseGuards(JwtAuthenticationGuard)
  // async createPaymentIntent(
  //   @GetUser() user : User,
  //   @Body() body:RechargeDto
  // ) {
  //   const {  amount } = body;
  //   const paymentIntent = await this.stripeService.createPaymentIntent(
  //     amount,
  //     user,
  //   );
  //   return { paymentIntent };
  // }

  // Webhook handler for Stripe events
  @Post("stripe")
  async handleStripeWebhook(@Body() rawBody: Buffer, @Headers("stripe-signature") signature: string) {
    console.log(signature);
    const endpointSecret = this._configService.get<string>("STRIPE_WEBHOOK_SECRET");
    // console.log(endpointSecret)
    try {
      // Use stripe.webhooks.constructEvent directly to verify the event
      const event = Stripe.webhooks.constructEvent(
        rawBody, // Raw body from the request
        signature,
        endpointSecret
      );
      // Handle the event based on the event type
      // console.log(event.data.object)
      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object as any;
          console.log(session);
          const { user, amount, email, name } = session.metadata;

          // console.log(session.metadata)
          // await this.walletService.rechargeWallet({userId:user.id, amount,paymentMethod:"Stripe"})
          // Perform necessary actions after successful payment
          break;

        case "checkout.session.async_payment_failed":
          const invoice = event.data.object;
          throw new HttpException("Webhook event verification failed", HttpStatus.BAD_REQUEST);

        // Handle other event types here...

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (err) {
      console.error("Error processing webhook:", err);
      throw new HttpException("Webhook event verification failed", HttpStatus.BAD_REQUEST);
    }
  }

  @Get("facebook")
  verifyFacebookWebhook(
    @Query("hub.mode") mode: string,
    @Query("hub.verify_token") token: string,
    @Query("hub.challenge") challenge: string
  ) {
    // MUST match exactly what you put in the Facebook Developer Portal
    const VERIFY_TOKEN = "1qazxsw2";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      // Return the challenge as a raw string
      return challenge;
    } else {
      console.log("VERIFICATION_FAILED");
      // This is why you are seeing the 403 error
      throw new HttpException("Verification failed", HttpStatus.FORBIDDEN);
    }
  }

  @Post("facebook")
  async handleFacebookLead(@Body() body: LeadgenWebhookPayload) {
    console.log("Incoming webhook event:", JSON.stringify(body, null, 2));

    // Check if it's a lead event
    if (body.object === "page") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === "leadgen") {
            console.log(entry.changes);
            if (!entry.changes || entry.changes.length === 0) {
              console.log("No changes found in the webhook entry.");
              break;
            }
            if (entry.changes[0].field !== "leadgen") {
              console.log("The change field is not leadgen.");
              break;
            }
            const page_id = entry.changes[0].value.page_id;
            if (!page_id) {
              console.log("Page ID not found in the webhook payload.");
            }
            const validate_page = await this._pageSessionService.validateMetaPageExists(page_id);
            console.log(validate_page);
            if (!validate_page) {
              console.log(`Lead not found: ${page_id}`);
              // break;
            }
            if (!validate_page.data[page_id]) {
              console.log(`No data found for page ID: ${page_id}`);
              // break;
            }
            const lead_id = change.value.leadgen_id;
            const validate_lead = await this._pageSessionService.leadInformations({
              access_token: validate_page.data[page_id].access_token,
              lead_id,
            });
            // console.log("New lead ID:", lead_id);
            console.log(validate_lead);
            // TODO: Fetch full lead details using Graph API
            // this.fetchLeadDetails(leadId);
          }
        }
      }
    }

    // Always return 200 OK quickly to acknowledge receipt
    return "EVENT_RECEIVED";
  }
}
