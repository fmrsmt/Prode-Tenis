import React from 'react';
import { Match, Participant } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface BracketProps {
  matches: Match[];
  participants: Participant[];
  onMatchUpdate: (matchId: string, updates: Partial<Match>) => void;
}

export function Bracket({ matches, participants, onMatchUpdate }: BracketProps) {
  const qfMatches = matches.filter(m => m.round === 'QF').sort((a, b) => a.matchIndex - b.matchIndex);
  const sfMatches = matches.filter(m => m.round === 'SF').sort((a, b) => a.matchIndex - b.matchIndex);
  const fMatches = matches.filter(m => m.round === 'F').sort((a, b) => a.matchIndex - b.matchIndex);

  const renderMatch = (match: Match) => {
    if (!match) return null;
    
    return (
      <Card key={match.id} className="p-2 w-64 text-sm flex flex-col gap-2 bg-white shadow-sm border-neutral-200">
        <div className="flex items-center justify-between gap-2">
          <Select 
            value={match.participant1Id || 'unassigned'} 
            onValueChange={(v) => onMatchUpdate(match.id, { participant1Id: v === 'unassigned' ? undefined : v })}
          >
            <SelectTrigger className="h-8 text-xs px-2 flex-1">
              <span className="truncate">
                {match.participant1Id && match.participant1Id !== 'unassigned' 
                  ? participants.find(p => p.id === match.participant1Id)?.name || 'Jugador 1'
                  : 'Jugador 1'}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned" className="text-neutral-400 italic">Sin asignar</SelectItem>
              {participants.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input 
            type="number" 
            className="w-16 h-8 text-xs text-center px-1 flex-shrink-0" 
            value={match.score1 ?? ''} 
            onChange={(e) => onMatchUpdate(match.id, { score1: e.target.value === '' ? undefined : Number(e.target.value) })}
            placeholder="Pts"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Select 
            value={match.participant2Id || 'unassigned'} 
            onValueChange={(v) => onMatchUpdate(match.id, { participant2Id: v === 'unassigned' ? undefined : v })}
          >
            <SelectTrigger className="h-8 text-xs px-2 flex-1">
              <span className="truncate">
                {match.participant2Id && match.participant2Id !== 'unassigned' 
                  ? participants.find(p => p.id === match.participant2Id)?.name || 'Jugador 2'
                  : 'Jugador 2'}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned" className="text-neutral-400 italic">Sin asignar</SelectItem>
              {participants.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input 
            type="number" 
            className="w-16 h-8 text-xs text-center px-1 flex-shrink-0" 
            value={match.score2 ?? ''} 
            onChange={(e) => onMatchUpdate(match.id, { score2: e.target.value === '' ? undefined : Number(e.target.value) })}
            placeholder="Pts"
          />
        </div>
        <div className="mt-1 pt-2 border-t border-neutral-100">
          <Select 
            value={match.winnerId || 'unassigned'} 
            onValueChange={(v) => onMatchUpdate(match.id, { winnerId: v === 'unassigned' ? undefined : v })}
          >
            <SelectTrigger className="h-8 text-xs px-2 bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
              <span className="truncate">
                {match.winnerId && match.winnerId !== 'unassigned' 
                  ? participants.find(p => p.id === match.winnerId)?.name || 'Ganador...'
                  : 'Ganador...'}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned" className="text-neutral-400 italic">Sin ganador</SelectItem>
              {match.participant1Id && <SelectItem value={match.participant1Id}>{participants.find(p => p.id === match.participant1Id)?.name}</SelectItem>}
              {match.participant2Id && <SelectItem value={match.participant2Id}>{participants.find(p => p.id === match.participant2Id)?.name}</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </Card>
    );
  };

  return (
    <div className="flex justify-center gap-8 py-8 px-4 overflow-x-auto min-w-max bg-neutral-50/50 rounded-lg border border-neutral-100">
      {/* Quarterfinals */}
      {qfMatches.length > 0 && (
        <div className="flex flex-col justify-around gap-4 relative">
          <div className="text-center text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Cuartos</div>
          {qfMatches.map(renderMatch)}
        </div>
      )}
      
      {/* Semifinals */}
      <div className="flex flex-col justify-around gap-16 relative">
        <div className="text-center text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Semifinal</div>
        {sfMatches.map(renderMatch)}
      </div>

      {/* Final */}
      <div className="flex flex-col justify-around relative">
        <div className="text-center text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Final</div>
        {fMatches.map(renderMatch)}
      </div>
    </div>
  );
}
