import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  if (format === 'REGULAR_SEASON' || format === 'GENERAL_TABLE') {
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
      <DialogContent className="max-w-7xl w-[96vw] max-h-[92vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
        <DialogHeader className="p-3 md:p-4 bg-emerald-900 text-white shrink-0">
          <DialogTitle className="text-sm md:text-base font-bold">Historial: {participantName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-2 md:p-4 bg-white">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
              <p className="text-sm italic">No hay registros de torneos finalizados.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden border-neutral-200 w-full shadow-sm">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-neutral-50 hover:bg-neutral-50 border-b">
                    <TableHead className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Torneo</TableHead>
                    <TableHead className="h-8 px-3 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-500 w-20">Año</TableHead>
                    <TableHead className="h-8 px-3 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-500 w-24">Posición</TableHead>
                    <TableHead className="h-8 px-3 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-500 w-40">Ronda</TableHead>
                    <TableHead className="h-8 px-3 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-500 w-24">Puntos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h, i) => {
                    const isParticipating = h.participates !== false;
                    return (
                      <TableRow key={i} className={cn("group transition-colors border-b last:border-0", !isParticipating ? "bg-neutral-50/50 opacity-60" : "hover:bg-emerald-50/20")}>
                        <TableCell className="py-1.5 px-3 font-medium text-xs text-neutral-900">
                          {h.tournament!.name}
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-center text-xs text-neutral-600">
                          {h.tournament!.year}
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-center">
                          {!isParticipating ? (
                            <span className="text-neutral-300 text-[10px]">—</span>
                          ) : (
                            <div className="inline-flex items-center justify-center">
                              {h.position === 1 ? (
                                <Badge className="bg-yellow-500 hover:bg-yellow-500 text-[9px] h-4 px-1.5 uppercase font-bold border-none shadow-none">1º</Badge>
                              ) : (
                                <span className="font-bold text-xs text-neutral-700">{h.position}º</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-center">
                          {!isParticipating ? (
                            <span className="text-[9px] text-neutral-400 italic">N/P</span>
                          ) : (
                            <span className="text-[10px] text-neutral-600">
                              {h.tournament!.format !== 'GENERAL_TABLE' ? getRoundName(h.position, h.tournament!.format) : 'Final'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-right">
                          <span className={cn("font-bold text-xs", isParticipating ? "text-emerald-700" : "text-neutral-400")}>
                            {isParticipating ? h.points.toLocaleString() : 0}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        
        <div className="p-2 bg-neutral-50 border-t flex justify-end shrink-0">
          <Button onClick={() => onOpenChange(false)} size="sm" className="bg-emerald-800 hover:bg-emerald-900 h-8 text-xs">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
