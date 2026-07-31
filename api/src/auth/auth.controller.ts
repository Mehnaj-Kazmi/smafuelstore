import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /*
   * Deliberately mean limits on the three routes worth attacking.
   *
   * A person signs up once and mistypes a password a handful of times; nothing
   * legitimate needs more than this. Anything that does is guessing passwords,
   * farming accounts, or using our mail server to pester somebody.
   */
  @Throttle({ default: { ttl: 3_600_000, limit: 5 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { ttl: 300_000, limit: 8 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /* Both reset routes are deliberately unauthenticated — someone who cannot
     sign in is exactly who needs them. */
  @Throttle({ default: { ttl: 3_600_000, limit: 4 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /* Looser than requesting a link: the token is unguessable, and someone who
     mistypes a new password twice should not be locked out of their own reset. */
  @Throttle({ default: { ttl: 900_000, limit: 10 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }
}
