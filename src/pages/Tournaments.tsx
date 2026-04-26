import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProdeStore } from '@/store/useProdeStore';
import { TournamentType, TournamentFormat, TournamentStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, ChevronRight, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useReadOnly } from '@/hooks/useReadOnly';

const PREDEFINED_TOURNAMENTS = [
  { name: 'Australian Open', type: 'GRAND_SLAM', format: 'KNOCKOUT' },
  { name: 'Roland Garros', type: 'GRAND_SLAM', format: 'KNOCKOUT' },
  { name: 'Wimbledon', type: 'GRAND_SLAM', format: 'KNOCKOUT' },
  { name: 'US Open', type: 'GRAND_SLAM', format: 'KNOCKOUT' },
  { name: 'Indian Wells', type: 'MASTER_1000', format: 'GROUPS' },
  { name: 'Miami', type: 'MASTER_1000', format: 'GROUPS' },
  { name: 'Monte Carlo', type: 'MASTER_1000', format: 'GROUPS' },
  { name: 'Madrid', type: 'MASTER_1000', format: 'GROUPS' },
  { name: 'Rome', type: 'MASTER_1000', format: 'GROUPS' },
  { name: 'Canada', type: 'MASTER_1000', format: 'GROUPS' },
  { name: 'Cincinnati', type: 'MASTER_1000', format: 'GROUPS' },
  { name: 'Shanghai', type: 'MASTER_1000', format: 'GROUPS' },
  { name: 'Paris', type: 'MASTER_1000', format: 'GROUPS' },
  { name: 'ATP Finals', type: 'OTHER', format: 'GROUPS' },
  { name: 'Copa Davis', type: 'OTHER', format: 'GROUPS' },
];

