import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import Reconnector from "./components/Reconnector";
import PublicRoute from "./routes/PublicRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import LobbyPage from "./pages/LobbyPage";
import QuizPage from "./pages/QuizPage";
import BattlePage from "./pages/BattlePage";
import TeamsPage from "./pages/TeamsPage";
import BossRaidPage from "./pages/BossRaidPage";
import QuizTeamsPage from "./pages/QuizTeamsPage";
import QuizBossRaidPage from "./pages/QuizBossRaidPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import ChatPage from "./pages/ChatPage";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import RulesPage from "./pages/RulesPage";

import CompetitiveSetupPage from "./pages/CompetitiveSetupPage";
import CompetitiveArenaPage from "./pages/CompetitiveArenaPage";
import CompetitiveResultPage from "./pages/CompetitiveResultPage";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root goes to landing */}
        <Route path="/" element={<Navigate to="/landing" replace />} />

        {/* Public pages — accessible without login */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/rules" element={<RulesPage />} />

        {/* Public routes — redirect to /home if already logged in */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes — redirect to /login if not authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Reconnector><Outlet/></Reconnector>}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/battle" element={<BattlePage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/boss-raid" element={<BossRaidPage />} />
          <Route path="/quiz-teams" element={<QuizTeamsPage />} />
          <Route path="/quiz-boss-raid" element={<QuizBossRaidPage />} />
          <Route path="/create-room" element={<CreateRoomPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Competitive Programming */}
          <Route path="/competitive/setup" element={<CompetitiveSetupPage />} />
          <Route path="/competitive/arena" element={<CompetitiveArenaPage />} />
          <Route path="/competitive/result" element={<CompetitiveResultPage />} />
          
          {/* Admin Route */}
          <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;