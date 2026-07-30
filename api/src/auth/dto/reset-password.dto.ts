import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  /** Same minimum as registration, so a reset cannot weaken an account. */
  @MinLength(6)
  password: string;
}
