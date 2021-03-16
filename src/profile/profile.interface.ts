
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
    amountWon: number | null;
    join: Date;
    left: Date | null;
    isCurrentTeam: boolean;
}

export interface Profile {
    steamId: string;
    avatar: string;
    name: string;

    status: ProfileStatus;
    totalEarnings: number;
    trophies: Trophy;

    experience: Experience[];
}