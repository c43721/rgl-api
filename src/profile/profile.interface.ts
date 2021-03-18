export interface ProfileStatus {
  banned: boolean;
  probation: boolean;
  verified: boolean;
}

export interface Trophy {
  [x: string]: number;
}

export interface Experience {
  category: string;
  format: string;
  season: string;
  div: string;
  teamName: string;
  rank: string;
  recordWith: string;
  recordWithout: string | null;
  amountWon: number;
  join: Date;
  left: Date | null;
  isCurrentTeam: boolean;
}

export interface Profile {
  steamId: string;
  avatar: string;
  name: string;
  link: string;

  status: ProfileStatus;
  totalEarnings: number;
  trophies: Trophy;
  banHistory: Ban[];

  experience: Experience[];
}

export interface Ban {
  reason: string;
  date: Date;
  expires: Date;
  isCurrentBan: boolean;
  // category: string;
}

export interface ProfileBanDetails {
  steamId: string;
  banned: boolean;
  probation: boolean;
  verified: boolean;

  details: Ban | null;
  previous: Ban[] | null;
}
