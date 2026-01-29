import { ApiProperty } from "@nestjs/swagger";
import { Lead } from "src/leads_info/entities/lead.entity";
import { MetaBuisnessProfiles } from "src/page_session/entites/meta_buisness.entity";
import { User } from "src/user/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("agency_profiles")
@Index(["page_id"])
@Index(["agency_owner_id"])
export class AgencyProfile {
  @PrimaryGeneratedColumn("uuid")
  @ApiProperty({ description: "Unique ID for the agency profile" })
  id: string;

  @Column({ type: "varchar", nullable: true })
  @ApiProperty({ example: "page_123", description: "Business Profile Page ID (Foreign Key)" })
  page_id: string;

  @Column({ type: "uuid" })
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Agency Owner User ID (Foreign Key)",
  })
  agency_owner_id: string;

  @Column({ type: "varchar", length: 255 })
  @ApiProperty({ example: "Tech Agency", description: "Agency Name" })
  agency_name: string;

  @Column({ type: "text", nullable: true })
  @ApiProperty({ example: "We provide tech solutions", description: "Agency Description" })
  description: string;

  @Column({ type: "varchar", nullable: true })
  @ApiProperty({ example: "https://example.com", description: "Agency Website URL" })
  website: string;

  @Column({ type: "varchar", nullable: true })
  @ApiProperty({ example: "john@agency.com", description: "Agency Contact Email" })
  contact_email: string;

  @Column({ type: "varchar", nullable: true })
  @ApiProperty({ example: "john@agency.com", description: "Agency Contact Email" })
  facebook_page_link: string;
  @Column({ type: "varchar", nullable: true })
  @ApiProperty({ example: "145456465456", description: "EIN" })
  ein: string;

  @Column({ type: "varchar", nullable: true })
  @ApiProperty({ example: "145456465456", description: "National Identity Number" })
  nid_no: string;

  @Column({ type: "varchar", nullable: true })
  @ApiProperty({ example: "145456465456", description: "National Id front picture" })
  nid_front: string;

  @Column({ type: "varchar", nullable: true })
  @ApiProperty({ example: "145456465456", description: "National Id back picture" })
  nid_back: string;

  @Column({ type: "varchar", nullable: true })
  @ApiProperty({ example: "145456465456", description: "Tax Id No" })
  tax_no: string;

  @Column({ type: "varchar", nullable: true })
  @ApiProperty({ example: "tax-font.jpg", description: "Image" })
  tax_id_front: string;

  @Column({ type: "varchar", nullable: true })
  @ApiProperty({ example: "tax-back.jpg", description: "Image" })
  tax_id_back: string;

  @Column({ type: "varchar", nullable: true })
  @ApiProperty({ example: "+1234567890", description: "Agency Contact Phone" })
  contact_phone: string;

  @Column({ type: "varchar", nullable: true })
  @ApiProperty({ example: "https://logo.png", description: "Agency Logo URL" })
  logo: string;

  @Column({ type: "varchar", nullable: true })
  @ApiProperty({ example: "123 Main St, City", description: "Agency Address" })
  address: string;

  @Column({ type: "varchar", nullable: true })
  @ApiProperty({ example: "Active", description: "Agency Status" })
  status: string;

  @Column({ type: "boolean", default: true })
  @ApiProperty({ example: true, description: "Is Agency Active" })
  is_active: boolean;

  // ============ RELATIONS ============
  // One-to-One: Many Agency Profiles belong to one Business Profile
  @OneToOne(() => MetaBuisnessProfiles, (profile) => profile.agency_profile, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "business_profile_id" })
  buisness_profile: MetaBuisnessProfiles;
  // One-to-One: Many Agency Profiles belong to one Agency Owner (User)
  @ManyToOne(() => User, (user) => user.agency_profiles, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "agency_owner_id" })
  agency_owner: User;

  @OneToMany(() => Lead, (lead) => lead.agency)
  leads: Lead[];
  // One-to-one: One Business Profile has one Agency Profiles

  // ============ TIMESTAMPS ============

  @CreateDateColumn({ type: "timestamp with time zone" })
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  @ApiProperty()
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiProperty()
  deletedAt: Date;
}
