import { Result, Tournament, Participant } from '../types';

export interface RankingEntry {
  participant: Participant;
  points: number;
  tournamentsPlayed: number;
  titles: number;
}

export interface TitleRankingEntry {
  participant: Participant;
  total: number;
  grandSlams: number;
  masters1000: number;
  others: number;
}

export function calculateRanking(
  participants: Participant[],
  tournaments: Tournament[],
  results: Result[],
  year?: number,
  rankingType: 'ATP' | 'RACE' = 'ATP'
): RankingEntry[] {
  let filteredTournaments: Tournament[] = [];
  const activeTournaments = tournaments.filter(t => !t.excludeFromRanking);

  if (year) {
    if (rankingType === 'ATP') {
      // Rolling 52-week logic (ATP style)
      // 1. Tournaments played in the selected year
      const currentYearTournaments = activeTournaments.filter(t => t.year === year && t.status === 'COMPLETED');
      const currentYearTournamentNames = new Set(currentYearTournaments.map(t => t.name));

      // 2. Tournaments played in the previous year, ONLY IF they haven't been played yet in the current year
      const previousYearTournaments = activeTournaments.filter(t => 
        t.year === (year - 1) && 
        t.status === 'COMPLETED' && 
        !currentYearTournamentNames.has(t.name)
      );

      filteredTournaments = [...currentYearTournaments, ...previousYearTournaments];
    } else {
      // Race logic (Annual) - Only tournaments from the selected year
      filteredTournaments = activeTournaments.filter(t => t.year === year && t.status === 'COMPLETED');
    }
  } else {
    filteredTournaments = activeTournaments.filter(t => t.status === 'COMPLETED');
  }
    
  const validTournamentIds = new Set(filteredTournaments.map(t => t.id));
  
  const validResults = results.filter(r => validTournamentIds.has(r.tournamentId));

  const rankingMap = new Map<string, RankingEntry>();

  participants.forEach(p => {
    rankingMap.set(p.id, {
      participant: p,
      points: 0,
      tournamentsPlayed: 0,
      titles: 0
    });
  });

  validResults.forEach(r => {
    if (r.participates === false) return;
    const entry = rankingMap.get(r.participantId);
    if (entry) {
      entry.points += r.points;
      entry.tournamentsPlayed += 1;
      if (r.position === 1) {
        entry.titles += 1;
      }
    }
  });

  return Array.from(rankingMap.values())
    .sort((a, b) => b.points - a.points || b.titles - a.titles);
}

export function calculateTitlesRanking(
  participants: Participant[],
  tournaments: Tournament[],
  results: Result[]
): TitleRankingEntry[] {
  const completedTournaments = tournaments.filter(t => t.status === 'COMPLETED');
  const tournamentMap = new Map(completedTournaments.map(t => [t.id, t]));
  
  const validResults = results.filter(r => tournamentMap.has(r.tournamentId) && r.position === 1);

  const titlesMap = new Map<string, TitleRankingEntry>();

  participants.forEach(p => {
    titlesMap.set(p.id, {
      participant: p,
      total: 0,
      grandSlams: 0,
      masters1000: 0,
      others: 0
    });
  });

  validResults.forEach(r => {
    const entry = titlesMap.get(r.participantId);
    const tournament = tournamentMap.get(r.tournamentId);
    if (entry && tournament) {
      entry.total += 1;
      if (tournament.type === 'GRAND_SLAM') {
        entry.grandSlams += 1;
      } else if (tournament.type === 'MASTER_1000') {
        entry.masters1000 += 1;
      } else {
        entry.others += 1;
      }
    }
  });

  return Array.from(titlesMap.values())
    .sort((a, b) => 
      b.total - a.total || 
      b.grandSlams - a.grandSlams || 
      b.masters1000 - a.masters1000 || 
      b.others - a.others
    );
}
