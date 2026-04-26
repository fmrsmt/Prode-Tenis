import { create } from 'zustand';
import { doc, setDoc, deleteDoc, writeBatch, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ProdeStore, Participant, Tournament, Result, Match } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useProdeStore = create<ProdeStore>()(
  (set, get) => ({
    participants: [],
    tournaments: [],
    results: [],
    matches: [],

    addParticipant: async (participant) => {
      const id = generateId();
      try {
        await setDoc(doc(db, 'participants', id), { ...participant, id });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `participants/${id}`);
      }
    },

    updateParticipant: async (id, updatedFields) => {
      try {
        await setDoc(doc(db, 'participants', id), updatedFields, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `participants/${id}`);
      }
    },

    deleteParticipant: async (id) => {
      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'participants', id));
        
        // Also delete results for this participant
        const participantResults = get().results.filter(r => r.participantId === id);
        participantResults.forEach(r => {
          batch.delete(doc(db, 'results', `${r.participantId}_${r.tournamentId}`));
        });
        
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `participants/${id}`);
      }
    },

    addTournament: async (tournament) => {
      const id = generateId();
      console.log('Guardando torneo:', { ...tournament, id });
      try {
        await setDoc(doc(db, 'tournaments', id), { 
          ...tournament, 
          id, 
          createdAt: Date.now() 
        });
        console.log('Torneo guardado exitosamente en Firebase');
      } catch (error) {
        console.error('Error al guardar torneo:', error);
        handleFirestoreError(error, OperationType.WRITE, `tournaments/${id}`);
      }
    },

    updateTournament: async (id, updatedFields) => {
      try {
        await setDoc(doc(db, 'tournaments', id), updatedFields, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `tournaments/${id}`);
      }
    },

    deleteTournament: async (id) => {
      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'tournaments', id));
        
        // Delete results
        get().results.filter(r => r.tournamentId === id).forEach(r => {
          batch.delete(doc(db, 'results', `${r.participantId}_${r.tournamentId}`));
        });
        
        // Delete matches
        get().matches.filter(m => m.tournamentId === id).forEach(m => {
          batch.delete(doc(db, 'matches', m.id));
        });
        
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `tournaments/${id}`);
      }
    },

    saveResults: async (tournamentId, newResults) => {
      try {
        const batch = writeBatch(db);
        
        // Delete old results for this tournament
        get().results.filter(r => r.tournamentId === tournamentId).forEach(r => {
          batch.delete(doc(db, 'results', `${r.participantId}_${r.tournamentId}`));
        });
        
        // Add new results
        newResults.forEach(r => {
          const resultId = `${r.participantId}_${tournamentId}`;
          // Ensure no undefined values are sent to Firestore
          const sanitizedResult = {
            ...r,
            tournamentId,
            plenos: r.plenos ?? null,
            phasePoints: r.phasePoints ?? null,
            group: r.group ?? null,
            participates: r.participates ?? true
          };
          batch.set(doc(db, 'results', resultId), sanitizedResult);
        });
        
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `results (batch for ${tournamentId})`);
      }
    },

    saveMatches: async (tournamentId, newMatches) => {
      try {
        const batch = writeBatch(db);
        
        // Delete old matches
        get().matches.filter(m => m.tournamentId === tournamentId).forEach(m => {
          batch.delete(doc(db, 'matches', m.id));
        });
        
        // Add new matches
        newMatches.forEach(m => {
          batch.set(doc(db, 'matches', m.id), { ...m, tournamentId });
        });
        
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `matches (batch for ${tournamentId})`);
      }
    },

    importData: async (data) => {
      try {
        console.log('Iniciando importación masiva...');
        const allOps: { type: 'set', ref: any, data: any }[] = [];

        data.participants?.forEach((p: any) => {
          allOps.push({ type: 'set', ref: doc(db, 'participants', p.id), data: p });
        });
        
        data.tournaments?.forEach((t: any) => {
          allOps.push({ type: 'set', ref: doc(db, 'tournaments', t.id), data: t });
        });
        
        data.results?.forEach((r: any) => {
          const sanitizedResult = {
            ...r,
            plenos: r.plenos ?? null,
            phasePoints: r.phasePoints ?? null,
            group: r.group ?? null,
            participates: r.participates ?? true
          };
          allOps.push({ type: 'set', ref: doc(db, 'results', `${r.participantId}_${r.tournamentId}`), data: sanitizedResult });
        });
        
        data.matches?.forEach((m: any) => {
          allOps.push({ type: 'set', ref: doc(db, 'matches', m.id), data: m });
        });

        console.log(`Total de operaciones a realizar: ${allOps.length}`);

        // Firebase batches have a limit of 500 operations
        const CHUNK_SIZE = 450;
        for (let i = 0; i < allOps.length; i += CHUNK_SIZE) {
          const chunk = allOps.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          
          chunk.forEach(op => {
            if (op.type === 'set') {
              batch.set(op.ref, op.data);
            }
          });
          
          console.log(`Enviando lote ${Math.floor(i / CHUNK_SIZE) + 1}...`);
          await batch.commit();
        }
        
        console.log('Importación completada con éxito');
      } catch (error) {
        console.error('Error en importData:', error);
        handleFirestoreError(error, OperationType.WRITE, 'importData');
      }
    },
  })
);
