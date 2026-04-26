import { useState, useMemo } from 'react';
import { useProdeStore } from '@/store/useProdeStore';
import { calculateRanking } from '@/lib/ranking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Download } from 'lucide-react';
import { ParticipantHistoryDialog } from '@/components/ParticipantHistoryDialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useReadOnly } from '@/hooks/useReadOnly';

export default function Ranking() {
  const { participants, tournaments, results, matches } = useProdeStore();
  const { isReadOnly } = useReadOnly();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [rankingType, setRankingType] = useState<'ATP' | 'RACE'>('ATP');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    const data = {
      participants,
      tournaments,
      results,
      matches,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prode-tenis-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Respaldo descargado correctamente');
  };

  const years = useMemo(() => {
    const y = new Set<number>(tournaments.map(t => t.year));
    y.add(currentYear);
    return Array.from(y).sort((a, b) => b - a);
  }, [tournaments, currentYear]);

  const ranking = useMemo(() => {
    return calculateRanking(participants, tournaments, results, selectedYear, rankingType);
  }, [participants, tournaments, results, selectedYear, rankingType]);

  const getParticipantHistory = () => {
    if (!viewingHistoryId) return [];
    
    const participantResults = results.filter(r => r.participantId === viewingHistoryId);
    
    return participantResults.map(r => {
      const tournament = tournaments.find(t => t.id === r.tournamentId);
      return {
        ...r,
        tournament
      };
    })
    .filter(r => r.tournament) // Only valid tournaments
    .filter(r => r.tournament!.status === 'COMPLETED' || r.participates === false) // Show completed or explicitly not participating
    .sort((a, b) => {
      // Sort by year descending, then by order descending, then by creation time descending
      if (b.tournament!.year !== a.tournament!.year) {
        return b.tournament!.year - a.tournament!.year;
      }
      const orderA = a.tournament!.order ?? 0;
      const orderB = b.tournament!.order ?? 0;
      if (orderA !== orderB) {
        return orderB - orderA;
      }
      return b.tournament!.createdAt - a.tournament!.createdAt;
    });
  };

  const participantHistory = getParticipantHistory();
  const viewingParticipant = participants.find(p => p.id === viewingHistoryId);

  const openHistory = (participantId: string) => {
    setViewingHistoryId(participantId);
    setIsHistoryOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Ranking ATP Prode</h1>
          <p className="text-neutral-500">Clasificación anual de participantes</p>
        </div>
        {!isReadOnly && (
          <Button variant="outline" onClick={handleDownloadBackup} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            <Download className="w-4 h-4 mr-2" />
            Respaldar Datos
          </Button>
        )}
      </div>

      <ParticipantHistoryDialog 
        isOpen={isHistoryOpen} 
        onOpenChange={setIsHistoryOpen} 
        participantName={viewingParticipant?.name}
        history={participantHistory}
      />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Top 100 - {selectedYear}</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={rankingType} onValueChange={(v: 'ATP' | 'RACE') => setRankingType(v)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo de Ranking" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATP">Ranking ATP (52 Semanas)</SelectItem>
                <SelectItem value="RACE">Carrera (Solo Año Actual)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Seleccionar Año" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>Año {year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Rank</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead className="text-right">Puntos</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Torneos Jugados</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Títulos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                    No hay datos suficientes para este año.
                  </TableCell>
                </TableRow>
              ) : (
                ranking.map((entry, index) => (
                  <TableRow key={entry.participant.id} className={index < 8 ? "bg-emerald-50/30" : ""}>
                    <TableCell className="text-center font-semibold">
                      {index === 0 ? <Trophy className="w-5 h-5 text-yellow-500 mx-auto" /> : 
                       index === 1 ? <Medal className="w-5 h-5 text-neutral-400 mx-auto" /> : 
                       index === 2 ? <Medal className="w-5 h-5 text-amber-600 mx-auto" /> : 
                       index + 1}
                    </TableCell>
                    <TableCell className="font-medium cursor-pointer text-emerald-700 hover:underline" onClick={() => openHistory(entry.participant.id)}>{entry.participant.name}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-700">{entry.points}</TableCell>
                    <TableCell className="text-center hidden sm:table-cell text-neutral-500">{entry.tournamentsPlayed}</TableCell>
                    <TableCell className="text-center hidden sm:table-cell text-neutral-500">{entry.titles}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
