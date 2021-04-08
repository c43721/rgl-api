export interface TeamDetails {
  div: string;
  name: string;
  id: string;
  link: string;
}

export interface Ban {
  banId: string;
  steamId: string;
  name: string;
  link: string;
  expiresAt: Date;
  teamDetails: TeamDetails | null;
  reason: string;
}
