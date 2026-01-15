import { Body, Controller, Get, Headers, HttpException, HttpStatus, Post, Query } from "@nestjs/common";
import { StripeService } from "./stripe.service";
// import { ConfigService } from 'aws-sdk';

import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Controller("webhook")
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService
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
    const endpointSecret = this.configService.get<string>("STRIPE_WEBHOOK_SECRET");
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
  handleFacebookLead(@Body() body: any) {
    console.log("Incoming webhook event:", JSON.stringify(body, null, 2));

    // Check if it's a lead event
    if (body.object === "page") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === "leads") {
            const leadId = change.value.id;
            console.log("New lead ID:", leadId);

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
