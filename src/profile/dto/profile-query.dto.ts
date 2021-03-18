import { IsArray, IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProfileQueryDto {
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => value.split(','))
  readonly category: string[] = [];
}
