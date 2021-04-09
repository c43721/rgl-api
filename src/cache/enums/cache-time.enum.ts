const ONE_HOUR_MS = 3600000;

export enum CacheTimes {
  ONE_HOUR = ONE_HOUR_MS,
  ONE_DAY = ONE_HOUR_MS * 24,
  ONE_WEEEK = ONE_HOUR_MS * 24 * 7,
}

export default CacheTimes;