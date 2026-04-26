export type Role = 'admin' | 'juez_sede' | 'publico';
export type MatchStatus = 'pendiente' | 'asignado' | 'en_juego' | 'finalizado' | 'wo';
export type TableStatus = 'libre' | 'ocupada' | 'fuera_de_servicio';
export type CategoryName = 'master' | 'primera' | 'segunda' | 'tercera';
export type PhaseType = 'clasificatorio' | 'segunda' | 'primera' | 'master';

export interface User {
  id: number;
  username: string;
  role: Role;
  venueId?: number;
  venueName?: string;
}

export interface Venue {
  id: number;
  name: string;
  address?: string;
  city?: string;
  tables?: Table[];
  _count?: { tables: number };
}

export interface Table {
  id: number;
  number: number;
  venueId: number;
  venue?: Venue;
  status: TableStatus;
  matches?: Match[];
}

export interface Category {
  id: number;
  name: CategoryName;
}

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  dni?: string;
  categoryId: number;
  category?: Category;
  active: boolean;
}

export interface Tournament {
  id: number;
  name: string;
  year: number;
  description?: string;
  active: boolean;
  circuits?: Circuit[];
}

export interface Circuit {
  id: number;
  name: string;
  tournamentId: number;
  tournament?: Tournament;
  order: number;
  startDate?: string;
  endDate?: string;
  active: boolean;
  phases?: Phase[];
}

export interface Phase {
  id: number;
  name: string;
  type: PhaseType;
  circuitId: number;
  circuit?: Circuit;
  order: number;
  matches?: Match[];
}

export interface MatchResult {
  id: number;
  matchId: number;
  setsA: number;
  setsB: number;
  pointsA: number;
  pointsB: number;
  winnerId?: number;
  isWO: boolean;
  woPlayerId?: number;
  notes?: string;
}

export interface SetResult {
  id: number;
  matchId: number;
  setNumber: number;
  pointsA: number;
  pointsB: number;
  winnerId?: number;
}

export interface RuleSet {
  id: number;
  name: string;
  bestOf: number;
  setsToWin: number;
  pointsPerSet: number;
  woSetsWinner: number;
  woSetsLoser: number;
  woPtsWinner: number;
  woPtsLoser: number;
}

export interface Match {
  id: number;
  phaseId: number;
  phase?: Phase;
  playerAId: number;
  playerA?: Player;
  playerBId: number;
  playerB?: Player;
  tableId?: number;
  table?: Table;
  ruleSetId?: number;
  ruleSet?: RuleSet;
  status: MatchStatus;
  round: number;
  scheduledAt?: string;
  startedAt?: string;
  finishedAt?: string;
  result?: MatchResult;
  sets?: SetResult[];
}

export interface RankingEntry {
  id: number;
  playerId: number;
  player?: Player;
  circuitId: number;
  circuit?: Circuit;
  points: number;
  matchesPlayed: number;
  matchesWon: number;
  setsWon: number;
  setsLost: number;
  pointsFor: number;
  pointsAgainst: number;
  position?: number;
  setsAverage?: number;
  pointsAverage?: number;
}