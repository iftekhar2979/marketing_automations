import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserRoles } from "../enums/role.enum";

export enum USERSTATUS {
  VERIFIED = "verified",
  NOT_VERIFIED = "not_verified",
}
/**
 * It describes the schema for user table in database.
 */
@Entity({ name: "users" })
export class User {
  /**
   * auto-generated unique uuid primary key for the table.
   */
  @PrimaryGeneratedColumn("uuid")
  @ApiProperty()
  id: string;

  @Column({ length: 50 })
  @ApiProperty()
  firstName: string;
  @Column({ length: 50 })
  @ApiProperty()
  lastName: string;
  @Column({ unique: true, length: 100 })
  @ApiProperty()
  email: string;
  @Column({ type: "varchar", nullable: true })
  @ApiProperty()
  image: string;
  @Column({ type: "varchar", nullable: true, default: "not_verified" })
  @ApiProperty()
  status: USERSTATUS.NOT_VERIFIED;
  @Column({ nullable: true })
  @Column({ nullable: true, select: false }) // Critical: Never select by default
  @Exclude()
  password: string;

  @Column({ nullable: true, type: "varchar" })
  fcm: string;
  @Column({ nullable: true, type: "varchar" })
  phone: string;
  @Column({ nullable: true, type: "varchar" })
  current_refresh_token: string;

  @Column("enum", { array: true, enum: UserRoles, default: `{${UserRoles.USER}}` })
  @ApiProperty({
    enum: UserRoles,
    default: [UserRoles.USER],
    description: `String array, containing enum values, either ${UserRoles.USER} or ${UserRoles.ADMIN}`,
  })
  roles: UserRoles[];

  @Column({ type: "boolean", default: false })
  @ApiProperty({ default: false })
  isActive: boolean;

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
