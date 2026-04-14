import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  OperationResult,
  LoginResultViewModel,
  RegisterResultViewModel,
  ForgotResultViewModel,
  ProfileViewModel,
  MemberInfoViewModel,
  DeviceViewModel,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  ChangePasswordDto,
  ChangeEmailDto,
  ChangePhoneDto,
  ConfirmDto,
  UpdateProfileDto,
  ActivityType,
  type ForgotDto,
  type CaptchaPayload,
} from '@asoode/shared';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { IStorageService, STORAGE_SERVICE } from '../../common/storage';
import { QueuePublisherService } from '../../common/services/queue-publisher.service';
import { validateCaptcha, generateChallengePrefix } from '../../common/utils/captcha';

const BCRYPT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const OTP_RATE_LIMIT_HOUR = 5;
const CAPTCHA_DIFFICULTY = 4;
const CAPTCHA_EXPIRY_MINUTES = 5;

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
    private readonly queue: QueuePublisherService,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────

  private generateToken(userId: string, username: string): string {
    const secret = this.config.getOrThrow<string>('jwt.secret');
    const expiresIn = this.config.getOrThrow<string>('jwt.expiresIn');
    return jwt.sign({ userId, username }, secret, { expiresIn } as jwt.SignOptions);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async createVerificationToken(userId: string, type: number): Promise<string> {
    // Rate limit: max OTP_RATE_LIMIT_HOUR per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await this.prisma.verificationToken.count({
      where: { userId, type, createdAt: { gte: oneHourAgo } },
    });

    if (recentCount >= OTP_RATE_LIMIT_HOUR) {
      throw new Error('OTP_RATE_LIMIT');
    }

    // Invalidate previous unused tokens of same type
    await this.prisma.verificationToken.updateMany({
      where: { userId, type, used: false },
      data: { used: true },
    });

    const code = this.generateOtp();
    await this.prisma.verificationToken.create({
      data: {
        userId,
        code,
        type,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    return code;
  }

  private async validateOtp(userId: string, code: string, type: number): Promise<boolean> {
    const token = await this.prisma.verificationToken.findFirst({
      where: {
        userId,
        code,
        type,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!token) return false;

    await this.prisma.verificationToken.update({
      where: { id: token.id },
      data: { used: true },
    });

    return true;
  }

  private async validateCaptchaPayload(captcha?: CaptchaPayload): Promise<{ valid: boolean; reason?: string }> {
    // If no captcha payload, allow through (graceful degradation)
    if (!captcha) {
      return { valid: true };
    }

    // Verify the challenge exists and hasn't been used
    let expectedPrefix: string | null = null;
    if (captcha.powPrefix) {
      try {
        const challenge = await this.prisma.captchaChallenge.findFirst({
          where: {
            prefix: captcha.powPrefix,
            used: false,
            expiresAt: { gt: new Date() },
          },
        });

        if (challenge) {
          expectedPrefix = challenge.prefix;
          await this.prisma.captchaChallenge.update({
            where: { id: challenge.id },
            data: { used: true },
          });
        }
        // If challenge not found, skip PoW validation (graceful degradation)
      } catch {
        // DB error — skip PoW validation rather than blocking the user
        this.logger.warn('Captcha challenge lookup failed, skipping PoW validation');
      }
    }

    return validateCaptcha(captcha, expectedPrefix, CAPTCHA_DIFFICULTY);
  }

  private toMemberInfo(user: {
    id: string;
    email: string;
    avatar: string | null;
    firstName: string;
    lastName: string;
    username: string;
    bio: string;
  }): MemberInfoViewModel {
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    const initials = [user.firstName?.[0], user.lastName?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase();
    return {
      id: user.id,
      email: user.email,
      avatar: user.avatar ?? '',
      firstName: user.firstName,
      lastName: user.lastName,
      fullName,
      initials,
      username: user.username,
      bio: user.bio,
    };
  }

  private toProfile(user: {
    id: string;
    email: string;
    avatar: string | null;
    firstName: string;
    lastName: string;
    username: string;
    bio: string;
    darkMode: boolean;
    timeZone: string;
    calendar: number;
    phone: string | null;
    emailConfirmed: boolean;
    phoneConfirmed: boolean;
    userType: number;
    workingGroupId: string | null;
    workingProjectId: string | null;
    workingPackageId: string | null;
    workingTaskId: string | null;
    workingGroupFrom: Date | null;
    workingTaskFrom: Date | null;
  }): ProfileViewModel {
    const base = this.toMemberInfo(user);
    return {
      ...base,
      darkMode: user.darkMode,
      timeZone: user.timeZone,
      calendar: user.calendar,
      phone: user.phone ?? '',
      emailConfirmed: user.emailConfirmed,
      phoneConfirmed: user.phoneConfirmed,
      userType: user.userType,
      workingGroupId: user.workingGroupId ?? undefined,
      workingProjectId: user.workingProjectId ?? undefined,
      workingPackageId: user.workingPackageId ?? undefined,
      workingTaskId: user.workingTaskId ?? undefined,
      workingGroupFrom: user.workingGroupFrom ?? undefined,
      workingTaskFrom: user.workingTaskFrom ?? undefined,
    };
  }

  private emptyLoginResult(): LoginResultViewModel {
    return {
      token: '',
      userId: '',
      username: '',
      id: '',
      emailNotConfirmed: false,
      invalidPassword: false,
      lockedOut: false,
      notFound: false,
      phoneNotConfirmed: false,
      smsFailed: false,
    };
  }

  private async logActivity(userId: string, type: ActivityType, entityId: string, entityType: string): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: { userId, type, entityId, entityType, description: '' },
      });
    } catch (err) {
      this.logger.warn(`Failed to log activity: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ─── Captcha Challenge ────────────────────────────────────────

  async generateCaptchaChallenge(): Promise<{ prefix: string; difficulty: number; expiresAt: string }> {
    const prefix = generateChallengePrefix();
    const expiresAt = new Date(Date.now() + CAPTCHA_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.captchaChallenge.create({
      data: { prefix, difficulty: CAPTCHA_DIFFICULTY, expiresAt },
    });

    return { prefix, difficulty: CAPTCHA_DIFFICULTY, expiresAt: expiresAt.toISOString() };
  }

  // ─── Login ──────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<LoginResultViewModel | OperationResult<LoginResultViewModel>> {
    // Validate captcha
    const captchaResult = await this.validateCaptchaPayload(dto.captcha);
    if (!captchaResult.valid) {
      this.logger.warn(`Login captcha failed: ${captchaResult.reason}`);
      return OperationResult.Rejected<LoginResultViewModel>();
    }

    const result = this.emptyLoginResult();
    const identifier = dto.username?.trim().toLowerCase();

    if (!identifier || !dto.password) {
      return OperationResult.Validation<LoginResultViewModel>();
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      result.notFound = true;
      return result;
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      result.invalidPassword = true;
      return result;
    }

    if (!user.emailConfirmed) {
      result.emailNotConfirmed = true;
      result.id = user.id;

      // Generate and send OTP for email verification
      try {
        const code = await this.createVerificationToken(user.id, 1);
        this.queue.emitEmail({
          to: user.email,
          template: 'verify-email',
          culture: this.config.get<string>('server.language') || 'en',
          data: { code, firstName: user.firstName },
        });
      } catch {
        this.logger.warn(`OTP rate limit for user: ${user.id}`);
      }

      return result;
    }

    result.token = this.generateToken(user.id, user.username);
    result.userId = user.id;
    result.username = user.username;
    result.id = user.id;

    await this.logActivity(user.id, ActivityType.AccountLogin, user.id, 'account');

    return result;
  }

  // ─── Register ───────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<RegisterResultViewModel | OperationResult<RegisterResultViewModel>> {
    // Validate captcha
    const captchaResult = await this.validateCaptchaPayload(dto.captcha);
    if (!captchaResult.valid) {
      this.logger.warn(`Register captcha failed: ${captchaResult.reason}`);
      return OperationResult.Rejected<RegisterResultViewModel>();
    }

    const result: RegisterResultViewModel = {
      duplicate: false,
      emailFailed: false,
      emailNotConfirmed: false,
      phoneNotConfirmed: false,
      smsFailed: false,
      id: '',
    };

    const username = dto.username?.trim().toLowerCase();
    if (!username || !dto.password || !dto.firstName?.trim()) {
      return OperationResult.Validation<RegisterResultViewModel>();
    }

    if (dto.password !== dto.confirmPassword) {
      return OperationResult.Validation<RegisterResultViewModel>();
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: username },
          { username },
        ],
      },
    });

    if (existing) {
      result.duplicate = true;
      return result;
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: username,
        username,
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName?.trim() ?? '',
        emailConfirmed: false,
      },
    });

    result.id = user.id;
    result.emailNotConfirmed = true;

    // Generate OTP and send verification email
    try {
      const code = await this.createVerificationToken(user.id, 1);
      this.queue.emitEmail({
        to: user.email,
        template: 'verify-email',
        culture: this.config.get<string>('server.language') || 'en',
        data: { code, firstName: user.firstName },
      });
      // Also send welcome email
      this.queue.emitEmail({
        to: user.email,
        template: 'welcome',
        culture: this.config.get<string>('server.language') || 'en',
        data: { firstName: user.firstName },
      });
    } catch {
      this.logger.warn(`Failed to send verification email for user: ${user.id}`);
      result.emailFailed = true;
    }

    this.logger.log(`User registered: ${user.username} (${user.id})`);

    await this.logActivity(user.id, ActivityType.AccountRegister, user.id, 'account');

    return result;
  }

  // ─── Confirm (email verification) ──────────────────────────

  async confirm(dto: ConfirmDto): Promise<LoginResultViewModel | OperationResult<LoginResultViewModel>> {
    const result = this.emptyLoginResult();

    if (!dto.id || !dto.code) {
      return OperationResult.Validation<LoginResultViewModel>();
    }

    const user = await this.prisma.user.findUnique({ where: { id: dto.id } });
    if (!user) {
      result.notFound = true;
      return result;
    }

    // Validate OTP
    const valid = await this.validateOtp(user.id, dto.code, 1);
    if (!valid) {
      return OperationResult.Rejected<LoginResultViewModel>();
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailConfirmed: true },
    });

    result.token = this.generateToken(user.id, user.username);
    result.userId = user.id;
    result.username = user.username;
    result.id = user.id;

    this.logger.log(`Email confirmed for user: ${user.username}`);

    return result;
  }

  // ─── Profile (get current user) ────────────────────────────

  async getProfile(userId: string): Promise<ProfileViewModel | OperationResult<ProfileViewModel>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return OperationResult.NotFound<ProfileViewModel>();
    }
    return this.toProfile(user);
  }

  // ─── Profile update ────────────────────────────────────────

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    avatarFile?: Express.Multer.File,
  ): Promise<boolean | OperationResult<boolean>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return OperationResult.NotFound<boolean>();
    }

    let avatarPath = user.avatar;

    if (avatarFile) {
      const extension = avatarFile.originalname.split('.').pop() ?? 'png';
      const key = `avatars/${userId}/${uuidv4()}.${extension}`;
      await this.storage.upload(key, avatarFile.buffer, avatarFile.mimetype, avatarFile.size);
      avatarPath = key;

      if (user.avatar) {
        try {
          await this.storage.delete(user.avatar);
        } catch {
          this.logger.warn(`Failed to delete old avatar: ${user.avatar}`);
        }
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName?.trim() ?? user.firstName,
        lastName: dto.lastName?.trim() ?? user.lastName,
        bio: dto.bio ?? user.bio,
        timeZone: dto.timeZone ?? user.timeZone,
        calendar: dto.calendar != null ? Number(dto.calendar) : user.calendar,
        darkMode: dto.darkMode != null ? String(dto.darkMode) === 'true' || dto.darkMode === true : user.darkMode,
        avatar: avatarPath,
      },
    });

    this.logger.log(`Profile updated for user: ${userId}`);

    await this.logActivity(userId, ActivityType.AccountProfileUpdate, userId, 'account');

    return true;
  }

  // ─── Password: Forget ──────────────────────────────────────

  async forgotPassword(dto: ForgotDto): Promise<ForgotResultViewModel | OperationResult<ForgotResultViewModel>> {
    // Validate captcha
    const captchaResult = await this.validateCaptchaPayload(dto.captcha);
    if (!captchaResult.valid) {
      this.logger.warn(`Forgot captcha failed: ${captchaResult.reason}`);
      return OperationResult.Rejected<ForgotResultViewModel>();
    }

    const result: ForgotResultViewModel = {
      emailFailed: false,
      emailNotConfirmed: false,
      phoneNotConfirmed: false,
      smsFailed: false,
      lockedOut: false,
      notFound: false,
      wait: false,
      id: '',
    };

    const identifier = dto.username?.trim().toLowerCase();
    if (!identifier) {
      return OperationResult.Validation<ForgotResultViewModel>();
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      result.notFound = true;
      return result;
    }

    if (!user.emailConfirmed) {
      result.emailNotConfirmed = true;
      result.id = user.id;
      return result;
    }

    // Generate OTP and send reset email
    try {
      const code = await this.createVerificationToken(user.id, 2);
      this.queue.emitEmail({
        to: user.email,
        template: 'reset-password',
        culture: this.config.get<string>('server.language') || 'en',
        data: { code, firstName: user.firstName },
      });
    } catch (e) {
      if ((e as Error).message === 'OTP_RATE_LIMIT') {
        result.wait = true;
        return result;
      }
      result.emailFailed = true;
      return result;
    }

    result.id = user.id;

    this.logger.log(`Password reset requested for user: ${user.username}`);

    return result;
  }

  // ─── Password: Recover ─────────────────────────────────────

  async recoverPassword(dto: ResetPasswordDto): Promise<LoginResultViewModel | OperationResult<LoginResultViewModel>> {
    const result = this.emptyLoginResult();

    if (!dto.id || !dto.code || !dto.password) {
      return OperationResult.Validation<LoginResultViewModel>();
    }

    if (dto.password !== dto.confirmPassword) {
      return OperationResult.Validation<LoginResultViewModel>();
    }

    const user = await this.prisma.user.findUnique({ where: { id: dto.id } });
    if (!user) {
      result.notFound = true;
      return result;
    }

    // Validate OTP
    const valid = await this.validateOtp(user.id, dto.code, 2);
    if (!valid) {
      return OperationResult.Rejected<LoginResultViewModel>();
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    result.token = this.generateToken(user.id, user.username);
    result.userId = user.id;
    result.username = user.username;
    result.id = user.id;

    this.logger.log(`Password recovered for user: ${user.username}`);

    return result;
  }

  // ─── Password: Change ──────────────────────────────────────

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<boolean | OperationResult<boolean>> {
    if (!dto.oldPassword || !dto.newPassword) {
      return OperationResult.Validation<boolean>();
    }

    if (dto.newPassword !== dto.confirmPassword) {
      return OperationResult.Validation<boolean>();
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return OperationResult.NotFound<boolean>();
    }

    const passwordValid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!passwordValid) {
      return OperationResult.Rejected<boolean>();
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    this.logger.log(`Password changed for user: ${userId}`);

    await this.logActivity(userId, ActivityType.AccountPasswordChange, userId, 'account');

    return true;
  }

  // ─── Email: Change ─────────────────────────────────────────

  async changeEmail(
    userId: string,
    dto: ChangeEmailDto,
  ): Promise<string | OperationResult<string>> {
    const email = dto.email?.trim().toLowerCase();
    if (!email) {
      return OperationResult.Validation<string>();
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return OperationResult.NotFound<string>();
    }

    const existing = await this.prisma.user.findFirst({
      where: { email, id: { not: userId } },
    });
    if (existing) {
      return OperationResult.Duplicate<string>();
    }

    const verificationId = uuidv4();

    this.logger.log(`Email change requested for user: ${userId} -> ${email} (verification: ${verificationId})`);

    await this.prisma.user.update({
      where: { id: userId },
      data: { email, emailConfirmed: false },
    });

    await this.logActivity(userId, ActivityType.AccountEmailChange, userId, 'account');

    return verificationId;
  }

  // ─── Email: Change Confirm ─────────────────────────────────

  async confirmEmailChange(
    userId: string,
    dto: ConfirmDto,
  ): Promise<boolean | OperationResult<boolean>> {
    if (!dto.id || !dto.code) {
      return OperationResult.Validation<boolean>();
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return OperationResult.NotFound<boolean>();
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailConfirmed: true },
    });

    this.logger.log(`Email change confirmed for user: ${userId}`);

    return true;
  }

  // ─── Phone: Change ─────────────────────────────────────────

  async changePhone(
    userId: string,
    dto: ChangePhoneDto,
  ): Promise<string | OperationResult<string>> {
    const phone = dto.phone?.trim();
    if (!phone) {
      return OperationResult.Validation<string>();
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return OperationResult.NotFound<string>();
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Store verification token (type=3 for phone)
    const token = await this.prisma.verificationToken.create({
      data: {
        userId,
        code: otp,
        type: 3,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Update phone (unconfirmed)
    await this.prisma.user.update({
      where: { id: userId },
      data: { phone, phoneConfirmed: false },
    });

    // Queue SMS delivery
    this.queue.emitSms({
      to: phone,
      message: `Your Asoode verification code is: ${otp}`,
      data: { userId, type: 'phone_verify' },
    });

    this.logger.log(`Phone change requested for user: ${userId} -> ${phone} (token: ${token.id})`);

    await this.logActivity(userId, ActivityType.AccountPhoneChange, userId, 'account');

    return token.id;
  }

  // ─── Phone: Change Confirm ─────────────────────────────────

  async confirmPhoneChange(
    userId: string,
    dto: ConfirmDto,
  ): Promise<boolean | OperationResult<boolean>> {
    if (!dto.id || !dto.code) {
      return OperationResult.Validation<boolean>();
    }

    const token = await this.prisma.verificationToken.findUnique({
      where: { id: dto.id },
    });

    if (!token || token.userId !== userId || token.type !== 3) {
      return OperationResult.NotFound<boolean>();
    }

    if (token.used || token.expiresAt < new Date()) {
      return OperationResult.Validation<boolean>();
    }

    if (token.code !== dto.code) {
      return OperationResult.Validation<boolean>();
    }

    // Mark token as used and confirm phone
    await this.prisma.verificationToken.update({
      where: { id: dto.id },
      data: { used: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { phoneConfirmed: true },
    });

    this.logger.log(`Phone change confirmed for user: ${userId}`);

    return true;
  }

  // ─── Resend Verification ───────────────────────────────────

  async resendVerification(id: string): Promise<boolean | OperationResult<boolean>> {
    if (!id) {
      return OperationResult.Validation<boolean>();
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      return OperationResult.NotFound<boolean>();
    }

    try {
      const code = await this.createVerificationToken(user.id, 1);
      this.queue.emitEmail({
        to: user.email,
        template: 'verify-email',
        culture: this.config.get<string>('server.language') || 'en',
        data: { code, firstName: user.firstName },
      });
    } catch {
      this.logger.warn(`OTP rate limit or send failed for user: ${user.id}`);
      return OperationResult.Rejected<boolean>();
    }

    this.logger.log(`Verification resent for user: ${user.username} (${id})`);

    return true;
  }

  // ─── Push Subscriptions ────────────────────────────────────

  async savePushSubscription(
    userId: string,
    dto: { endpoint: string; auth: string; p256dh: string; expirationTime?: number | null },
  ): Promise<boolean | OperationResult<boolean>> {
    if (!dto.endpoint || !dto.auth || !dto.p256dh) {
      return OperationResult.Validation<boolean>();
    }

    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: {
        userId,
        auth: dto.auth,
        p256dh: dto.p256dh,
        expirationTime: dto.expirationTime ? new Date(dto.expirationTime) : null,
      },
      create: {
        userId,
        endpoint: dto.endpoint,
        auth: dto.auth,
        p256dh: dto.p256dh,
        expirationTime: dto.expirationTime ? new Date(dto.expirationTime) : null,
      },
    });

    this.logger.log(`Push subscription saved for user: ${userId}`);
    return true;
  }

  async removePushSubscription(
    userId: string,
    endpoint: string,
  ): Promise<boolean | OperationResult<boolean>> {
    if (!endpoint) {
      return OperationResult.Validation<boolean>();
    }

    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });

    this.logger.log(`Push subscription removed for user: ${userId}`);
    return true;
  }

  // ─── Devices: List ─────────────────────────────────────────

  async getDevices(userId: string): Promise<DeviceViewModel[]> {
    const devices = await this.prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return devices.map((d) => ({
      id: d.id,
      title: d.title,
      os: d.os,
      enabled: d.enabled,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  }

  // ─── Devices: Add ──────────────────────────────────────────

  async addDevice(
    userId: string,
    body: { title: string; os: string },
  ): Promise<boolean | OperationResult<boolean>> {
    if (!body.title?.trim()) {
      return OperationResult.Validation<boolean>();
    }

    const device = await this.prisma.device.create({
      data: {
        userId,
        title: body.title.trim(),
        os: body.os?.trim() ?? '',
        enabled: true,
      },
    });

    this.logger.log(`Device added for user: ${userId}`);

    await this.logActivity(userId, ActivityType.AccountDeviceAdd, device.id, 'account_device');

    return true;
  }

  // ─── Devices: Remove ───────────────────────────────────────

  async removeDevice(
    userId: string,
    deviceId: string,
  ): Promise<boolean | OperationResult<boolean>> {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      return OperationResult.NotFound<boolean>();
    }

    await this.prisma.device.delete({ where: { id: deviceId } });

    this.logger.log(`Device removed: ${deviceId} for user: ${userId}`);

    await this.logActivity(userId, ActivityType.AccountDeviceRemove, deviceId, 'account_device');

    return true;
  }

  // ─── Devices: Toggle ───────────────────────────────────────

  async toggleDevice(
    userId: string,
    deviceId: string,
  ): Promise<boolean | OperationResult<boolean>> {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      return OperationResult.NotFound<boolean>();
    }

    await this.prisma.device.update({
      where: { id: deviceId },
      data: { enabled: !device.enabled },
    });

    this.logger.log(`Device toggled: ${deviceId} -> ${!device.enabled}`);

    await this.logActivity(userId, ActivityType.AccountDeviceState, deviceId, 'account_device');

    return true;
  }

  // ─── Devices: Rename ───────────────────────────────────────

  async renameDevice(
    userId: string,
    deviceId: string,
    body: { title: string },
  ): Promise<boolean | OperationResult<boolean>> {
    if (!body.title?.trim()) {
      return OperationResult.Validation<boolean>();
    }

    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      return OperationResult.NotFound<boolean>();
    }

    await this.prisma.device.update({
      where: { id: deviceId },
      data: { title: body.title.trim() },
    });

    this.logger.log(`Device renamed: ${deviceId} -> "${body.title.trim()}"`);

    return true;
  }

  // ─── Member Profile (public view of another user) ──────────

  async getMemberProfile(
    targetUserId: string,
  ): Promise<MemberInfoViewModel | OperationResult<MemberInfoViewModel>> {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        avatar: true,
        firstName: true,
        lastName: true,
        username: true,
        bio: true,
      },
    });

    if (!user) {
      return OperationResult.NotFound<MemberInfoViewModel>();
    }

    return this.toMemberInfo(user);
  }
}
