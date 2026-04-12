import React, { useState } from 'react';
import { useProdeStore } from '@/store/useProdeStore';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UserPlus, Trash2, Edit, History as HistoryIcon } from 'lucide-react';
import { ParticipantHistoryDialog } from '@/components/ParticipantHistoryDialog';

export default function Participants() {
  const { participants, tournaments, results, addParticipant, updateParticipant, deleteParticipant } = useProdeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      updateParticipant(editingId, { name: name.trim() });
    } else {
      addParticipant({ name: name.trim() });
    }
    
    setIsOpen(false);
    setName('');
    setEditingId(null);
  };

  const openEdit = (p: { id: string, name: string }) => {
    setEditingId(p.id);
    setName(p.name);
    setIsOpen(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setIsOpen(true);
  };

  const openHistory = (p: { id: string }) => {
    setViewingHistoryId(p.id);
    setIsHistoryOpen(true);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Participantes</h1>
          <p className="text-neutral-500">Administra los jugadores del prode</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Participante' : 'Nuevo Participante'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ej: Juan Pérez"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ParticipantHistoryDialog 
        isOpen={isHistoryOpen} 
        onOpenChange={setIsHistoryOpen} 
        participantName={viewingParticipant?.name}
        history={participantHistory}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-32 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-neutral-500">
                    No hay participantes registrados.
                  </TableCell>
                </TableRow>
              ) : (
                participants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openHistory(p)} title="Ver Historial">
                          <HistoryIcon className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Editar">
                          <Edit className="w-4 h-4 text-neutral-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          if (confirm('¿Estás seguro de eliminar este participante?')) {
                            deleteParticipant(p.id);
                          }
                        }} title="Eliminar">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
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
