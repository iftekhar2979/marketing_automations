import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { AgencyProfilesService } from "src/agency_profiles/agency_profiles.service";
import { RedisService } from "src/redis/redis.service";
import { UserService } from "src/user/user.service";

@Processor("global")
export class GlobalQueueProcessor {
  constructor(
    private readonly _redisService: RedisService,
    private readonly _agencyService: AgencyProfilesService,
    private readonly _userService: UserService
  ) {}
  @Process("invalidate-user-cache")
  async GlobalQueue(job: Job) {
    const { user_id } = job.data;
    const client = this._redisService.getClient();
    // Pattern delete for both user and agency caches
    const keysToClear = await client.keys(`*:${user_id}:*`);
    if (keysToClear.length > 0) {
      await client.del(keysToClear);
    }
  }
}
