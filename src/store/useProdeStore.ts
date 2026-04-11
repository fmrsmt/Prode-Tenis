import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProdeStore, Participant, Tournament, Result, Match } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useProdeStore = create<ProdeStore>()(
  persist(
    (set) => ({
      participants: [],
      tournaments: [],
      results: [],
      matches: [],

      addParticipant: (participant) =>
        set((state) => ({
          participants: [...state.participants, { ...participant, id: generateId() }],
        })),

      updateParticipant: (id, updatedFields) =>
        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === id ? { ...p, ...updatedFields } : p
          ),
        })),

      deleteParticipant: (id) =>
        set((state) => ({
          participants: state.participants.filter((p) => p.id !== id),
          results: state.results.filter((r) => r.participantId !== id),
        })),

      addTournament: (tournament) =>
        set((state) => ({
          tournaments: [
            ...state.tournaments,
            { ...tournament, id: generateId(), createdAt: Date.now() },
          ],
        })),

      updateTournament: (id, updatedFields) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === id ? { ...t, ...updatedFields } : t
          ),
        })),

      deleteTournament: (id) =>
        set((state) => ({
          tournaments: state.tournaments.filter((t) => t.id !== id),
          results: state.results.filter((r) => r.tournamentId !== id),
          matches: state.matches.filter((m) => m.tournamentId !== id),
        })),

      saveResults: (tournamentId, newResults) =>
        set((state) => {
          const filteredResults = state.results.filter(
            (r) => r.tournamentId !== tournamentId
          );
          const resultsToAdd = newResults.map((r) => ({
            ...r,
            tournamentId,
          }));
          return {
            results: [...filteredResults, ...resultsToAdd],
          };
        }),

      saveMatches: (tournamentId, newMatches) =>
        set((state) => {
          const filteredMatches = state.matches.filter(
            (m) => m.tournamentId !== tournamentId
          );
          const matchesToAdd = newMatches.map((m) => ({
            ...m,
            tournamentId,
          }));
          return {
            matches: [...filteredMatches, ...matchesToAdd],
          };
        }),
    }),
    {
      name: 'prode-tenis-storage',
    }
  )
);
