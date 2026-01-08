import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Question } from "../types/api";
import { useQuizStore, type QuestionPayload, type QuizPayload } from "../store/quizStore";
import { QuestionFormModal } from "../components/QuestionFormModal";

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
  const [metaMessage, setMetaMessage] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

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

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingQuestion(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (question: Question) => {
    setModalMode("edit");
    setEditingQuestion(question);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleQuestionSubmit = async (payload: QuestionPayload) => {
    if (modalMode === "edit" && editingQuestion) {
      await updateQuestion(editingQuestion.id, payload);
    } else {
      await createQuestion(quizId!, payload);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await deleteQuestion(questionId);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <button className="btn" onClick={() => navigate("/dashboard")}>
        ← Back to dashboard
      </button>

      {/* Quiz Details Section */}
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

      {/* Add Question Button - Triggers Modal */}
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Questions ({sortedQuestions.length})</h2>
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            + Add new question
          </button>
        </div>
      </section>

      {/* Questions List */}
      <section className="card">
        {sortedQuestions.length === 0 && <p>No questions yet. Click "Add new question" above.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {sortedQuestions.map((question) => (
            <div key={question.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>{question.prompt}</p>
                  <div style={{ color: "#64748b" }}>{question.points} pts · {question.difficulty || "Unlabeled"}</div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button className="btn btn-secondary" onClick={() => handleOpenEditModal(question)}>
                    Edit
                  </button>
                  <button className="btn" style={{ background: "#fee2e2", color: "#dc2626" }} onClick={() => handleDeleteQuestion(question.id)}>
                    Delete
                  </button>
                </div>
              </div>
              {question.options.length > 0 ? (
                <ul style={{ marginTop: "0.75rem", paddingLeft: "1.25rem" }}>
                  {question.options.map((option, index) => (
                    <li key={index} style={{ fontWeight: question.correct_index === index ? 700 : 400 }}>
                      {option}
                      {question.correct_index === index && <span style={{ color: "#10b981", marginLeft: "0.3rem" }}>(correct)</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ marginTop: "0.75rem", color: "#64748b", fontStyle: "italic" }}>No options defined</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Question Form Modal */}
      <QuestionFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleQuestionSubmit}
        initialData={editingQuestion ? {
          prompt: editingQuestion.prompt,
          options: [...editingQuestion.options],
          correct_index: editingQuestion.correct_index,
          points: editingQuestion.points,
          difficulty: editingQuestion.difficulty ?? "Easy",
        } : null}
        mode={modalMode}
      />
    </div>
  );
};

export default QuizEditorPage;
