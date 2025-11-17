import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import GameHostPage from "./pages/GameHostPage";
import ProfileSelectPage from "./pages/ProfileSelectPage";
import QuizEditorPage from "./pages/QuizEditorPage";
import { useProfileStore } from "./store/profileStore";

const App = () => {
  const selectedProfile = useProfileStore((state) => state.selectedProfile);
  const fetchProfiles = useProfileStore((state) => state.fetchProfiles);

  useEffect(() => {
    fetchProfiles().catch(() => null);
  }, [fetchProfiles]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProfileSelectPage />} />
        <Route
          path="/dashboard"
          element={selectedProfile ? <DashboardPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/quizzes/:quizId/edit"
          element={selectedProfile ? <QuizEditorPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/quizzes/:quizId/host"
          element={selectedProfile ? <GameHostPage /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
