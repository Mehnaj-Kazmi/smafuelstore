import { PartialType } from '@nestjs/mapped-types';
import { CreateDealDto } from './create-deal.dto';

export class UpdateDealDto extends PartialType(CreateDealDto) {}
