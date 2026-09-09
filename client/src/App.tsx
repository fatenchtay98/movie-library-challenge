import { Route, Routes } from 'react-router-dom';

import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { MovieLibraryPage } from './pages/MovieLibraryPage';
import { RegisterPage } from './pages/RegisterPage';
import { WatchlistPage } from './pages/WatchlistPage';

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <Navbar />
      <Routes>
        <Route path="/" element={<MovieLibraryPage />} />
        <Route path="/movies/:id" element={<MovieDetailPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
