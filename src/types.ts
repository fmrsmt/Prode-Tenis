export type TournamentType = 'GRAND_SLAM' | 'MASTER_1000' | 'OTHER';
export type TournamentFormat = 'KNOCKOUT' | 'KNOCKOUT_TOP_4' | 'GROUPS' | 'GENERAL_TABLE' | 'REGULAR_SEASON';
export type TournamentStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
export type Round = 'QF' | 'SF' | 'F';

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
}

export interface Tournament {
  id: string;
  name: string;
  year: number;
  type: TournamentType;
  format: TournamentFormat;
  status: TournamentStatus;
  createdAt: number;
  excludeFromRanking?: boolean;
  order?: number;
}

export interface Result {
  tournamentId: string;
  participantId: string;
  position: number; // 1 for winner, 2 for runner-up, etc.
  points: number;
  phasePoints?: number; // Puntos de fase regular/grupos
  plenos?: number; // Plenos para desempate
  group?: 'A' | 'B'; // Grupo para formato GROUPS
  participates?: boolean; // Indica si el jugador participa en este torneo
}

export interface Match {
  id: string;
  tournamentId: string;
  round: Round;
  matchIndex: number;
  participant1Id?: string;
  participant2Id?: string;
  score1?: number;
  score2?: number;
  winnerId?: string;
}

export interface ProdeStore {
  participants: Participant[];
  tournaments: Tournament[];
  results: Result[];
  matches: Match[];
  
  addParticipant: (participant: Omit<Participant, 'id'>) => void;
  updateParticipant: (id: string, participant: Partial<Participant>) => void;
  deleteParticipant: (id: string) => void;

  addTournament: (tournament: Omit<Tournament, 'id' | 'createdAt'>) => void;
  updateTournament: (id: string, tournament: Partial<Tournament>) => void;
  deleteTournament: (id: string) => void;

  saveResults: (tournamentId: string, results: Omit<Result, 'tournamentId'>[]) => void;
  saveMatches: (tournamentId: string, matches: Omit<Match, 'tournamentId'>[]) => void;
  importData: (data: { participants: Participant[], tournaments: Tournament[], results: Result[], matches: Match[] }) => void;
}
