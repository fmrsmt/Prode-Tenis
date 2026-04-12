import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tournament } from '@/types';

export const getRoundName = (pos: number, format: string) => {
  if (pos === 1) return 'Campeón';
  if (pos === 2) return 'Finalista';
  if (pos === 3 || pos === 4) return 'Semifinalista';
  
  if (format === 'KNOCKOUT') {
    if (pos >= 5 && pos <= 8) return 'Cuartos de Final';
    return 'Eliminado en Fase Regular';
  }
  if (format === 'KNOCKOUT_TOP_4') {
    if (pos >= 5) return 'Eliminado en Fase Regular';
    return 'Fase Regular';
  }
  if (format === 'GROUPS') {
    if (pos >= 5 && pos <= 8) return 'Cuartos de Final';
    return 'Fase de Grupos';
  }
  if (format === 'REGULAR_SEASON') {
    return 'Fase Regular';
  }
  return 'Fase Regular';
};

interface ParticipantHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participantName?: string;
  history: any[];
}

export function ParticipantHistoryDialog({ isOpen, onOpenChange, participantName, history }: ParticipantHistoryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de {participantName}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {history.length === 0 ? (
            <p className="text-center text-neutral-500 py-8">No hay torneos registrados para este participante.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Torneo</TableHead>
                  <TableHead className="text-center">Año</TableHead>
                  <TableHead className="text-center">Posición</TableHead>
                  <TableHead className="text-center">Ronda Alcanzada</TableHead>
                  <TableHead className="text-right">Puntos ATP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{h.tournament!.name}</TableCell>
                    <TableCell className="text-center">{h.tournament!.year}</TableCell>
                    <TableCell className="text-center font-bold">
                      {h.position === 1 ? <Badge className="bg-yellow-500">1º</Badge> : `${h.position}º`}
                    </TableCell>
                    <TableCell className="text-center text-neutral-600">
                      {h.tournament!.format !== 'GENERAL_TABLE' ? getRoundName(h.position, h.tournament!.format) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-700">{h.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
