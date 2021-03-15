export interface BanTeamDetails {
    div: string;
    currentTeam: string;
    teamId: number;
    teamLink: string;
}

export interface Ban {
    steamId: string;
    name: string;
    link: string;
    expiresAt: Date;
    teamDetails: BanTeamDetails | null;
    reason: string
}