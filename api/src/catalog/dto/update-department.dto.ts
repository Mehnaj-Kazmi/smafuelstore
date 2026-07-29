import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() blurb?: string;

  /** Path returned by POST /api/uploads/product-image. Null clears it. */
  @IsOptional() @IsString() imageUrl?: string | null;

  /** Glyph used when there is no uploaded image. */
  @IsOptional() @IsString() art?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(360) hue?: number;

  @IsOptional() @IsBoolean() ageRestricted?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
}
