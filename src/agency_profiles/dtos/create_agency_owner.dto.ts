import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateAgencyOwnerDto {
  @ApiProperty({ example: "John", description: "First name" })
  @IsString()
  @MinLength(2)
  @MaxLength(26)
  first_name: string;

  @ApiProperty({ example: "Doe", description: "Last name" })
  @IsString()
  @MinLength(2)
  @MaxLength(26)
  last_name: string;

  @ApiProperty({ example: "john@example.com", description: "Email address" })
  @IsEmail()
  @MinLength(8)
  @MaxLength(50)
  email: string;

  @ApiProperty({ example: "SecurePassword123!", description: "Password" })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: "+1234567890",
    description: "Phone number",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    example: "page_123",
    description: "Business Profile Page ID",
  })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  page_id?: string;
}
