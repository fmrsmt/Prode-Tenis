import { useMemo, useState } from 'react';
import { useProdeStore } from '@/store/useProdeStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal } from 'lucide-react';

export default function History() {
  const { tournaments, results, participants } = useProdeStore();
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  const years = useMemo(() => {
    const y = new Set<number>(tournaments.map(t => t.year));
    return Array.from(y).sort((a, b) => b - a);
  }, [tournaments]);

  const historyData = useMemo(() => {
    let filtered = tournaments.filter(t => t.status === 'COMPLETED');
    if (selectedYear !== 'ALL') {
      filtered = filtered.filter(t => t.year === parseInt(selectedYear));
    }

    // Sort by newest first (year descending, then order descending, then createdAt descending)
    filtered.sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) {
        return orderB - orderA;
      }
      return b.createdAt - a.createdAt;
    });

    return filtered.map(t => {
      const tResults = results.filter(r => r.tournamentId === t.id);
      
      // Find winners (position 1) - can be multiple for shared champions
      const winnerResults = tResults.filter(r => r.position === 1);
      const runnerUpResults = tResults.filter(r => r.position === 2);

      const winners = winnerResults.map(wr => participants.find(p => p.id === wr.participantId)).filter(Boolean);
      const runnersUp = runnerUpResults.map(rr => participants.find(p => p.id === rr.participantId)).filter(Boolean);

      return {
        tournament: t,
        winners,
        runnersUp,
        winnerPoints: winnerResults[0]?.points
      };
    });
  }, [tournaments, results, participants, selectedYear]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Historial de Torneos</h1>
          <p className="text-neutral-500">Palmarés y resultados históricos</p>
        </div>
        <div className="w-48">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los años" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los años</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>Temporada {year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Torneos Completados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Año</TableHead>
                <TableHead>Torneo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Campeón</TableHead>
                <TableHead className="hidden sm:table-cell">Subcampeón</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                    No hay torneos completados en el historial.
                  </TableCell>
                </TableRow>
              ) : (
                historyData.map((data) => (
                  <TableRow key={data.tournament.id}>
                    <TableCell className="font-medium text-neutral-500">{data.tournament.year}</TableCell>
                    <TableCell className="font-bold">{data.tournament.name}</TableCell>
                    <TableCell>
                      {data.tournament.type === 'GRAND_SLAM' ? 'Grand Slam' : 
                       data.tournament.type === 'MASTER_1000' ? 'Master 1000' : 'Otro'}
                    </TableCell>
                    <TableCell>
                      {data.winners.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {data.winners.map((winner, idx) => (
                            <div key={winner!.id} className="flex items-center gap-2 font-semibold text-emerald-700">
                              <Trophy className="w-4 h-4 text-yellow-500" />
                              {winner!.name}
                              {idx === 0 && <span className="text-xs text-neutral-400 font-normal">({data.winnerPoints} pts)</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-400 italic">Sin datos</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {data.runnersUp.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {data.runnersUp.map(runnerUp => (
                            <div key={runnerUp!.id} className="flex items-center gap-2 text-neutral-600">
                              <Medal className="w-4 h-4 text-neutral-400" />
                              {runnerUp!.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-400 italic">-</span>
                      )}
                    </TableCell>
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
