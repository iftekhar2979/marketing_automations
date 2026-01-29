import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Conversations } from "src/conversations/entities/conversations.entity";
import { Lead } from "src/leads_info/entities/lead.entity";
import { User } from "src/user/entities/user.entity";
import { EntityManager, QueryRunner, Repository } from "typeorm";
import { ConversationParticipant } from "./entities/participants.entity";

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(ConversationParticipant)
    private participantRepo: Repository<ConversationParticipant>
  ) {}
  async add(conversation: Conversations, user: User) {
    const exists = await this.participantRepo.findOne({
      where: { conversation: { id: conversation.id }, user: { id: user.id } },
    });
    if (exists) return exists;
    const participant = this.participantRepo.create({ conversation, user });
    return this.participantRepo.save(participant);
  }
  async createParticipantEntity(
    queryRunner: QueryRunner,
    conversation: Conversations,
    user: User,
    lead: Lead
  ) {
    const participantRepo = queryRunner.manager.getRepository(ConversationParticipant);

    // Ensure all values are defined to avoid UpdateValuesMissingError
    const participant = participantRepo.create({
      conversation: conversation,
      user: user,
      lead: lead,
      lead_phone: lead.phone ?? null,
      lead_email: lead.email ?? null,
      isMuted: false,
    });
    console.log(participant);
    return await queryRunner.manager.save(participant);
  }

  async addMultiple(conversation: Conversations, users: User[], manager?: EntityManager) {
    const participants = users.map((user) => ({
      user,
      conversation,
    }));
    if (manager) {
      await manager.getRepository(ConversationParticipant).save(participants);
    } else {
      await this.participantRepo.save(participants);
    }
  }
  async checkChatAlreadyExist(query: { conversation_id?: number; product_id?: number; user_ids?: string[] }) {
    const { conversation_id, product_id } = query;
    const whereConditions: any = {};
    if (product_id) {
      whereConditions.product = { id: product_id };
    }
    if (conversation_id) {
      whereConditions.conversation = { id: conversation_id };
    }
    const existingParticipants = await this.participantRepo.find({
      where: whereConditions,
      relations: ["user", "conversation", "product"],
    });
    return existingParticipants;
  }
  async getParticipants(conversationId: number): Promise<ConversationParticipant[]> {
    return await this.participantRepo.find({
      where: { conversation: { id: conversationId } },
      relations: ["user", "conversation", "product"], // We are joining the user relation
      select: {
        user: {
          first_name: true,
          last_name: true,
          email: true,
          image: true,
          id: true,
          is_active: true,
        },
      },
    });
  }
  async checkEligablity({
    conversation_id,
    user_id,
  }: {
    user_id: string;
    conversation_id: number;
  }): Promise<{ sender: null | User; receiver: null | User; conversation: null | Conversations }> {
    const participants = await this.getParticipants(conversation_id);
    let sender = null;
    let receiver = null;
    let eligable = null;
    let conversation = null;
    for (const participant of participants) {
      if (participant.user.id === user_id) {
        eligable = true;
        sender = participant.user;
      } else {
        receiver = participant.user;
      }
      conversation = participant.conversation;
    }
    if (!eligable) {
      // throw new BadRequestException("You don't have access for this chat!")
      return { sender: null, receiver: null, conversation: null };
    }
    return { sender, receiver, conversation };
  }
  async findMyFriends(userId: string): Promise<User[]> {
    // Query for the conversations the user is part of
    const conversations = await this.participantRepo
      .createQueryBuilder("participant")
      .leftJoinAndSelect("participant.conversation", "conversation")
      .where("participant.user_id = :userId", { userId })
      .getMany();
    // console.log(conversations)
    if (!conversations || conversations.length === 0) {
      return [];
    }
    const userIdsInSameConversations = conversations.map((participant) => participant.conversation.id);
    const participantsInSameConversations = await this.participantRepo
      .createQueryBuilder("participant")
      .leftJoinAndSelect("participant.user", "user")
      .addSelect(["user.email", "user.first_name", "user.last_name", "user.id"])
      .where("participant.conversation_id IN (:...conversationIds)", {
        conversationIds: userIdsInSameConversations,
      })
      .andWhere("participant.user_id != :userId", { userId }) // Exclude the current user
      .getMany();
    const friends = participantsInSameConversations.map((participant) => participant.user);
    return friends;
  }
  async muteParticipant(conversationId: number, userId: string) {
    const participant = await this.participantRepo.findOneOrFail({
      where: { conversation: { id: conversationId }, user: { id: userId } },
    });
    participant.isMuted = true;
    return this.participantRepo.save(participant);
  }
}
