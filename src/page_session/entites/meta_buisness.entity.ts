import { ApiProperty } from "@nestjs/swagger";
import { AgencyProfile } from "src/agency_profiles/entities/agency_profiles.entity";
import { User } from "src/user/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("buisness_profiles")
export class MetaBuisnessProfiles {
  @ApiProperty({ example: 1, description: "Unique ID for the page session" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "page_id", description: "Page Id" })
  @Index()
  @Column({ type: "varchar" })
  page_id: string;

  @ApiProperty({ example: "Buisness Name", description: "Buisness Name" })
  @Column({ type: "varchar" })
  buisness_name: string;
  @ApiProperty({ example: "Buisness category", description: "Buisness Category" })
  @Column({ type: "varchar" })
  buisness_category: string;
  // ============ RELATIONS ============

  // agency profile and buisness profile relation
  @OneToOne(() => AgencyProfile, (agency) => agency.buisness_profile)
  agency_profile: AgencyProfile;
  //user with buisness profile
  @OneToMany(() => User, (user) => user.buisness_profiles)
  users: User;

  // ============ TIMESTAMPS ============
  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at: Date;

  @DeleteDateColumn()
  @ApiProperty()
  deletedAt: Date;
}
