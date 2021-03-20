import { IsArray, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

const Formats = {
  sixes: 'sixes', // This consistancy is amazing!!! not.
  highlander: 'hl',
  prolander: 'pl',
  nr6s: 'nr',
  nr: 'nr'
} as const;

function transform(toConvert: string) {
  if (Formats[toConvert.trim()]) return Formats[toConvert.trim()];
}

export class ProfileQueryDto {
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => value.split(',').map(transform))
  readonly formats: string[];
}
