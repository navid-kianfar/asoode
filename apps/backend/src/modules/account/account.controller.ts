import {
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  ChangePasswordDto,
  ChangeEmailDto,
  ChangePhoneDto,
  ConfirmDto,
  UpdateProfileDto,
  type ForgotDto,
} from '@asoode/shared';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccountService } from './account.service';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // ─── Public Auth Routes ─────────────────────────────────────

  @Public()
  @Post('captcha/challenge')
  getCaptchaChallenge() {
    return this.accountService.generateCaptchaChallenge();
  }

  @Public()
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.accountService.login(body);
  }

  @Public()
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.accountService.register(body);
  }

  @Public()
  @Post('confirm')
  confirm(@Body() body: ConfirmDto) {
    return this.accountService.confirm(body);
  }

  @Public()
  @Post('password/forget')
  forgotPassword(@Body() body: ForgotDto) {
    return this.accountService.forgotPassword(body);
  }

  @Public()
  @Post('password/recover')
  recoverPassword(@Body() body: ResetPasswordDto) {
    return this.accountService.recoverPassword(body);
  }

  @Public()
  @Post('resend/verification/:id')
  resendVerification(@Param('id') id: string) {
    return this.accountService.resendVerification(id);
  }

  // ─── Authenticated Profile Routes ──────────────────────────

  @Post('profile')
  getProfile(@CurrentUser() userId: string) {
    return this.accountService.getProfile(userId);
  }

  @Post('profile/update')
  @UseInterceptors(FileInterceptor('avatar'))
  updateProfile(
    @CurrentUser() userId: string,
    @Body() body: UpdateProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    return this.accountService.updateProfile(userId, body, avatar);
  }

  @Post('profile/:userId')
  getMemberProfile(
    @CurrentUser() _userId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.accountService.getMemberProfile(targetUserId);
  }

  // ─── Password ──────────────────────────────────────────────

  @Post('password/change')
  changePassword(
    @CurrentUser() userId: string,
    @Body() body: ChangePasswordDto,
  ) {
    return this.accountService.changePassword(userId, body);
  }

  // ─── Email ─────────────────────────────────────────────────

  @Post('email/change')
  changeEmail(
    @CurrentUser() userId: string,
    @Body() body: ChangeEmailDto,
  ) {
    return this.accountService.changeEmail(userId, body);
  }

  @Post('email/change/confirm')
  confirmEmailChange(
    @CurrentUser() userId: string,
    @Body() body: ConfirmDto,
  ) {
    return this.accountService.confirmEmailChange(userId, body);
  }

  // ─── Phone ─────────────────────────────────────────────────

  @Post('phone/change')
  changePhone(
    @CurrentUser() userId: string,
    @Body() body: ChangePhoneDto,
  ) {
    return this.accountService.changePhone(userId, body);
  }

  @Post('phone/change/confirm')
  confirmPhoneChange(
    @CurrentUser() userId: string,
    @Body() body: ConfirmDto,
  ) {
    return this.accountService.confirmPhoneChange(userId, body);
  }

  // ─── Push Subscriptions ────────────────────────────────────

  @Post('push-subscription')
  savePushSubscription(
    @CurrentUser() userId: string,
    @Body() body: { endpoint: string; auth: string; p256dh: string; expirationTime?: number | null },
  ) {
    return this.accountService.savePushSubscription(userId, body);
  }

  @Post('push-subscription/remove')
  removePushSubscription(
    @CurrentUser() userId: string,
    @Body() body: { endpoint: string },
  ) {
    return this.accountService.removePushSubscription(userId, body.endpoint);
  }

  // ─── Devices ───────────────────────────────────────────────

  @Post('devices')
  getDevices(@CurrentUser() userId: string) {
    return this.accountService.getDevices(userId);
  }

  @Post('devices/add')
  addDevice(
    @CurrentUser() userId: string,
    @Body() body: { title: string; os: string },
  ) {
    return this.accountService.addDevice(userId, body);
  }

  @Post('devices/remove/:id')
  removeDevice(
    @CurrentUser() userId: string,
    @Param('id') deviceId: string,
  ) {
    return this.accountService.removeDevice(userId, deviceId);
  }

  @Post('devices/toggle/:id')
  toggleDevice(
    @CurrentUser() userId: string,
    @Param('id') deviceId: string,
  ) {
    return this.accountService.toggleDevice(userId, deviceId);
  }

  @Post('devices/rename/:id')
  renameDevice(
    @CurrentUser() userId: string,
    @Param('id') deviceId: string,
    @Body() body: { title: string },
  ) {
    return this.accountService.renameDevice(userId, deviceId, body);
  }
}
