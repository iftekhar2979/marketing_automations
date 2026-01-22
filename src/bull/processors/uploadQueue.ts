import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { AgencyProfilesService } from "src/agency_profiles/agency_profiles.service";
import { RedisService } from "src/redis/redis.service";
import { User } from "src/user/entities/user.entity";
import { UserService } from "src/user/user.service";
import { AgencyUpdateData } from "src/webhook/types/aws_webhook";

@Processor("uploadQueue")
export class UploadProcessor {
  constructor(
    private readonly _redisService: RedisService,
    private readonly _agencyService: AgencyProfilesService,
    private readonly _userService: UserService
  ) {}
  @Process("process-bulk")
  async handleFlush(job: Job<{ pushData: AgencyUpdateData }>) {
    console.log("JOB", job.data);
    const { pushData } = job.data;
    const { user_id } = pushData;
    const client = this._redisService.getClient();
    const cacheKey = `s3_batch:${user_id}`;
    // 1. Fetch buffered data
    const data = (await client.hGetAll(cacheKey)) as any;
    if (!data || Object.keys(data).length === 0) return;
    // 2. Perform ONE Bulk DB call
    if (pushData.user_id) {
      if (pushData.image) {
        await this._userService.updateImage({ imageUrl: pushData.image, user: { id: user_id } as User });
      } else {
        await this._agencyService.updatePictures({ id: user_id } as User, job.data.pushData);
      }
    }

    // 3. Clear buffer
    await client.del(cacheKey);
  }
}
