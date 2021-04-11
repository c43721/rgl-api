const ONE_HOUR_MS = 3600000;

export enum Caches {
  BAN_CACHE = 'LATEST_RGL_BANS',
  PROFILE_CACHE = 'PROFILE_CACHE_', // ID comes last
}

export enum CacheTimes {
  ONE_HOUR = ONE_HOUR_MS,
  ONE_DAY = ONE_HOUR_MS * 24,
  ONE_WEEK = ONE_HOUR_MS * 24 * 7,
}