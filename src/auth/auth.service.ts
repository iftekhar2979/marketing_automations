import { InjectQueue } from "@nestjs/bull";
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Queue } from "bull";
import { Request } from "express";
import { OtpType } from "src/otp/entities/otp.entity";
import { OtpService } from "src/otp/otp.service";
import { AccountStatus, CreateVerificationDto } from "src/user/dto/verification-dto";
import { Verification } from "src/user/entities/verification.entity";
import { DataSource, Repository } from "typeorm";
import { MailService } from "../mail/mail.service";
import { InjectLogger } from "../shared/decorators/logger.decorator";
import { User } from "../user/entities/user.entity";
import { argon2hash, argon2verify } from "../utils/hashes/argon2";
import { CreateUserDto } from "./dto/create-user.dto";
import { JwtPayload } from "./dto/jwt-payload.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { OtpVerificationDto } from "./dto/otp-verification.dto";
import { ResetPasswordDto, UpdatePassword } from "./dto/reset-password.dto";
import { UpdateMyPasswordDto } from "./dto/update-password.dto";

@Injectable()
export class AuthService {
  private _FR_HOST: string;
  /**
   * Constructor of `AuthService` class
   * @param userRepository
   * @param jwtService imported from "@nestjs/jwt"
   * @param mailService
   * @param configService
   */
  constructor(
    @InjectRepository(User) private _userRepository: Repository<User>,
    @InjectRepository(Verification) private _verificationRepository: Repository<Verification>,
    private readonly _otpService: OtpService,
    private readonly _jwtService: JwtService,
    private readonly _mailService: MailService,
    private readonly _configService: ConfigService,
    @InjectLogger() private readonly _logger: Logger,
    private readonly _dataSource: DataSource,

    @InjectQueue("notifications") private readonly _queue: Queue
  ) {
    this._FR_HOST = _configService.get<string>(`FR_BASE_URL`);
  }
  async signup(createUserDto: CreateUserDto, req: Request) {
    const queryRunner = this._dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { password, email, ...rest } = createUserDto;

      // 1. Check if user exists before hashing (performance optimization)
      const existingUser = await queryRunner.manager.findOne(User, { where: { email } });
      if (existingUser) throw new ConflictException("Email already registered");

      // 2. Hash password with argon2
      const hashedPassword = await argon2hash(password);

      // 3. Create User Instance
      const userInstance = queryRunner.manager.create(User, {
        ...rest,
        email,
        password: hashedPassword,
      });
      const savedUser = await queryRunner.manager.save(userInstance);

      // 4. Create Verification Record
      await queryRunner.manager.insert("verifications", {
        user_id: savedUser.id,
        status: AccountStatus.INACTIVE,
      });

      // 5. Finalize Transaction
      await queryRunner.commitTransaction();
      // 6. Generate OTP

      const otp = await this._otpService.createOtp(savedUser.id, OtpType.REGISTRATION);
      // 7. Post-Transaction: Communication (Email/SMS)
      // We do this outside the transaction so if email fails, user stays created
      const token = await this.signTokenSendEmailAndSMS(savedUser, req, otp.otp);

      return {
        status: "success",
        data: savedUser,
        token,
      };
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
      this.handleDatabaseError(err);
    } finally {
      await queryRunner.release();
    }
  }
  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await argon2hash(refreshToken);
    await this._userRepository.update(userId, {
      current_refresh_token: hashedRefreshToken,
    });
  }
  private async generateTokens(user: User) {
    const payload = { id: user.id, email: user.email, roles: user.roles };

    const [accessToken, refreshToken] = await Promise.all([
      this._jwtService.signAsync(payload, {
        secret: this._configService.get("JWT_ACCESS_SECRET"),
        expiresIn: this._configService.get("AT_EXP_IN"),
      }),
      this._jwtService.signAsync(payload, {
        secret: this._configService.get("JWT_REFRESH_SECRET"),
        expiresIn: this._configService.get("RT_EXP_IN"),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private handleDatabaseError(err: any) {
    if (err instanceof HttpException) throw err;

    // Postgres Unique Violation code
    if (err.code === "23505") {
      throw new ConflictException("Identity already exists");
    }

    throw new InternalServerErrorException("An unexpected error occurred during registration");
  }

  async verfication(verificationDto: CreateVerificationDto): Promise<Verification> {
    const { user_id, is_email_verified, is_admin_verified, is_suspended, is_deleted, status } =
      verificationDto;

    this._logger.log("Creating Verification", AuthService.name);
    const verification = this._verificationRepository.create({
      user_id,
      is_email_verified,
      is_admin_verified,
      is_suspended,
      is_deleted,
      status,
    });

    return await this._verificationRepository.save(verification);
  }
  async OtpVerify(otpDto: OtpVerificationDto, userInfo: User) {
    const { otp, verification_type } = otpDto;
    this._logger.log("Creating Verification", AuthService.name);
    const verification = await this._otpService.findOtpByUserId(userInfo.id);
    if (!verification) {
      throw new NotFoundException("OTP not found or expired");
    }
    if (verification.attempts >= 3) {
      await this._otpService.removeOtpByUserId(userInfo.id);
      throw new BadRequestException("Too many attempts, please request a new OTP");
    }
    if (verification.otp !== otp) {
      await this._otpService.updateOtpAttempts(userInfo.id, verification.attempts + 1);
      throw new BadRequestException("Invalid OTP");
    }
    // if (verification.type !== verification_type) {
    //   throw new BadRequestException("Wrong Verification Request");
    // }
    if (!verification || (await verification).expiresAt < new Date()) {
      throw new NotFoundException("OTP expired");
    }
    const verifications = await this._verificationRepository.findOne({ where: { user_id: userInfo.id } });
    if (verification.type === OtpType.FORGOT_PASSWORD) {
      const user = (await this._userRepository.findOne({ where: { id: userInfo.id } })) as any;
      if (!user) {
        throw new NotFoundException("User not found");
      }
      user.verification_type = OtpType.FORGOT_PASSWORD;
      const token = this._jwtService.sign({ id: user.id, verification_type: OtpType.FORGOT_PASSWORD });
      verifications.is_email_verified = true;
      verifications.status = AccountStatus.ACTIVE;
      await this._verificationRepository.save(verifications);
      return { message: "OTP verified successfully", data: {}, token };
    }
    if (!verifications) {
      throw new NotFoundException("Verification not found");
    }
    verifications.is_email_verified = true;
    verifications.status = AccountStatus.ACTIVE;
    await this._verificationRepository.save(verifications);
    return { message: "OTP verified successfully", data: {}, status: "success" };
  }
  async resetPassword(resetPasswordDto: ResetPasswordDto, user) {
    const { password, passwordConfirm } = resetPasswordDto;
    if (password !== passwordConfirm) {
      throw new BadRequestException("Password does not match with passwordConfirm");
    }
    this._logger.log("Masking Password", AuthService.name);
    console.log(user);
    const userinfo = await this._userRepository.findOne({ where: { id: user.id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.verification_type !== OtpType.FORGOT_PASSWORD) {
      throw new BadRequestException("Invalid verification type for password reset");
    }
    const isPassMatched = await argon2verify(userinfo.password, password);
    if (isPassMatched) {
      throw new BadRequestException("New password cannot be the same as the old password");
    }
    this._logger.log("Hashing Password", AuthService.name);
    0;
    const hashedPassword = await argon2hash(password);
    userinfo.password = hashedPassword;
    this._logger.log("Saving Updated User", AuthService.name);
    await this._userRepository.save(userinfo);
    if (user.fcm) {
      await this._queue.add("push_notification", {
        token: user?.fcm,
        title: "Password Reset Successful",
        body: "Your password has been reset successfully",
      });
    }
    return { message: "Password reset successfully", status: "success", data: null };
  }
  async updatePassword(resetPasswordDto: UpdatePassword, user) {
    const { passwordCurrent, password, passwordConfirm } = resetPasswordDto;
    if (password !== passwordConfirm) {
      throw new BadRequestException("Password does not match with passwordConfirm");
    }
    this._logger.log("Masking Password", AuthService.name);

    const userinfo = await this._userRepository.findOne({ where: { id: user.id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const isPassMatched = await argon2verify(userinfo.password, passwordCurrent);
    if (!isPassMatched) {
      throw new BadRequestException("Wrong Password!");
    }
    this._logger.log("Hashing Password", AuthService.name);
    0;
    const hashedPassword = await argon2hash(password);
    userinfo.password = hashedPassword;
    this._logger.log("Saving Updated User", AuthService.name);
    await this._userRepository.save(userinfo);
    this._mailService.sendPasswordUpdateEmail(userinfo);
    return { message: "Password updated successfully", status: "success", data: null };
  }
  async loginPassport(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    this._logger.log("Searching User with provided email", AuthService.name);
    const user = await this._userRepository.findOne({ where: { email } });
    // console.log(user);
    this._logger.log("Verifying User", AuthService.name);
    if (user && (await argon2verify(user.password, password))) {
      const verification = await this._verificationRepository.findOne({ where: { user_id: user.id } });
      if (!verification?.is_email_verified) {
        await this._otpService.createOtp(user.id, OtpType.REGISTRATION);
        const token = this._jwtService.sign({ id: user.id, verification_type: OtpType.REGISTRATION });
        return token;
        // throw new NotAcceptableException("Please verify your email to login"
      }
      this._logger.log("User Verified", AuthService.name);
      return user;
    }

    return null;
  }

  async appleLogin(token: string) {
    if (!token) throw new BadRequestException("Token Not Found");

    const { sub: userId, email, auth_time: loginTime } = this._jwtService.decode(token);
    return {
      user: { userId, email, loginTime },
      token,
    };
  }

  async updateMyPassword(updateMyPassword: UpdateMyPasswordDto, user: User) {
    const { passwordCurrent, password, passwordConfirm } = updateMyPassword;
    console.log(passwordCurrent, password);
    this._logger.log("Verifying current password from user", AuthService.name);
    if (!(await argon2verify(user.password, passwordCurrent))) {
      throw new UnauthorizedException("Invalid password");
    }
    if (password === passwordCurrent) {
      throw new BadRequestException("New password and old password can not be same");
    }
    if (password !== passwordConfirm) {
      throw new BadRequestException("Password does not match with passwordConfirm");
    }
    this._logger.log("Masking Password", AuthService.name);
    const hashedPassword = await argon2hash(password);
    user.password = hashedPassword;
    this._logger.log("Saving Updated User", AuthService.name);
    await this._userRepository.save(user);
    this._logger.log("Sending password update mail", AuthService.name);
    this._mailService.sendPasswordUpdateEmail(user);

    this._logger.log("Login the user and send the token again", AuthService.name);
    const token: string = await this._jwtService.sign(user);

    return { user, token };
  }

  async deleteMyAccount(): Promise<boolean> {
    throw new BadRequestException("Method not implemented.");
  }
  async userNotAccepted({ existingToken }: { existingToken: string }) {
    const payload = await this._jwtService.verify(existingToken);
    const token = await this._jwtService.sign({ id: payload.id, verification_type: OtpType.REGISTRATION });
    const userinfo = await this._userRepository.findOne({ where: { id: payload.id } });

    const otp = await this._otpService.createOtp(payload.id, OtpType.REGISTRATION);
    await this._mailService.sendUserConfirmationMail(userinfo, `${otp.otp}`);
    return token;
  }

  async login(loginDto: LoginUserDto) {
    const { email, password, fcm } = loginDto;

    // 1. Fetch user with password and refresh token explicitly selected
    // Since we set 'select: false' in the entity for security
    console.log(email);
    const user = await this._userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .addSelect("user.current_refresh_token")
      .where("user.email = :email", { email })
      .getOne();
    if (!user) {
      // Use a generic message to prevent user enumeration attacks
      throw new UnauthorizedException("Invalid credentials");
    }

    // 2. Verify Password
    const isPasswordValid = await argon2verify(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // 3. Generate Token Pair
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // 4. Hash and Update Refresh Token (Rotation)
    // This ensures that even if the DB is stolen, active sessions are safe
    const hashedRT = await argon2hash(refreshToken);
    await this._userRepository.update(user.id, {
      current_refresh_token: hashedRT,
    });

    if (fcm) {
      user.fcm = fcm;
      await this._userRepository.update(user.id, { fcm });
    }
    // 5. Return OpenAI Standard Response
    return {
      status: "success",
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles,
        isActive: user.isActive,
        status: user.status,
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken, // Plain text for the client to store
      },
    };
  }
  async signToken(user: any): Promise<string> {
    // console.log(user)
    const payload: JwtPayload = { id: user.id };
    // console.log(payload)

    // console.log(userInfo)

    this._logger.log("Signing token", AuthService.name);
    if (!user.firstName) {
      // console.log(payload)
      const payload = { id: user.id, verification_type: "registration" };

      return this._jwtService.sign(payload);
    }
    return this._jwtService.sign(payload);
  }
  async userInfo(user: User) {
    return await this._userRepository.findOne({
      where: { id: user.id },
      select: { password: false },
      relations: ["addressDetails"],
    });
  }

  async signTokenSendEmailAndSMS(user: User, req: Request, verificationCode: string) {
    const token: string = await this.signToken(user);

    this._logger.log("Sending welcome email", AuthService.name);
    this._mailService.sendUserConfirmationMail(user, verificationCode);

    // TODO: Send confirmation SMS to new user using Twilio

    return token;
  }
  async resendOtp({ user, otpType, userInfo }: { userInfo?: any; user?: any; otpType?: OtpType }) {
    console.log(user.status);
    if (!user.verification_type || otpType !== OtpType.REGISTRATION) {
      const otp = await this._otpService.createOtp(user.id, OtpType.FORGOT_PASSWORD);
      await this._queue.add("mail_notification", { user, otp: otp.otp });
      return { message: "OTP resent successfully", status: "success", data: null };
    }

    this._logger.log(`Resending OTP to user with ID: ${user.id}`, AuthService.name);
    const existingOtp = await this._otpService.findOtpByUserId(user.id);
    // console.log("Existing Otp",existingOtp.createdAt.getTime()+ 1 * 60 * 1000,Date.now())
    if (existingOtp?.createdAt) {
      const otpCreatedAt = existingOtp.createdAt.getTime();
      const timeDifference = Date.now() - otpCreatedAt;
      if (timeDifference < 2 * 1000 * 60) {
        throw new BadRequestException("You can only request a new OTP after 2 minute.");
      }

      await this._otpService.removeOtpByUserId(user.id);
    }

    const otp = await this._otpService.createOtp(user.id, OtpType.FORGOT_PASSWORD);
    await this._mailService.sendForgotPasswordMail(user.email, `${otp.otp}`);
    return { message: "OTP resent successfully", status: "success", data: null };
  }

  async forgetPassword(req: Request, email: string) {
    const user = (await this._userRepository.findOne({ where: { email } })) as any;
    user.verification_type = OtpType.FORGOT_PASSWORD;
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const token = await this._jwtService.sign({ id: user.id, verification_type: OtpType.FORGOT_PASSWORD });
    await this.resendOtp({ user });
    return { message: "Forgot password email sent successfully", status: "success", data: null, token };
  }

  async sendOtp(req: Request) {
    const user = req.user as User;
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const existingOtp = await this._otpService.findOtpByUserId(user.id);
    if (existingOtp) {
      // If an OTP already exists, you might want to delete it before generating a new one
      await this._otpService.removeOtpByUserId(user.id); // Ensure to remove the existing OTP
    }
    await this._otpService.createOtp(user.id, OtpType.REGISTRATION);
    return { message: "OTP resent successfully", status: "success", data: null };
  }
  async uploadImage({ imageUrl, user }: { imageUrl: string; user: User }) {
    const updateUser = await this._userRepository.update(user.id, { image: imageUrl });
    if (!updateUser) {
      throw new NotFoundException("User not found");
    }
    return { message: "Image uploaded successfully", status: "success", data: null };
  }
}
