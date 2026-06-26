import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import LobbyPage from "./pages/LobbyPage";
import QuizPage from "./pages/QuizPage";
import BattlePage from "./pages/BattlePage";
import TeamsPage from "./pages/TeamsPage";
import BossRaidPage from "./pages/BossRaidPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes — redirect to /home if already logged in */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes — redirect to /login if not authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/battle" element={<BattlePage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/boss-raid" element={<BossRaidPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;