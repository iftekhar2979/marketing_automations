import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateMetaBusinessProfileDto {
  @ApiProperty({
    example: "123456789",
    description: "Meta page ID",
  })
  @IsString()
  @IsNotEmpty()
  page_id: string;

  @ApiProperty({
    example: "user-123",
    description: "User ID",
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    example: "My Business Name",
    description: "Business name (optional, will fetch from Meta if not provided)",
    required: false,
  })
  @IsString()
  @IsOptional()
  buisness_name?: string;
}
