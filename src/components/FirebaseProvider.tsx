import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { useProdeStore } from '../store/useProdeStore';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({ user: null, loading: true });

export const useFirebase = () => useContext(FirebaseContext);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const importData = useProdeStore((state) => state.importData);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Sync Participants
    const unsubParticipants = onSnapshot(
      collection(db, 'participants'),
      (snapshot) => {
        const participants = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        useProdeStore.setState({ participants: participants as any });
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'participants')
    );

    // Sync Tournaments
    const unsubTournaments = onSnapshot(
      collection(db, 'tournaments'),
      (snapshot) => {
        const tournaments = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        useProdeStore.setState({ tournaments: tournaments as any });
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'tournaments')
    );

    // Sync Results
    const unsubResults = onSnapshot(
      collection(db, 'results'),
      (snapshot) => {
        const results = snapshot.docs.map(doc => doc.data());
        useProdeStore.setState({ results: results as any });
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'results')
    );

    // Sync Matches
    const unsubMatches = onSnapshot(
      collection(db, 'matches'),
      (snapshot) => {
        const matches = snapshot.docs.map(doc => doc.data());
        useProdeStore.setState({ matches: matches as any });
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'matches')
    );

    return () => {
      unsubParticipants();
      unsubTournaments();
      unsubResults();
      unsubMatches();
    };
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
}
