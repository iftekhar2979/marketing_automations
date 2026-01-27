import { ApiProperty } from "@nestjs/swagger";
import { Messages } from "src/messages/entities/messages.entity";
import { ConversationParticipant } from "src/participants/entities/participants.entity";
import { User } from "src/user/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
@Index(["updated_at"])
@Index(["lead_phone", "updated_at"])
@Entity("conversations")
export class Conversations {
  @ApiProperty({ example: 1, description: "Unique ID for the conversation" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: "Last Message" })
  @Index()
  @OneToOne(() => Messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "lastmsg" })
  lastmsg: Messages;

  @ApiProperty({ type: () => [Messages], description: "Messages in the conversation" })
  @OneToMany(() => Messages, (message) => message.conversation, { cascade: true })
  messages: Messages[];

  @ApiProperty({ type: () => [User], description: "Users participating in the conversation" })
  @OneToMany(() => ConversationParticipant, (p) => p.conversation)
  participants: ConversationParticipant[];

  @Index()
  @Column({ type: "varchar", length: 20 })
  lead_phone: string; // denormalized for fast routing

  @ApiProperty({ description: "Conversation creation timestamp" })
  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at: Date;

  @ApiProperty({ description: "Conversation update timestamp" })
  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at: Date;
}
