import { useMemo } from 'react';
import { useProdeStore } from '@/store/useProdeStore';
import { calculateTitlesRanking } from '@/lib/ranking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star } from 'lucide-react';

export default function Palmares() {
  const { participants, tournaments, results } = useProdeStore();

  const titlesRanking = useMemo(() => {
    return calculateTitlesRanking(participants, tournaments, results);
  }, [participants, tournaments, results]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Palmarés</h1>
          <p className="text-neutral-500">Ranking histórico de títulos</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking Histórico de Títulos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Pos</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead className="text-center font-bold">Total</TableHead>
                <TableHead className="text-center text-amber-600">Grand Slam</TableHead>
                <TableHead className="text-center text-blue-600">Master 1000</TableHead>
                <TableHead className="text-center text-neutral-500">Otros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {titlesRanking.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                    Aún no hay campeones registrados.
                  </TableCell>
                </TableRow>
              ) : (
                titlesRanking.map((entry, index) => (
                  <TableRow key={entry.participant.id}>
                    <TableCell className="text-center font-semibold">
                      {index === 0 ? <Star className="w-5 h-5 text-yellow-500 mx-auto fill-yellow-500" /> : index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{entry.participant.name}</TableCell>
                    <TableCell className="text-center font-bold text-lg">{entry.total}</TableCell>
                    <TableCell className="text-center font-semibold text-amber-600">{entry.grandSlams}</TableCell>
                    <TableCell className="text-center font-semibold text-blue-600">{entry.masters1000}</TableCell>
                    <TableCell className="text-center text-neutral-500">{entry.others}</TableCell>
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
