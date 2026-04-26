import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Ranking from './pages/Ranking';
import Palmares from './pages/Palmares';
import Participants from './pages/Participants';
import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail';
import History from './pages/History';
import Settings from './pages/Settings';
import { Toaster } from '@/components/ui/sonner';

import { FirebaseProvider } from './components/FirebaseProvider';

function App() {
  return (
    <BrowserRouter>
      <FirebaseProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Ranking />} />
            <Route path="palmares" element={<Palmares />} />
            <Route path="participants" element={<Participants />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="tournaments/:id" element={<TournamentDetail />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <Toaster />
      </FirebaseProvider>
    </BrowserRouter>
  );
}

export default App;
