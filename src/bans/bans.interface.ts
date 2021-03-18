export interface BanTeamDetails {
  div: string;
  currentTeam: string;
  teamId: string;
  teamLink: string;
}

export interface Ban {
  banId: string;
  steamId: string;
  name: string;
  link: string;
  expiresAt: Date;
  teamDetails: BanTeamDetails | null;
  reason: string;
}
