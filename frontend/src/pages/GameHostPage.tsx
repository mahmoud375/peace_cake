import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Scoreboard from "../components/Scoreboard";
import type { Question } from "../types/api";
import { useGameStore, type GameState } from "../store/gameStore";
import { useQuizStore, type QuizState } from "../store/quizStore";

const defaultTeamNames = ["Team 1", "Team 2"];

const GameHostPage = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const {
    selectedQuiz,
    fetchQuiz,
  } = useQuizStore((state: QuizState) => ({
    selectedQuiz: state.selectedQuiz,
    fetchQuiz: state.fetchQuiz,
  }));

  const {
    session,
    config,
    fetchConfig,
    createSession,
    startQuestion,
    resolveQuestion,
    loading,
    gameState,
    winningTeam,
    endGameAndDetermineWinner,
    resetGame,
  } = useGameStore((state: GameState) => ({
    session: state.session,
    config: state.config,
    fetchConfig: state.fetchConfig,
    createSession: state.createSession,
    startQuestion: state.startQuestion,
    resolveQuestion: state.resolveQuestion,
    loading: state.loading,
    gameState: state.gameState,
    winningTeam: state.winningTeam,
    endGameAndDetermineWinner: state.endGameAndDetermineWinner,
    resetGame: state.resetGame,
  }));

  const minTeams = config?.min_teams ?? 2;
  const maxTeams = config?.max_teams ?? 4;

  const [teamInputs, setTeamInputs] = useState<string[]>(defaultTeamNames.slice(0, minTeams));
  const [teamError, setTeamError] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [modalQuestion, setModalQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [stealMode, setStealMode] = useState(false);
  const [stealTimeLeft, setStealTimeLeft] = useState(0);
  const [pendingIncorrectTeamId, setPendingIncorrectTeamId] = useState<string | null>(null);
  const [stealTeamId, setStealTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (quizId) {
      fetchQuiz(quizId).catch(() => setTeamError("Unable to load quiz"));
    }
  }, [quizId, fetchQuiz]);

  useEffect(() => {
    fetchConfig().catch(() => null);
  }, [fetchConfig]);

  useEffect(() => {
    if (session?.teams?.length) {
      setSelectedTeamId((prev) => {
        if (prev && session.teams.some((team) => team.id === prev)) {
          return prev;
        }
        return session.teams[0].id;
      });
    }
  }, [session]);

  useEffect(() => {
    if (!revealed || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [revealed, timeLeft]);

  useEffect(() => {
    if (!stealMode || stealTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setStealTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [stealMode, stealTimeLeft]);

  const groupedQuestions = useMemo(() => {
    if (!selectedQuiz) return [];
    const map = new Map<number, Question[]>();
    selectedQuiz.questions.forEach((question) => {
      const list = map.get(question.points) ?? [];
      list.push(question);
      map.set(question.points, list);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([points, questions]) => ({
        points,
        questions: questions.sort((a, b) => (a.difficulty || "").localeCompare(b.difficulty || "")),
      }));
  }, [selectedQuiz]);

  const handleTeamChange = (index: number, value: string) => {
    setTeamInputs((prev) => prev.map((name, idx) => (idx === index ? value : name)));
  };

  const addTeam = () => {
    if (teamInputs.length >= maxTeams) return;
    setTeamInputs((prev) => [...prev, `Team ${prev.length + 1}`]);
  };

  const removeTeam = (index: number) => {
    if (teamInputs.length <= minTeams) return;
    setTeamInputs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSessionCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!quizId) return;
    const trimmed = teamInputs.map((name) => name.trim()).filter(Boolean);
    if (trimmed.length < minTeams || trimmed.length > maxTeams) {
      setTeamError(`Please provide between ${minTeams} and ${maxTeams} team names.`);
      return;
    }
    setTeamError(null);
    try {
      await createSession({ quiz_id: quizId, teams: trimmed.map((name) => ({ name })) });
    } catch (error) {
      console.error(error);
      setTeamError("Unable to start session");
    }
  };

  const handleQuestionClick = (question: Question) => {
    if (!session) {
      setTeamError("Create a session before hosting questions.");
      return;
    }
    if (session.used_question_ids.includes(question.id)) return;
    if (session.current_question_id && session.current_question_id !== question.id) {
      setQuestionError("A different question is currently active.");
      return;
    }
    setModalQuestion(question);
    setIsModalOpen(true);
    setRevealed(false);
    setTimeLeft(config?.primary_timer_seconds ?? 20);
    setStealMode(false);
    setStealTimeLeft(0);
    setPendingIncorrectTeamId(null);
    setStealTeamId(null);
    setQuestionError(null);
  };

  const closeModal = () => {
    setModalQuestion(null);
    setIsModalOpen(false);
    setRevealed(false);
    setTimeLeft(0);
    setStealMode(false);
    setStealTimeLeft(0);
    setPendingIncorrectTeamId(null);
    setStealTeamId(null);
    setQuestionError(null);
  };

  const handleStartAndReveal = async () => {
    if (!session || !modalQuestion) return;
    try {
      await startQuestion(session.id, modalQuestion.id);
      setRevealed(true);
      setTimeLeft(config?.primary_timer_seconds ?? 20);
    } catch (error) {
      console.error(error);
      setQuestionError("Unable to start timer");
    }
  };

  const finishResolution = async (payload: {
    team_id: string;
    outcome: "correct" | "incorrect";
    steal_attempt?: { team_id: string; outcome: "correct" | "incorrect" };
  }) => {
    if (!session || !modalQuestion) return;
    try {
      await resolveQuestion(session.id, modalQuestion.id, payload);
      closeModal();
    } catch (error) {
      console.error(error);
      setQuestionError("Unable to record result");
    }
  };

  const handleCorrect = () => {
    if (!selectedTeamId) {
      setQuestionError("Select a team first");
      return;
    }
    finishResolution({ team_id: selectedTeamId, outcome: "correct" });
  };

  const handleIncorrect = () => {
    if (!selectedTeamId) {
      setQuestionError("Select a team first");
      return;
    }
    setPendingIncorrectTeamId(selectedTeamId);
    setStealMode(true);
    setStealTeamId(null);
    setStealTimeLeft(config?.steal_timer_seconds ?? 5);
    setQuestionError("Choose a team for the steal attempt");
  };

  const resolveWithoutSteal = () => {
    if (!pendingIncorrectTeamId) return;
    finishResolution({ team_id: pendingIncorrectTeamId, outcome: "incorrect" });
  };

  const handleStealOutcome = (outcome: "correct" | "incorrect") => {
    if (!pendingIncorrectTeamId) return;
    if (!stealTeamId) {
      setQuestionError("Select a team for the steal attempt");
      return;
    }
    finishResolution({
      team_id: pendingIncorrectTeamId,
      outcome: "incorrect",
      steal_attempt: { team_id: stealTeamId, outcome },
    });
  };

  const optionsVisible = revealed && timeLeft > 0;
  const stealTeams = session?.teams.filter((team) => team.id !== pendingIncorrectTeamId) ?? [];

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <button className="btn" onClick={() => navigate("/dashboard")}>
        ← Back to dashboard
      </button>

      {!session && (
        <section className="card">
          <h1 style={{ marginTop: 0 }}>Team setup</h1>
          <p style={{ color: "#64748b" }}>Enter {minTeams}–{maxTeams} team names.</p>
          <form onSubmit={handleSessionCreate} style={{ display: "grid", gap: "0.75rem", maxWidth: 480 }}>
            {teamInputs.map((name, index) => (
              <div key={index} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => handleTeamChange(index, event.target.value)}
                  placeholder={`Team ${index + 1}`}
                  style={{ flex: 1, padding: "0.75rem 1rem", borderRadius: 999, border: "1px solid #cbd5f5" }}
                />
                {teamInputs.length > minTeams && (
                  <button type="button" className="btn" onClick={() => removeTeam(index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Starting..." : "Start hosting"}
              </button>
              <button type="button" className="btn" onClick={addTeam} disabled={teamInputs.length >= maxTeams}>
                + Team
              </button>
            </div>
            {teamError && <span style={{ color: "#dc2626" }}>{teamError}</span>}
          </form>
        </section>
      )}

      {session && selectedQuiz && (
        <>
          {gameState === "GAMEOVER" && (
            <section className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
              <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Game Over!</h1>
              {winningTeam ? (
                <>
                  <p style={{ fontSize: "1.25rem", color: "#475569" }}>Winner</p>
                  <h2 style={{ fontSize: "2rem", margin: 0 }}>{winningTeam.name}</h2>
                  <p style={{ fontSize: "1.5rem", color: "#22c55e", marginTop: "0.5rem" }}>
                    {winningTeam.score} points
                  </p>
                </>
              ) : (
                <p>No winner determined.</p>
              )}
              {/* TODO: [Display Confetti Animation Here] */}
              <button
                className="btn btn-primary"
                style={{ marginTop: "2rem" }}
                onClick={() => {
                  resetGame();
                  navigate("/dashboard");
                }}
              >
                Start New Game
              </button>
            </section>
          )}

          <section className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <p style={{ margin: 0, color: "#94a3b8" }}>Hosting quiz</p>
              <h1 style={{ margin: 0 }}>{selectedQuiz.title}</h1>
            </div>
            <Scoreboard
              teams={session.teams}
              activeTeamId={selectedTeamId}
              onSelectTeam={setSelectedTeamId}
            />
            <div style={{ color: "#94a3b8" }}>
              Select a team before scoring. Used questions are automatically disabled.
            </div>
            {(gameState === "BOARD" || gameState === "GAMEOVER") && (
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button className="btn" onClick={() => endGameAndDetermineWinner()}>
                  End Game
                </button>
                <button className="btn btn-secondary" onClick={() => resetGame()}>
                  Reset Game
                </button>
              </div>
            )}
          </section>

          {gameState === "BOARD" && (
            <section className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ margin: 0 }}>Question board</h2>
              <span style={{ color: "#94a3b8" }}>
                {session.used_question_ids.length}/{selectedQuiz.questions.length} used
              </span>
            </div>
            {questionError && <p style={{ color: "#dc2626" }}>{questionError}</p>}
            <div className="board-grid">
              {groupedQuestions.map(({ points, questions }) => (
                <div key={points} className="question-column">
                  <div className="question-column-header">{points} pts</div>
                  {questions.map((question, index) => {
                    const used = session.used_question_ids.includes(question.id);
                    const inProgress = session.current_question_id === question.id;
                    const disabled = used || (!!session.current_question_id && !inProgress);
                    return (
                      <button
                        key={question.id}
                        type="button"
                        className={`question-cell${used ? " used" : ""}${inProgress ? " active" : ""}`}
                        onClick={() => handleQuestionClick(question)}
                        disabled={disabled}
                      >
                        <span>{`${index + 1} - ${question.difficulty ?? "?"}`}</span>
                        {used && <small>Used</small>}
                        {inProgress && <small>In play</small>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
          )}
        </>
      )}

      {isModalOpen && modalQuestion && session && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>{modalQuestion.points} pts — {modalQuestion.difficulty || "Question"}</h2>
              <button className="btn" onClick={closeModal}>
                Close
              </button>
            </div>

            {!revealed && (
              <div style={{ marginTop: "1.5rem" }}>
                <p>This question will reveal for {config?.primary_timer_seconds ?? 20} seconds.</p>
                <button className="btn btn-primary" onClick={handleStartAndReveal}>
                  Start & Reveal
                </button>
              </div>
            )}

            {revealed && (
              <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="timer-display">
                  {stealMode ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                      <span style={{ fontWeight: 700, letterSpacing: "0.1em" }}>STEAL</span>
                      <span style={{ fontSize: "2rem", color: "#dc2626", fontWeight: 700 }}>
                        {stealTimeLeft > 0 ? stealTimeLeft : 0}
                      </span>
                    </div>
                  ) : (
                    <>{timeLeft > 0 ? `${timeLeft}s` : "⏰ Time's up!"}</>
                  )}
                </div>
                <p style={{ fontWeight: 600 }}>{modalQuestion.prompt}</p>
                {optionsVisible ? (
                  <ul style={{ paddingLeft: "1.25rem" }}>
                    {modalQuestion.options.map((option, index) => (
                      <li key={index}>{option}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ color: "#94a3b8" }}>Options hidden when timer expires.</div>
                )}

                {!stealMode && (
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <label style={{ fontWeight: 600 }}>Choose answering team</label>
                    <select
                      value={selectedTeamId ?? ""}
                      onChange={(event) => setSelectedTeamId(event.target.value || null)}
                      style={{ padding: "0.7rem 1rem", borderRadius: 12, border: "1px solid #cbd5f5" }}
                    >
                      {session.teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      <button className="btn btn-primary" type="button" onClick={handleCorrect}>
                        Mark correct
                      </button>
                      <button className="btn" type="button" onClick={handleIncorrect}>
                        Mark incorrect
                      </button>
                    </div>
                  </div>
                )}

                {stealMode && (
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <p style={{ fontWeight: 600 }}>Steal attempt — {stealTimeLeft}s remaining</p>
                    {stealTeams.length > 0 ? (
                      <select
                        value={stealTeamId ?? ""}
                        onChange={(event) => setStealTeamId(event.target.value || null)}
                        style={{ padding: "0.7rem 1rem", borderRadius: 12, border: "1px solid #cbd5f5" }}
                      >
                        <option value="">Select team</option>
                        {stealTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ color: "#94a3b8" }}>No remaining teams available for a steal.</div>
                    )}
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      <button className="btn btn-primary" type="button" onClick={() => handleStealOutcome("correct")}>
                        Steal correct
                      </button>
                      <button className="btn" type="button" onClick={() => handleStealOutcome("incorrect")}>
                        Steal incorrect
                      </button>
                      <button className="btn" type="button" onClick={resolveWithoutSteal}>
                        Skip steal
                      </button>
                    </div>
                  </div>
                )}

                {questionError && <p style={{ color: "#dc2626" }}>{questionError}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHostPage;
