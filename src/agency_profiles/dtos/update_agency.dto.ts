// dto/update-agency-profile.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateAgencyProfileDto {
  @ApiPropertyOptional({ example: "Tech Agency Ltd" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  agency_name?: string;

  @ApiPropertyOptional({ example: "https://facebook.com/techagency" })
  @IsOptional()
  @IsString()
  facebook_page_link?: string;

  @ApiPropertyOptional({ example: "145456465456" })
  @IsOptional()
  @IsString()
  ein?: string;

  @ApiPropertyOptional({ example: "123 Main St, City" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: "We provide tech solutions" })
  @IsOptional()
  @IsString()
  description?: string;
}
