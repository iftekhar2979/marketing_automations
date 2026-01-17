import { ApiProperty } from "@nestjs/swagger";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("meta_buisness_profiles")
export class metaBuisnessProfiles {
  @ApiProperty({ example: 1, description: "Unique ID for the page session" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "pageId", description: "Page Id" })
  @Column({ type: "varchar" })
  page_id: string;

  // @ApiProperty({ example: "User Id", description: "User Id" })
  // @Column({ type: "varchar" })
  // user_id: string;

  @ApiProperty({ example: "Buisness Name", description: "Buisness Name" })
  @Column({ type: "varchar" })
  buisness_name: string;
  @ApiProperty({ example: "Buisness category", description: "Buisness Category" })
  @Column({ type: "varchar" })
  buisness_category: string;
  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at: Date;

  @DeleteDateColumn()
  @ApiProperty()
  deletedAt: Date;
}
