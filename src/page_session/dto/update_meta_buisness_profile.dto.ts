// dto/update-meta-business-profile.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { CreateMetaBusinessProfileDto } from "./create_meta_buisness_profile.dto";

export class UpdateMetaBusinessProfileDto extends PartialType(CreateMetaBusinessProfileDto) {
  @ApiProperty({
    example: "123456789",
    description: "Meta page ID",
    required: false,
  })
  @IsString()
  @IsOptional()
  page_id?: string;

  @ApiProperty({
    example: "user-123",
    description: "User ID",
    required: false,
  })
  @IsString()
  @IsOptional()
  user_id?: string;

  @ApiProperty({
    example: "Updated Business Name",
    description: "Business name",
    required: false,
  })
  @IsString()
  @IsOptional()
  buisness_name?: string;
}
