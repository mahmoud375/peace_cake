import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import GameHostPage from "./pages/GameHostPage";
import LandingPage from "./pages/LandingPage";
import ProfileSelectPage from "./pages/ProfileSelectPage";
import QuizEditorPage from "./pages/QuizEditorPage";
import { useProfileStore } from "./store/profileStore";

const App = () => {
  const { selectedProfile, fetchProfiles, isGameInitialized } = useProfileStore((state) => ({
    selectedProfile: state.selectedProfile,
    fetchProfiles: state.fetchProfiles,
    isGameInitialized: state.isGameInitialized,
  }));

  useEffect(() => {
    if (!isGameInitialized) return;
    fetchProfiles().catch(() => null);
  }, [fetchProfiles, isGameInitialized]);

  if (!isGameInitialized) {
    return <LandingPage />;
  }

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
