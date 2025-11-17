import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useProfileStore } from "../store/profileStore";
import { useQuizStore } from "../store/quizStore";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { selectedProfile } = useProfileStore((state) => ({
    selectedProfile: state.selectedProfile,
  }));
  const {
    quizzes,
    loading,
    fetchQuizzes,
    createQuiz,
    duplicateQuiz,
    deleteQuiz,
  } = useQuizStore((state) => ({
    quizzes: state.quizzes,
    loading: state.loading,
    fetchQuizzes: state.fetchQuizzes,
    createQuiz: state.createQuiz,
    duplicateQuiz: state.duplicateQuiz,
    deleteQuiz: state.deleteQuiz,
  }));

  const [form, setForm] = useState({ title: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedProfile) {
      fetchQuizzes(selectedProfile.id).catch(() => setError("Unable to load quizzes"));
    }
  }, [selectedProfile, fetchQuizzes]);

  const quizCountCopy = useMemo(() => {
    if (!quizzes.length) return "No quizzes yet";
    if (quizzes.length === 1) return "1 quiz available";
    return `${quizzes.length} quizzes available`;
  }, [quizzes.length]);

  if (!selectedProfile) {
    return (
      <div className="container">
        <div className="card">
          <p>Please select a profile first.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Quiz title is required");
      return;
    }
    setSubmitting(true);
    try {
      await createQuiz(selectedProfile.id, form);
      setForm({ title: "", description: "" });
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Unable to create quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!window.confirm("Delete this quiz?")) return;
    await deleteQuiz(quizId);
  };

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ color: "#94a3b8", margin: 0 }}>Profile</p>
          <h1 style={{ margin: 0 }}>{selectedProfile.name}</h1>
          <p style={{ color: "#475569", marginTop: "0.5rem" }}>{quizCountCopy}</p>
        </div>
        <button className="btn" onClick={() => navigate("/")}>Switch profile</button>
      </header>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Create a new quiz</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", maxWidth: 480 }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="e.g. Level 5 Review"
              style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: 12, border: "1px solid #cbd5f5" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.25rem" }}>Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Optional context"
              rows={3}
              style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: 12, border: "1px solid #cbd5f5" }}
            />
          </div>
          {error && <span style={{ color: "#dc2626" }}>{error}</span>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving..." : "Create quiz"}
          </button>
        </form>
      </section>

      <section className="grid quiz-grid">
        {loading && <div>Loading quizzes...</div>}
        {!loading && !quizzes.length && <div>No quizzes yet.</div>}
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="quiz-card">
            <div>
              <h3 style={{ margin: "0 0 0.25rem" }}>{quiz.title}</h3>
              <p style={{ margin: 0, color: "#64748b" }}>{quiz.description || "No description"}</p>
            </div>
            <p style={{ margin: 0, color: "#94a3b8" }}>{quiz.question_count} questions</p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={() => navigate(`/quizzes/${quiz.id}/host`)}>
                Host
              </button>
              <button className="btn btn-secondary" onClick={() => navigate(`/quizzes/${quiz.id}/edit`)}>
                Edit
              </button>
              <button className="btn" onClick={() => duplicateQuiz(quiz.id)}>
                Duplicate
              </button>
              <button className="btn" style={{ background: "#fee2e2", color: "#dc2626" }} onClick={() => handleDelete(quiz.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default DashboardPage;
