import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { Lead } from "src/leads_info/entities/lead.entity";
import { MetaBuisnessProfiles } from "src/page_session/entites/meta_buisness.entity";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserRoles } from "../enums/role.enum";
import { Verification } from "./verification.entity";

export enum USER_STATUS {
  VERIFIED = "verified",
  NOT_VERIFIED = "not_verified",
}
@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  @ApiProperty()
  id: string;

  @Column({ length: 50 })
  @ApiProperty()
  first_name: string;
  @Column({ length: 50 })
  @ApiProperty()
  last_name: string;
  @Column({ unique: true, length: 100 })
  @ApiProperty()
  email: string;
  @Column({ type: "varchar", nullable: true })
  @ApiProperty()
  image: string;
  @Column({ type: "varchar", nullable: true, default: USER_STATUS.NOT_VERIFIED })
  @ApiProperty()
  status?: USER_STATUS;
  @Column({ nullable: true, select: false }) // Critical: Never select by default
  @Exclude()
  password: string;

  @Column({ nullable: true, type: "varchar" })
  fcm: string;
  @Column({ nullable: true, type: "varchar" })
  phone: string;
  @Column({ nullable: true, select: false })
  @Exclude()
  current_refresh_token: string;

  @Column({
    type: "enum",
    enum: UserRoles,
    array: true,
    default: [UserRoles.AGENCY_OWNER],
  })
  roles: UserRoles[];

  @Column({ type: "boolean", default: false })
  @ApiProperty({ default: false })
  is_active: boolean;

  //Relationship

  @ManyToOne(() => MetaBuisnessProfiles, (profile) => profile.users, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "business_profile_id" })
  buisness_profiles: MetaBuisnessProfiles;

  //Relationship between user and leads
  @OneToMany(() => Lead, (lead) => lead.agency)
  leads: Lead[];

  //Relation ship between user and verification
  @OneToOne(() => Verification, (verification) => verification.user, {
    nullable: true,
    onDelete: "SET NULL",
  })
  verification: Verification;

  //date properties
  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiProperty()
  deletedAt: Date;
}
