import { Conversations } from "src/conversations/entities/conversations.entity";
import { Lead } from "src/leads_info/entities/lead.entity";
import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("conversation_participants")
export class ConversationParticipant {
  @PrimaryGeneratedColumn()
  id: number;
  // the system user (agent)
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  // the external person
  @ManyToOne(() => Lead, { onDelete: "CASCADE" })
  @JoinColumn({ name: "lead_id" })
  lead: Lead;
  @ManyToOne(() => Conversations, { onDelete: "CASCADE" })
  conversation: Conversations;
  @Column({ type: "varchar", length: 20 })
  lead_phone: string; // denormalized for fast routing
  @Column({ type: "boolean", default: false })
  isMuted: boolean;

  @CreateDateColumn({ type: "timestamp with time zone" })
  joined_at: Date;
}
