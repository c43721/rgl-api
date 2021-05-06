import {
  IsArray,
  IsBooleanString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsSteamIdArray } from 'src/lib/validators/steamid.validator';
import * as SteamID from 'steamid';

const Formats = {
  sixes: 'sixes', // This consistancy is amazing!!! not.
  highlander: 'hl',
  prolander: 'pl',
  nr6s: 'nr',
  nr: 'nr',
} as const;

function transform(toConvert: string) {
  if (Formats[toConvert.trim()]) return Formats[toConvert.trim()];
}

export class ProfileQueryDto {
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => value.split(',').map(transform))
  /**
   * Filter for formats or 'gamemodes'
   */
  readonly formats: string[];

  @IsBooleanString()
  @IsOptional()
  /**
   * Filter for active teams
   */
  readonly onlyActive: boolean;
}

export class BulkProfileQueryDto extends ProfileQueryDto {
  @IsNotEmpty()
  @IsArray()
  @IsSteamIdArray()
  @Transform(({ value }) =>
    value.map((v: string) => new SteamID(v).getSteamID64()),
  )
  /**
   * Profiles in SteamID64 format
   */
  readonly profiles: string[];
}