export default function Tournaments() {
  const { tournaments, addTournament, updateTournament, deleteTournament, participants, results, matches } = useProdeStore();
  const navigate = useNavigate();
  const { isReadOnly } = useReadOnly();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
  
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    name: '',
    year: currentYear.toString(),
    type: 'GRAND_SLAM' as TournamentType,
    format: 'KNOCKOUT' as TournamentFormat,
    status: 'UPCOMING' as TournamentStatus,
    excludeFromRanking: false,
    order: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const payload = {
      name: formData.name.trim(),
      year: parseInt(formData.year),
      type: formData.type,
      format: formData.format,
      status: formData.status,
      excludeFromRanking: formData.excludeFromRanking,
      order: formData.order,
    };

    if (editingId) {
      updateTournament(editingId, payload);
    } else {
      addTournament(payload);
    }
    
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      year: currentYear.toString(),
      type: 'GRAND_SLAM',
      format: 'KNOCKOUT',
      status: 'UPCOMING',
      excludeFromRanking: false,
      order: 1,
    });
  };

  const openEdit = (t: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(t.id);
    setFormData({
      name: t.name,
      year: t.year.toString(),
      type: t.type,
      format: t.format,
      status: t.status,
      excludeFromRanking: t.excludeFromRanking || false,
      order: t.order || 1,
    });
    setIsOpen(true);
  };

  const openAdd = () => {
    resetForm();
    setIsOpen(true);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'GRAND_SLAM': return 'Grand Slam';
      case 'MASTER_1000': return 'Master 1000';
      default: return 'Otro';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge variant="default" className="bg-emerald-600">Completado</Badge>;
      case 'IN_PROGRESS': return <Badge variant="secondary" className="bg-amber-100 text-amber-800">En Curso</Badge>;
      case 'UPCOMING': return <Badge variant="outline">Próximo</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Torneos</h1>
          <p className="text-neutral-500">Gestiona los torneos del prode</p>
        </div>
        <div className="flex gap-2">
          {!isReadOnly && (
            <>
              <Button variant="outline" onClick={handleDownloadBackup} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <Download className="w-4 h-4 mr-2" />
                Respaldar
              </Button>
              <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger render={
                  <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo
                  </Button>
                } />
                <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Torneo' : 'Nuevo Torneo'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {!editingId && (
                <div className="space-y-2">
                  <Label>Cargar desde plantilla (Opcional)</Label>
                  <Select onValueChange={(v) => {
                    const template = PREDEFINED_TOURNAMENTS.find(t => t.name === v);
                    if (template) {
                      setFormData({
                        ...formData,
                        name: template.name,
                        type: template.type as TournamentType,
                        format: template.format as TournamentFormat
                      });
                    }
                  }}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar torneo..." /></SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_TOURNAMENTS.map(t => (
                        <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Torneo</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="Ej: Roland Garros"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Año</Label>
                  <Input 
                    type="number" 
                    value={formData.year} 
                    onChange={(e) => setFormData({...formData, year: e.target.value})} 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Orden en el año</Label>
                  <Input 
                    type="number" 
                    value={formData.order} 
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})} 
                    placeholder="Ej: 1, 2, 3..."
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(v: TournamentType) => setFormData({...formData, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GRAND_SLAM">Grand Slam (2000 pts)</SelectItem>
                      <SelectItem value="MASTER_1000">Master 1000 (1000 pts)</SelectItem>
                      <SelectItem value="OTHER">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Formato</Label>
                  <Select value={formData.format} onValueChange={(v: TournamentFormat) => setFormData({...formData, format: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KNOCKOUT">Fase Regular + Playoffs (Top 8)</SelectItem>
                      <SelectItem value="KNOCKOUT_TOP_4">Fase Regular + Playoffs (Top 4)</SelectItem>
                      <SelectItem value="GROUPS">Grupos + Playoffs</SelectItem>
                      <SelectItem value="GENERAL_TABLE">Tabla General</SelectItem>
                      <SelectItem value="REGULAR_SEASON">Fase Regular (Solo Puntos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={formData.status} onValueChange={(v: TournamentStatus) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPCOMING">Próximo</SelectItem>
                    <SelectItem value="IN_PROGRESS">En Curso</SelectItem>
                    <SelectItem value="COMPLETED">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="excludeFromRanking"
                  className="w-4 h-4 accent-emerald-600 rounded border-gray-300"
                  checked={formData.excludeFromRanking}
                  onChange={(e) => setFormData({...formData, excludeFromRanking: e.target.checked})}
                />
                <Label htmlFor="excludeFromRanking" className="font-normal cursor-pointer">
                  Excluir del Ranking (No suma puntos)
                </Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </>
        )}
      </div>
    </div>

    <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Torneo</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Año</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">{isReadOnly ? 'Detalle' : 'Acciones'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                    No hay torneos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                [...tournaments].sort((a, b) => {
                  if (b.year !== a.year) {
                    return b.year - a.year;
                  }
                  const orderA = a.order ?? 0;
                  const orderB = b.order ?? 0;
                  if (orderA !== orderB) {
                    return orderB - orderA; // Descending order within the year
                  }
                  return b.createdAt - a.createdAt;
                }).map((t) => (
                  <TableRow 
                    key={t.id} 
                    className="cursor-pointer hover:bg-neutral-50 transition-colors"
                    onClick={() => navigate(`/tournaments/${t.id}`)}
                  >
                    <TableCell className="font-medium">
                      {t.name}
                      <div className="text-xs text-neutral-500 md:hidden">{getTypeLabel(t.type)}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-neutral-600">{getTypeLabel(t.type)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{t.year}</TableCell>
                    <TableCell>{getStatusBadge(t.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!isReadOnly && (
                          <>
                            <Button variant="ghost" size="icon" onClick={(e) => openEdit(t, e)}>
                              <Edit className="w-4 h-4 text-neutral-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('¿Estás seguro de eliminar este torneo? Se borrarán sus resultados.')) {
                                deleteTournament(t.id);
                              }
                            }}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
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
