import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProdeStore } from '@/store/useProdeStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { Match, Participant } from '@/types';
import { Bracket } from '@/components/Bracket';

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournaments, participants, results, matches, saveResults, saveMatches, updateTournament } = useProdeStore();
  
  const tournament = tournaments.find(t => t.id === id);
  
  // Local state for editing results
  const [localResults, setLocalResults] = useState<Record<string, { 
    position: number | '', 
    points: number | '', 
    phasePoints: number | '',
    plenos: number | '',
    group: 'A' | 'B' | '',
    participates: boolean
  }>>({});
  const [localMatches, setLocalMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (tournament) {
      const existingResults = results.filter(r => r.tournamentId === tournament.id);
      const initial: Record<string, { 
        position: number | '', 
        points: number | '', 
        phasePoints: number | '',
        plenos: number | '',
        group: 'A' | 'B' | '',
        participates: boolean
      }> = {};
      
      participants.forEach(p => {
        const existing = existingResults.find(r => r.participantId === p.id);
        initial[p.id] = {
          position: existing ? existing.position : '',
          points: existing ? existing.points : '',
          phasePoints: existing?.phasePoints ?? '',
          plenos: existing?.plenos ?? '',
          group: existing?.group ?? '',
          participates: existing?.participates ?? true
        };
      });
      
      setLocalResults(initial);

      // Initialize matches if none exist
      const existingMatches = matches.filter(m => m.tournamentId === tournament.id);
      if (existingMatches.length > 0) {
        setLocalMatches(existingMatches);
      } else {
        let defaultMatches: Match[] = [];
        if (tournament.format === 'KNOCKOUT_TOP_4') {
          defaultMatches = [
            { id: `sf1-${Date.now()}`, tournamentId: tournament.id, round: 'SF', matchIndex: 0 },
            { id: `sf2-${Date.now()}`, tournamentId: tournament.id, round: 'SF', matchIndex: 1 },
            { id: `f1-${Date.now()}`, tournamentId: tournament.id, round: 'F', matchIndex: 0 },
          ];
        } else {
          defaultMatches = [
            { id: `qf1-${Date.now()}`, tournamentId: tournament.id, round: 'QF', matchIndex: 0 },
            { id: `qf2-${Date.now()}`, tournamentId: tournament.id, round: 'QF', matchIndex: 1 },
            { id: `qf3-${Date.now()}`, tournamentId: tournament.id, round: 'QF', matchIndex: 2 },
            { id: `qf4-${Date.now()}`, tournamentId: tournament.id, round: 'QF', matchIndex: 3 },
            { id: `sf1-${Date.now()}`, tournamentId: tournament.id, round: 'SF', matchIndex: 0 },
            { id: `sf2-${Date.now()}`, tournamentId: tournament.id, round: 'SF', matchIndex: 1 },
            { id: `f1-${Date.now()}`, tournamentId: tournament.id, round: 'F', matchIndex: 0 },
          ];
        }
        setLocalMatches(defaultMatches);
      }
    }
  }, [tournament, participants, results, matches]);

  if (!tournament) {
    return <div className="p-8 text-center">Torneo no encontrado</div>;
  }

  const handleSave = () => {
    const resultsToSave = Object.entries(localResults)
      .filter(([_, data]: [string, any]) => data.participates && (data.position !== '' || data.points !== '' || data.phasePoints !== '' || data.plenos !== ''))
      .map(([participantId, data]: [string, any]) => ({
        participantId,
        position: Number(data.position) || 0,
        points: Number(data.points) || 0,
        phasePoints: data.phasePoints === '' ? undefined : Number(data.phasePoints),
        plenos: data.plenos === '' ? undefined : Number(data.plenos),
        group: data.group === '' ? undefined : data.group,
        participates: data.participates
      }));

    saveResults(tournament.id, resultsToSave);
    saveMatches(tournament.id, localMatches);
    
    // Auto-complete tournament if it has results
    if (tournament.status !== 'COMPLETED' && resultsToSave.some(r => r.position > 0)) {
      if (confirm('¿Deseas marcar el torneo como completado?')) {
        updateTournament(tournament.id, { status: 'COMPLETED' });
      }
    }
    
    toast.success('Datos guardados correctamente');
  };

  const autoCalculateFinalPositions = () => {
    const newResults = { ...localResults };
    
    if (!hasPhases) {
       sortedByPhasePoints.forEach((p, index) => {
         if (newResults[p.id]) newResults[p.id].position = index + 1;
       });
    } else {
       const finalMatch = localMatches.find(m => m.round === 'F');
       const sfMatches = localMatches.filter(m => m.round === 'SF');
       const qfMatches = localMatches.filter(m => m.round === 'QF');

       const winner = finalMatch?.winnerId;
       const runnerUp = finalMatch?.participant1Id === winner ? finalMatch?.participant2Id : finalMatch?.participant1Id;
       
       const sfLosers = sfMatches.map(m => m.winnerId === m.participant1Id ? m.participant2Id : m.participant1Id).filter(Boolean);
       const qfLosers = qfMatches.map(m => m.winnerId === m.participant1Id ? m.participant2Id : m.participant1Id).filter(Boolean);

       const sortByPhase = (ids: (string | undefined)[]) => {
         return ids.filter(Boolean).sort((a, b) => {
           const idxA = sortedByPhasePoints.findIndex(p => p.id === a);
           const idxB = sortedByPhasePoints.findIndex(p => p.id === b);
           return idxA - idxB;
         });
       };

       const sortedSFLosers = sortByPhase(sfLosers);
       const sortedQFLosers = sortByPhase(qfLosers);

       const assignedIds = new Set<string>();

       const assignPos = (id: string | undefined, pos: number) => {
         if (id && !assignedIds.has(id)) {
           if (newResults[id]) newResults[id].position = pos;
           assignedIds.add(id);
         }
       };

       assignPos(winner, 1);
       assignPos(runnerUp, 2);
       sortedSFLosers.forEach(id => assignPos(id, 3));
       sortedQFLosers.forEach(id => assignPos(id, 5));

       // Assign remaining (eliminated in regular phase)
       const numAdvanced = tournament.format === 'KNOCKOUT_TOP_4' ? 4 : 8;
       const eliminatedPos = numAdvanced + 1;
       
       sortedByPhasePoints.forEach((p) => {
         if (!assignedIds.has(p.id)) {
           assignPos(p.id, eliminatedPos);
         }
       });
    }

    setLocalResults(newResults);
    toast.success('Posiciones calculadas automáticamente');
  };

  const autoCalculatePoints = () => {
    const isGS = tournament.type === 'GRAND_SLAM';
    const basePoints = isGS ? 2000 : 1000;
    
    const getPointsForPosition = (pos: number) => {
      if (pos === 1) return basePoints;
      if (pos === 2) return Math.round(basePoints * 0.6);
      if (pos === 3 || pos === 4) return Math.round(basePoints * 0.36);
      if (pos >= 5 && pos <= 8) {
        if (tournament.format === 'KNOCKOUT_TOP_4') return 0;
        return Math.round(basePoints * 0.18);
      }
      if (pos >= 9 && pos <= 16) {
        if (hasPhases) return 0;
        return Math.round(basePoints * 0.09);
      }
      if (pos > 16) {
        if (hasPhases) return 0;
        return 10;
      }
      return 0;
    };

    const updated = { ...localResults };
    Object.keys(updated).forEach(pId => {
      const pos = updated[pId].position;
      if (pos !== '' && Number(pos) > 0) {
        updated[pId].points = getPointsForPosition(Number(pos));
      }
    });
    setLocalResults(updated);
  };

  const handleInputChange = (participantId: string, field: 'position' | 'points' | 'phasePoints' | 'plenos' | 'group' | 'participates', value: any) => {
    let finalValue = value;
    if (['position', 'points', 'phasePoints', 'plenos'].includes(field)) {
      finalValue = value === '' ? '' : Number(value);
    }
    setLocalResults(prev => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        [field]: finalValue
      }
    }));
  };

  const handleMatchUpdate = (matchId: string, updates: Partial<Match>) => {
    setLocalMatches(prev => {
      let newMatches = prev.map(m => m.id === matchId ? { ...m, ...updates } : m);
      const updatedMatch = newMatches.find(m => m.id === matchId);
      
      if (!updatedMatch) return newMatches;

      // Auto-determine winner if scores are present and different
      if (('score1' in updates || 'score2' in updates) && updatedMatch.score1 !== undefined && updatedMatch.score2 !== undefined) {
        if (updatedMatch.score1 > updatedMatch.score2) {
          updatedMatch.winnerId = updatedMatch.participant1Id;
        } else if (updatedMatch.score2 > updatedMatch.score1) {
          updatedMatch.winnerId = updatedMatch.participant2Id;
        } else {
          updatedMatch.winnerId = undefined; 
        }
      }

      // Auto-advance winner to next round
      if ('winnerId' in updates || 'score1' in updates || 'score2' in updates) {
         const winner = updatedMatch.winnerId;
         let nextRound = '';
         let nextMatchIndex = 0;
         let isParticipant1 = true;

         if (updatedMatch.round === 'QF') {
           nextRound = 'SF';
           nextMatchIndex = Math.floor(updatedMatch.matchIndex / 2);
           isParticipant1 = updatedMatch.matchIndex % 2 === 0;
         } else if (updatedMatch.round === 'SF') {
           nextRound = 'F';
           nextMatchIndex = 0;
           isParticipant1 = updatedMatch.matchIndex === 0;
         }

         if (nextRound) {
           const nextMatch = newMatches.find(m => m.round === nextRound && m.matchIndex === nextMatchIndex);
           if (nextMatch) {
             newMatches = newMatches.map(m => {
               if (m.id === nextMatch.id) {
                 return {
                   ...m,
                   ...(isParticipant1 ? { participant1Id: winner } : { participant2Id: winner })
                 };
               }
               return m;
             });
           }
         }
      }
      return newMatches;
    });
  };

  const sortedByPhasePoints = [...participants].filter(p => localResults[p.id]?.participates).sort((a, b) => {
    if (tournament.format === 'GROUPS') {
      const gA = localResults[a.id]?.group || 'Z';
      const gB = localResults[b.id]?.group || 'Z';
      if (gA !== gB) return gA.localeCompare(gB);
    }
    
    const pA = Number(localResults[a.id]?.phasePoints) || 0;
    const pB = Number(localResults[b.id]?.phasePoints) || 0;
    if (pB !== pA) return pB - pA;
    
    const plA = Number(localResults[a.id]?.plenos) || 0;
    const plB = Number(localResults[b.id]?.plenos) || 0;
    return plB - plA;
  });

  const autoCompleteBracket = () => {
    if (tournament.format === 'KNOCKOUT_TOP_4') {
      if (sortedByPhasePoints.length < 4) {
        toast.error('Se necesitan al menos 4 participantes para armar las semifinales');
        return;
      }
      const top4 = sortedByPhasePoints.slice(0, 4);
      // 1 vs 4, 2 vs 3
      const sfMatchups = [
        [top4[0], top4[3]], // 1 vs 4
        [top4[1], top4[2]], // 2 vs 3
      ];
      setLocalMatches(prev => {
        const newMatches = [...prev];
        sfMatchups.forEach((matchup, index) => {
          const matchIndex = newMatches.findIndex(m => m.round === 'SF' && m.matchIndex === index);
          if (matchIndex !== -1) {
            newMatches[matchIndex] = {
              ...newMatches[matchIndex],
              participant1Id: matchup[0].id,
              participant2Id: matchup[1].id
            };
          }
        });
        return newMatches;
      });
      toast.success('Cuadro autocompletado con los 4 mejores');
      return;
    }

    if (sortedByPhasePoints.length < 8) {
      toast.error('Se necesitan al menos 8 participantes para armar los cuartos de final');
      return;
    }

    let qfMatchups: any[] = [];

    if (tournament.format === 'GROUPS') {
      const groupA = sortedByPhasePoints.filter(p => localResults[p.id]?.group === 'A');
      const groupB = sortedByPhasePoints.filter(p => localResults[p.id]?.group === 'B');
      
      if (groupA.length < 4 || groupB.length < 4) {
        toast.error('Se necesitan al menos 4 participantes en cada grupo (A y B)');
        return;
      }

      // 1A vs 4B, 2B vs 3A, 1B vs 4A, 2A vs 3B
      qfMatchups = [
        [groupA[0], groupB[3]], // 1A vs 4B
        [groupB[1], groupA[2]], // 2B vs 3A
        [groupB[0], groupA[3]], // 1B vs 4A
        [groupA[1], groupB[2]], // 2A vs 3B
      ];
    } else {
      const top8 = sortedByPhasePoints.slice(0, 8);
      // 1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6
      qfMatchups = [
        [top8[0], top8[7]], // 1 vs 8
        [top8[3], top8[4]], // 4 vs 5
        [top8[1], top8[6]], // 2 vs 7
        [top8[2], top8[5]], // 3 vs 6
      ];
    }

    setLocalMatches(prev => {
      const newMatches = [...prev];
      qfMatchups.forEach((matchup, index) => {
        const matchIndex = newMatches.findIndex(m => m.round === 'QF' && m.matchIndex === index);
        if (matchIndex !== -1) {
          newMatches[matchIndex] = {
            ...newMatches[matchIndex],
            participant1Id: matchup[0].id,
            participant2Id: matchup[1].id
          };
        }
      });
      return newMatches;
    });
    
    toast.success('Cuadro autocompletado con los 8 mejores');
  };

  const hasPhases = tournament.format === 'KNOCKOUT' || tournament.format === 'KNOCKOUT_TOP_4' || tournament.format === 'GROUPS';

  const nonParticipating = participants.filter(p => !(localResults[p.id]?.participates ?? true));
  const displayParticipants = [...sortedByPhasePoints, ...nonParticipating];

  const renderPhaseTable = (participantsToRender: Participant[], groupName?: string) => (
    <div className="mb-8 last:mb-0">
      {groupName && <h3 className="text-lg font-semibold mb-3 text-emerald-800">Grupo {groupName}</h3>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">Pos</TableHead>
            <TableHead>Participante</TableHead>
            <TableHead className="w-24 text-center">Participa</TableHead>
            {tournament.format === 'GROUPS' && <TableHead className="w-24 text-center">Grupo</TableHead>}
            <TableHead className="w-32 text-center">Puntos Fase</TableHead>
            <TableHead className="w-24 text-center">Plenos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participantsToRender.map((p) => {
            const isParticipating = localResults[p.id]?.participates ?? true;
            const rankIndex = sortedByPhasePoints.findIndex(sp => sp.id === p.id);
            
            let isQualifying = false;
            let displayRank = '-';
            
            if (isParticipating && rankIndex !== -1) {
              if (tournament.format === 'GROUPS') {
                const group = localResults[p.id]?.group;
                if (group === 'A' || group === 'B') {
                  const groupRank = sortedByPhasePoints.filter(sp => localResults[sp.id]?.group === group).findIndex(sp => sp.id === p.id);
                  isQualifying = groupRank < 4;
                  displayRank = (groupRank + 1).toString();
                }
              } else if (tournament.format === 'KNOCKOUT_TOP_4') {
                isQualifying = rankIndex < 4;
                displayRank = (rankIndex + 1).toString();
              } else {
                isQualifying = rankIndex < 8;
                displayRank = (rankIndex + 1).toString();
              }
            }
            
            return (
              <TableRow key={p.id} className={isQualifying ? "bg-emerald-50/30" : !isParticipating ? "opacity-50" : ""}>
                <TableCell className="font-medium text-neutral-500 text-center">
                  {displayRank}
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 accent-emerald-600"
                    checked={isParticipating}
                    onChange={(e) => handleInputChange(p.id, 'participates', e.target.checked)}
                  />
                </TableCell>
                {tournament.format === 'GROUPS' && (
                  <TableCell>
                    <select 
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={localResults[p.id]?.group ?? ''}
                      onChange={(e) => handleInputChange(p.id, 'group', e.target.value)}
                      disabled={!isParticipating}
                    >
                      <option value="">-</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                    </select>
                  </TableCell>
                )}
                <TableCell>
                  <Input 
                    type="number" 
                    className="text-center font-bold text-emerald-700"
                    value={localResults[p.id]?.phasePoints ?? ''}
                    onChange={(e) => handleInputChange(p.id, 'phasePoints', e.target.value)}
                    placeholder="Pts"
                    disabled={!isParticipating}
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    className="text-center"
                    value={localResults[p.id]?.plenos ?? ''}
                    onChange={(e) => handleInputChange(p.id, 'plenos', e.target.value)}
                    placeholder="Plenos"
                    disabled={!isParticipating}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tournaments')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{tournament.name}</h1>
              <Badge variant={tournament.status === 'COMPLETED' ? 'default' : 'secondary'} className={tournament.status === 'COMPLETED' ? 'bg-emerald-600' : ''}>
                {tournament.status === 'COMPLETED' ? 'Completado' : tournament.status === 'IN_PROGRESS' ? 'En Curso' : 'Próximo'}
              </Badge>
            </div>
            <p className="text-neutral-500">
              {tournament.year} • {tournament.type === 'GRAND_SLAM' ? 'Grand Slam' : tournament.type === 'MASTER_1000' ? 'Master 1000' : 'Otro'} • {tournament.format === 'KNOCKOUT' ? 'Fase Regular + Playoffs (Top 8)' : tournament.format === 'KNOCKOUT_TOP_4' ? 'Fase Regular + Playoffs (Top 4)' : tournament.format === 'GROUPS' ? 'Grupos + Playoffs' : 'Tabla General'}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" />
          Guardar Todo
        </Button>
      </div>

      <Tabs defaultValue={hasPhases ? "phase" : "final"} className="w-full">
        <TabsList className="mb-4">
          {hasPhases && <TabsTrigger value="phase">Fase Regular / Grupos</TabsTrigger>}
          {hasPhases && <TabsTrigger value="playoffs">Playoffs</TabsTrigger>}
          <TabsTrigger value="final">Clasificación Final</TabsTrigger>
        </TabsList>

        {hasPhases && (
          <TabsContent value="phase">
            <Card>
              <CardHeader>
                <CardTitle>Puntos de Fase</CardTitle>
                <CardDescription>Ingresa los puntos obtenidos en la fase regular o de grupos para ver quién clasifica.</CardDescription>
              </CardHeader>
              <CardContent>
                {tournament.format === 'GROUPS' ? (
                  <div className="space-y-8">
                    {renderPhaseTable(displayParticipants.filter(p => localResults[p.id]?.group === 'A'), 'A')}
                    {renderPhaseTable(displayParticipants.filter(p => localResults[p.id]?.group === 'B'), 'B')}
                    {renderPhaseTable(displayParticipants.filter(p => localResults[p.id]?.group !== 'A' && localResults[p.id]?.group !== 'B'), 'Sin Asignar')}
                  </div>
                ) : (
                  renderPhaseTable(displayParticipants)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {hasPhases && (
          <TabsContent value="playoffs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cuadro de Playoffs</CardTitle>
                  <CardDescription>Arma los cruces y define los ganadores de cada llave.</CardDescription>
                </div>
                <Button variant="outline" onClick={autoCompleteBracket} title="Autocompletar con los mejores de la fase regular">
                  Auto-completar Cuadro
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Bracket matches={localMatches} participants={participants} onMatchUpdate={handleMatchUpdate} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="final">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Resultados Finales</CardTitle>
                <CardDescription>Ingresa la posición final y los puntos ATP obtenidos por cada participante.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { autoCalculateFinalPositions(); autoCalculatePoints(); }} title="Calcular posiciones y puntos automáticamente">
                  <Calculator className="w-4 h-4 mr-2" />
                  Auto-Clasificación
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  No hay participantes registrados en el sistema.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participante</TableHead>
                      <TableHead className="w-32 text-center">Posición Final</TableHead>
                      <TableHead className="w-32 text-center">Puntos ATP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants
                      .filter(p => localResults[p.id]?.participates !== false)
                      .sort((a, b) => {
                        const posA = Number(localResults[a.id]?.position) || 999;
                        const posB = Number(localResults[b.id]?.position) || 999;
                        return posA - posB;
                      })
                      .map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            min="1"
                            className="text-center"
                            value={localResults[p.id]?.position ?? ''}
                            onChange={(e) => handleInputChange(p.id, 'position', e.target.value)}
                            placeholder="Ej: 1"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            min="0"
                            className="text-center font-bold text-emerald-700"
                            value={localResults[p.id]?.points ?? ''}
                            onChange={(e) => handleInputChange(p.id, 'points', e.target.value)}
                            placeholder="Ej: 2000"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
