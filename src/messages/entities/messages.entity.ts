import { ApiProperty } from "@nestjs/swagger";
import { MessageAttachment } from "src/attachment/entiies/attachments.entity";
import { Conversations } from "src/conversations/entities/conversations.entity";
import { User } from "src/user/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
export enum MessageDirection {
  OUTBOUND = "OUTBOUND", // user → lead
  INBOUND = "INBOUND", // lead → user
}
@Entity("messages")
@Index(["conversation_id", "created_at"])
export class Messages {
  @ApiProperty({ example: 1, description: "Unique ID for the message" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "uuid-of-user", description: "User ID of sender" })
  @Index()
  @Column({ type: "uuid" })
  sender_id: string;

  @Column({
    type: "enum",
    enum: MessageDirection,
  })
  direction: MessageDirection;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sender_id" })
  sender_user: User;

  @ApiProperty({ example: "1", description: "Converstaion Id" })
  @Column({ nullable: true, unique: false })
  conversation_id: number;

  // only set for inbound
  @Column({ type: "varchar", nullable: true })
  sender_phone?: string;
  @ApiProperty({ example: "Hello!", description: "Message text" })
  @Column({ type: "text", nullable: true })
  msg?: string;
  @ApiProperty({ example: "Text", description: "Text | Image | Offer" })
  @Column({ type: "text", nullable: true })
  type?: "text" | "offer" | "image" | "video";

  @ApiProperty({ description: "Conversation this message belongs to" })
  @ManyToOne(() => Conversations, (conversation) => conversation.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "conversation_id" })
  conversation: Conversations;

  @ApiProperty({ type: () => [MessageAttachment], description: "Message attachments" })
  @OneToMany(() => MessageAttachment, (attachment) => attachment.message, { cascade: true })
  attachments?: MessageAttachment[];

  @ApiProperty({ type: () => Boolean, description: "Message Seen", example: "true" })
  @Column()
  @Index()
  isRead: boolean;

  @CreateDateColumn({ type: "timestamp with time zone" })
  @Index()
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at: Date;
}
