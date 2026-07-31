import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateHeroSlideDto {
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;

  @IsString() eyebrow: string;
  @IsString() title: string;
  @IsString() blurb: string;
  @IsString() badgeBig: string;
  @IsString() badgeSmall: string;
  @IsString() ctaLabel: string;
  @IsString() ctaHref: string;

  @IsOptional() @IsHexColor() accent?: string;

  /** Uploaded tile artwork, in display order. Empty strings mean "use the glyph". */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  tileImages?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  fallbackArt?: string[];

  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateHeroSlideDto extends PartialType(CreateHeroSlideDto) {}

export class ShowcaseTileDto {
  @IsString() label: string;
  @IsString() href: string;

  @IsOptional() @IsString() imageUrl?: string | null;

  @IsString() art: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(360) hue: number;
}

export class CreateShowcaseCardDto {
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;

  @IsString() title: string;
  @IsString() linkLabel: string;
  @IsString() linkHref: string;

  @IsOptional() @IsString() variant?: string;

  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => ShowcaseTileDto)
  tiles: ShowcaseTileDto[];

  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateShowcaseCardDto extends PartialType(CreateShowcaseCardDto) {}
