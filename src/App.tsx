import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Ranking from './pages/Ranking';
import Palmares from './pages/Palmares';
import Participants from './pages/Participants';
import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail';
import History from './pages/History';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Ranking />} />
          <Route path="palmares" element={<Palmares />} />
          <Route path="participants" element={<Participants />} />
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="tournaments/:id" element={<TournamentDetail />} />
          <Route path="history" element={<History />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
