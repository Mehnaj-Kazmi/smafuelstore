import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/** How long a reset link stays usable. Short, because it is emailed in plain text. */
const RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
  ) {}

  private toToken(user: { id: number; email: string; role: string; name: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, name: dto.name, phone: dto.phone },
    });

    return this.toToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    return this.toToken(user);
  }

  /**
   * Starts a password reset.
   *
   * The reply is the same whether or not the address has an account. Answering
   * "no such user" would turn this endpoint into a way to test which email
   * addresses are registered here, which is worth more to an attacker than the
   * convenience is worth to a customer who mistyped their address.
   *
   * Any earlier unused tokens for the account are spent first, so a forwarded or
   * screenshotted older link stops working as soon as a new one is asked for.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const generic = {
      message: 'If that email has an account, a reset link is on its way.',
    };

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) return generic;

    const token = randomBytes(32).toString('hex');

    await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + RESET_TTL_MS),
        },
      });
    });

    const link = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;

    const sent = await this.mail.sendPasswordReset(user.email, user.name, link);

    if (process.env.NODE_ENV === 'production') return generic;

    /*
     * Outside production the link is handed back so the flow can be completed
     * without opening a mailbox. Returning it in production would let anyone who
     * can name an email address seize that account, so it is limited to dev.
     * `devPreviewUrl` is the Ethereal message when that transport is in use.
     */
    return {
      ...generic,
      devResetLink: link,
      ...(sent.previewUrl ? { devPreviewUrl: sent.previewUrl } : {}),
    };
  }

  /** Completes a reset. The token must exist, be unspent, and be in date. */
  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(dto.token) },
    });

    /* One message for every failure mode, so the wording cannot tell a caller
       whether a token was wrong, already spent, or merely out of date. */
    const reject = () => {
      throw new BadRequestException('That reset link is invalid or has expired');
    };

    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) reject();

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      /* Marked used inside the transaction and filtered on `usedAt: null`, so
         two requests racing the same link cannot both reset the password. */
      const spent = await tx.passwordResetToken.updateMany({
        where: { id: record!.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (spent.count === 0) reject();

      return tx.user.update({
        where: { id: record!.userId },
        data: { passwordHash },
      });
    });

    /* Signed straight in — the reset already proved control of the mailbox, and
       bouncing to a login form here just invites a second password prompt. */
    return this.toToken(user);
  }
}
