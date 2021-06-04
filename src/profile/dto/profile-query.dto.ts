import {
  IsArray,
  IsBoolean,
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
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.split(',').map(transform))
  /**
   * Filter for formats or 'gamemodes'
   */
  readonly formats: string[];

  @IsOptional()
  @IsBooleanString()
  /**
   * Filter for active teams
   */
  readonly onlyActive: boolean;

  @IsOptional()
  @IsBooleanString()
  /**
   * Disable caching of this request
   */
  readonly disableCache: boolean = false;
}

export class BulkProfileQueryDto extends ProfileQueryDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsSteamIdArray()
  @Transform(({ value }) =>
    value.map((v: string) => new SteamID(v).getSteamID64()),
  )
  /**
   * Profiles in SteamID64 format
   */
  readonly profiles: string[];

  @IsBoolean()
  /**
   * Trim down response to only experience and name
   */
  readonly slim: boolean = false;

  @IsBoolean()
  /**
   * Filter for active teams
   */
  readonly onlyActive: boolean = false;
}
