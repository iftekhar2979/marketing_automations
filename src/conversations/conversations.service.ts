import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ResponseInterface } from "src/common/types/responseInterface";
import { Lead } from "src/leads_info/entities/lead.entity";
import { Messages } from "src/messages/entities/messages.entity";
import { ConversationParticipant } from "src/participants/entities/participants.entity";
import { ParticipantsService } from "src/participants/participants.service";
import { RedisService } from "src/redis/redis.service";
import { pagination } from "src/shared/utils/pagination";
import { SocketService } from "src/socket/socket.service";
import { User } from "src/user/entities/user.entity";
import { UserService } from "src/user/user.service";
import { Brackets, DataSource, In, QueryRunner, Repository } from "typeorm";
import { CreateDirectConversationDto } from "./dto/create-direct-conversation.dto";
import { Conversations } from "./entities/conversations.entity";
@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversations)
    private _conversationRepo: Repository<Conversations>,
    @InjectRepository(Messages) private _messageRepo: Repository<Messages>,
    private readonly _participantService: ParticipantsService,
    private readonly _userService: UserService,
    private _dataSource: DataSource,
    private readonly _socketService: SocketService,
    private readonly _redisService: RedisService
  ) {}

  async getConversationId(conversationId: number) {
    return await this._conversationRepo.findOneByOrFail({ id: conversationId });
  }
  async createConversation({ lead, user }: { lead: Lead; user: User }) {
    const queryRunner = this._dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const conversation = await this._participantService.createParticipant(lead, queryRunner, user);
      await this.createConversations(lead, queryRunner, conversation);
      await queryRunner.commitTransaction();
    } catch (error) {
      console.log(error);
    }
  }

  async createConversations(lead: Lead, queryRunner: QueryRunner, conversation: ConversationParticipant) {
    return await queryRunner.manager.create(Conversations, {
      participants: [conversation],
      lead_phone: lead.phone,
    });
  }
  async updatedConversation({
    conversation_id,
    conversation,
    message,
  }: {
    conversation_id: number;
    conversation?: Partial<Conversations>;
    message: Messages;
  }) {
    const chat = await this.getConversationId(conversation_id);
    if (!chat) {
      throw new NotFoundException("Conversation not found");
    }
    if (message && conversation_id) {
      chat.lastmsg = message;
    }

    return await this._conversationRepo.save(chat);
  }

  async getAllConversations(user_id: string, term: string, page: number, limit: number) {
    try {
      // Calculate skip and take for pagination
      const skip = (page - 1) * limit;
      const take = limit;

      // Fetch conversations with necessary relations and apply pagination
      const [conversations, total] = await this._conversationRepo
        .createQueryBuilder("conversation")
        .leftJoinAndSelect("conversation.participants", "participant")
        .leftJoinAndSelect("conversation.product", "product")
        .leftJoinAndSelect("product.images", "productImages")
        .leftJoin("participant.user", "user") // Join with user but don't auto-select full user
        .leftJoinAndSelect("conversation.lastmsg", "lastmsg") // Join with last message
        .addSelect([
          "user.id",
          "user.first_name",
          "user.last_name",
          "user.image",
          "user.email",
          "user.isActive",
        ]) // Only select necessary fields from user
        .orderBy("conversation.created_at", "DESC")
        .where("user.id = :user_id", { user_id }) // Filter conversations where user.id is not equal to provided user_id
        .andWhere(
          new Brackets((qb) => {
            qb.where("conversation.name ILIKE :term", { term: `%${term}%` })
              .orWhere("user.first_name ILIKE :term", { term: `%${term}%` })
              .orWhere("user.last_name ILIKE :term", { term: `%${term}%` });
          })
        )
        .skip(skip) // Apply pagination
        .take(take)
        .cache(true)
        .getManyAndCount();

      // Process the conversations to include only other participants (exclude logged-in user)

      // Prepare the response object
      const response = {
        message: "Conversations retrieved successfully",
        statusCode: 200,
        data: conversations, // Include the filtered conversations
        pagination: pagination({ page, limit, total }), // Ensure pagination details
      };

      return response;
    } catch (error) {
      // Handle any unexpected errors and provide a descriptive message
      console.error("Error fetching conversations:", error);
      throw new Error("Unable to retrieve conversations at this time.");
    }
  }

  async directConversation({
    dto,
    user,
  }: {
    dto: CreateDirectConversationDto;
    user: User;
  }): Promise<ResponseInterface<Conversations>> {
    const queryRunner = this._dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { productId, userId } = dto;

      if (user.id === userId) {
        throw new ForbiddenException("same user can't create any conversation");
      }

      const participantIds = [userId, user.id];

      // ✅ 1. Check for existing conversation with same product and same 2 users
      const existingConversations = await this._conversationRepo
        .createQueryBuilder("conversation")
        .leftJoinAndSelect("conversation.participants", "participants")
        .leftJoinAndSelect("participants.user", "user")
        .where("conversation.product = :productId", { productId })
        .getMany();

      for (const conv of existingConversations) {
        const participantUserIds = conv.participants.map((p) => p.user.id);
        if (
          participantUserIds.length === 2 &&
          participantUserIds.includes(user.id) &&
          participantUserIds.includes(userId)
        ) {
          // ✅ Return existing conversation
          return {
            message: "conversation created successfully",
            status: "success",
            statusCode: 200,
            data: await this._conversationRepo.findOne({
              where: { id: conv.id },
              relations: ["participants", "participants.user", "product"],
            }),
          };
        }
      }

      // 3. Fetch Users
      const users = await queryRunner.manager.find(User, {
        where: { id: In(participantIds) },
      });

      if (users.length !== participantIds.length) {
        throw new Error("One or more users not found");
      }

      // 4. Create Conversation
      const conversation = queryRunner.manager.create(Conversations);

      const savedConversation = await queryRunner.manager.save(conversation);

      // 5. Create Participants
      const participants = users.map((user) =>
        queryRunner.manager.create(ConversationParticipant, {
          conversation: savedConversation,
          user,
        })
      );

      await queryRunner.manager.save(ConversationParticipant, participants);

      // 6. Commit
      await queryRunner.commitTransaction();

      // 7. Return with relations
      return {
        message: "conversation created successfully",
        status: "success",
        statusCode: 201,
        data: await this._conversationRepo.findOne({
          where: { id: savedConversation.id },
          relations: ["participants", "participants.user", "product"],
        }),
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
