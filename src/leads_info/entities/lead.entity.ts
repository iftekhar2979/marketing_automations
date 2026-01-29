import { AgencyProfile } from "src/agency_profiles/entities/agency_profiles.entity";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { LeadStatus } from "../enums/lead_status.enum";

@Entity({ name: "leads" })
@Index(["status", "is_used"]) // composite index
export class Lead {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "meta_lead_id", type: "varchar", nullable: true })
  @Index()
  meta_lead_id: string;
  @Column({ name: "agency_id", type: "uuid", nullable: true })
  agency_id: string;

  @ManyToOne(() => AgencyProfile, (agency) => agency.leads, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "agency_id" })
  agency: AgencyProfile;

  @Column({ name: "contructor_id", type: "uuid", nullable: true })
  @Index()
  contructor_id: string;

  @Column({
    type: "enum",
    enum: LeadStatus,
    default: LeadStatus.NEW,
  })
  status: LeadStatus;

  @Column({ type: "varchar", length: 255, nullable: true })
  name: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  phone: string;

  @Column({ type: "varchar", nullable: true })
  address: string;

  @Column({ name: "form_id", type: "varchar", nullable: true })
  form_id: string;

  @Column({ name: "form_info", type: "json", nullable: true })
  form_info: any; // store JSON payload from webhook

  @Column({
    name: "start_time_preference",
    type: "text",
    nullable: true,
  })
  start_time_pref: string;

  @Column({ name: "is_used", type: "boolean", default: false })
  is_used: boolean;

  //date columns
  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  created_at: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp" })
  deleted_at: Date;
}
