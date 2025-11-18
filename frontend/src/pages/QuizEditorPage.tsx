import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Question } from "../types/api";
import { useQuizStore, type QuestionPayload, type QuizPayload } from "../store/quizStore";

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard", "Impossible"] as const;

const emptyQuestion = (): QuestionPayload => ({
  prompt: "",
  options: ["", "", ""],
  correct_index: 0,
  points: 10,
  difficulty: DIFFICULTY_OPTIONS[0],
});

const QuizEditorPage = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const {
    selectedQuiz,
    fetchQuiz,
    updateQuiz,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  } = useQuizStore((state) => ({
    selectedQuiz: state.selectedQuiz,
    fetchQuiz: state.fetchQuiz,
    updateQuiz: state.updateQuiz,
    createQuestion: state.createQuestion,
    updateQuestion: state.updateQuestion,
    deleteQuestion: state.deleteQuestion,
  }));

  const [metaForm, setMetaForm] = useState<QuizPayload>({ title: "", description: "" });
  const [questionForm, setQuestionForm] = useState<QuestionPayload>(emptyQuestion());
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [metaMessage, setMetaMessage] = useState<string | null>(null);
  const [questionMessage, setQuestionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (quizId) {
      fetchQuiz(quizId).catch(() => setMetaMessage("Unable to load quiz"));
    }
  }, [quizId, fetchQuiz]);

  useEffect(() => {
    if (selectedQuiz) {
      setMetaForm({
        title: selectedQuiz.title,
        description: selectedQuiz.description ?? "",
      });
    }
  }, [selectedQuiz]);

  const sortedQuestions = useMemo(() => {
    return [...(selectedQuiz?.questions ?? [])].sort((a, b) => a.points - b.points);
  }, [selectedQuiz]);

  if (!quizId) {
    return (
      <div className="container">
        <div className="card">Quiz ID missing.</div>
      </div>
    );
  }

  const handleMetaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!metaForm.title.trim()) {
      setMetaMessage("Title is required");
      return;
    }
    try {
      await updateQuiz(quizId, metaForm);
      setMetaMessage("Quiz updated");
    } catch (error) {
      console.error(error);
      setMetaMessage("Unable to update quiz");
    }
  };

  const handleQuestionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!questionForm.prompt.trim()) {
      setQuestionMessage("Prompt is required");
      return;
    }
    if (questionForm.options.some((opt) => !opt.trim()) || questionForm.options.length < 3) {
      setQuestionMessage("Provide 3-4 answer options");
      return;
    }
    if (questionForm.correct_index < 0 || questionForm.correct_index >= questionForm.options.length) {
      setQuestionMessage("Choose the correct answer index");
      return;
    }

    try {
      if (editingQuestionId) {
        await updateQuestion(editingQuestionId, questionForm);
      } else {
        await createQuestion(quizId, questionForm);
      }
      resetQuestionForm();
      setQuestionMessage(null);
    } catch (error) {
      console.error(error);
      setQuestionMessage("Unable to save question");
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm(emptyQuestion());
    setEditingQuestionId(null);
  };

  const handleEditQuestion = (question: Question) => {
    setQuestionForm({
      prompt: question.prompt,
      options: [...question.options],
      correct_index: question.correct_index,
      points: question.points,
      difficulty: question.difficulty ?? DIFFICULTY_OPTIONS[0],
    });
    setEditingQuestionId(question.id);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await deleteQuestion(questionId);
    } catch (error) {
      console.error(error);
    }
  };

  const updateOption = (index: number, value: string) => {
    setQuestionForm((prev) => {
      const next = [...prev.options];
      next[index] = value;
      return { ...prev, options: next };
    });
  };

  const addOption = () => {
    setQuestionForm((prev) =>
      prev.options.length >= 4 ? prev : { ...prev, options: [...prev.options, ""] },
    );
  };

  const removeOption = (index: number) => {
    setQuestionForm((prev) => {
      if (prev.options.length <= 3) return prev;
      const next = prev.options.filter((_, idx) => idx !== index);
      const newCorrect = Math.min(prev.correct_index, next.length - 1);
      return { ...prev, options: next, correct_index: newCorrect };
    });
  };

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <button className="btn" onClick={() => navigate("/dashboard")}>
        ← Back to dashboard
      </button>

      <section className="card">
        <h1 style={{ marginTop: 0 }}>Edit quiz</h1>
        <form onSubmit={handleMetaSubmit} style={{ display: "grid", gap: "1rem", maxWidth: 640 }}>
          <div>
            <label style={{ fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Title</label>
            <input
              type="text"
              value={metaForm.title}
              onChange={(event) => setMetaForm((prev) => ({ ...prev, title: event.target.value }))}
              style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: 12, border: "1px solid #cbd5f5" }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Description</label>
            <textarea
              value={metaForm.description ?? ""}
              onChange={(event) => setMetaForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: 12, border: "1px solid #cbd5f5" }}
            />
          </div>
          {metaMessage && <span style={{ color: metaMessage.includes("Unable") ? "#dc2626" : "#059669" }}>{metaMessage}</span>}
          <button type="submit" className="btn btn-primary">
            Save quiz details
          </button>
        </form>
      </section>

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>{editingQuestionId ? "Edit question" : "Add new question"}</h2>
          {editingQuestionId && (
            <button type="button" className="btn" onClick={resetQuestionForm}>
              Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={handleQuestionSubmit} style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={{ fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Prompt</label>
            <textarea
              value={questionForm.prompt}
              onChange={(event) => setQuestionForm((prev) => ({ ...prev, prompt: event.target.value }))}
              rows={3}
              style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: 12, border: "1px solid #cbd5f5" }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Options</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {questionForm.options.map((option, index) => (
                <div key={index} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="text"
                    value={option}
                    onChange={(event) => updateOption(index, event.target.value)}
                    placeholder={`Option ${index + 1}`}
                    style={{ flex: 1, padding: "0.7rem 1rem", borderRadius: 12, border: "1px solid #cbd5f5" }}
                  />
                  {questionForm.options.length > 3 && (
                    <button type="button" className="btn" onClick={() => removeOption(index)}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            {questionForm.options.length < 4 && (
              <button type="button" className="btn" style={{ marginTop: "0.5rem" }} onClick={addOption}>
                + Add option
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>Correct answer</label>
              <select
                value={questionForm.correct_index}
                onChange={(event) =>
                  setQuestionForm((prev) => ({
                    ...prev,
                    correct_index: Number(event.target.value),
                  }))
                }
                style={{ width: "100%", padding: "0.7rem 1rem", borderRadius: 12, border: "1px solid #cbd5f5" }}
              >
                {questionForm.options.map((_, index) => (
                  <option value={index} key={index}>
                    Option {index + 1}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>Points</label>
              <select
                value={questionForm.points}
                onChange={(event) =>
                  setQuestionForm((prev) => ({ ...prev, points: Number(event.target.value) }))
                }
                style={{ width: "100%", padding: "0.7rem 1rem", borderRadius: 12, border: "1px solid #cbd5f5" }}
              >
                {[10, 20, 30, 40].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>Difficulty</label>
              <select
                value={questionForm.difficulty ?? DIFFICULTY_OPTIONS[0]}
                onChange={(event) =>
                  setQuestionForm((prev) => ({ ...prev, difficulty: event.target.value }))
                }
                style={{ width: "100%", padding: "0.7rem 1rem", borderRadius: 12, border: "1px solid #cbd5f5" }}
              >
                {DIFFICULTY_OPTIONS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {questionMessage && (
            <span style={{ color: questionMessage.includes("Unable") ? "#dc2626" : "#059669" }}>
              {questionMessage}
            </span>
          )}

          <button type="submit" className="btn btn-primary">
            {editingQuestionId ? "Update question" : "Add question"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Questions ({sortedQuestions.length})</h2>
        {sortedQuestions.length === 0 && <p>No questions yet. Add one above.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {sortedQuestions.map((question) => (
            <div key={question.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>{question.prompt}</p>
                  <div style={{ color: "#64748b" }}>{question.points} pts · {question.difficulty || "Unlabeled"}</div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button className="btn btn-secondary" onClick={() => handleEditQuestion(question)}>
                    Edit
                  </button>
                  <button className="btn" style={{ background: "#fee2e2", color: "#dc2626" }} onClick={() => handleDeleteQuestion(question.id)}>
                    Delete
                  </button>
                </div>
              </div>
              <ul style={{ marginTop: "0.75rem", paddingLeft: "1.25rem" }}>
                {question.options.map((option, index) => (
                  <li key={index} style={{ fontWeight: question.correct_index === index ? 700 : 400 }}>
                    {option}
                    {question.correct_index === index && <span style={{ color: "#10b981", marginLeft: "0.3rem" }}>(correct)</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default QuizEditorPage;
