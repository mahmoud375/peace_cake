import { FormEvent, useState, useEffect } from "react";
import type { QuestionPayload } from "../store/quizStore";

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard", "Impossible"] as const;

interface QuestionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: QuestionPayload) => Promise<void>;
    initialData?: QuestionPayload | null;
    mode: "create" | "edit";
}

const emptyQuestion = (): QuestionPayload => ({
    prompt: "",
    options: [],
    correct_index: 0,
    points: 10,
    difficulty: DIFFICULTY_OPTIONS[0],
});

export const QuestionFormModal = ({ isOpen, onClose, onSubmit, initialData, mode }: QuestionFormModalProps) => {
    const [questionForm, setQuestionForm] = useState<QuestionPayload>(emptyQuestion());
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form when modal opens or initial data changes
    useEffect(() => {
        if (isOpen) {
            if (initialData && mode === "edit") {
                setQuestionForm({ ...initialData });
            } else {
                setQuestionForm(emptyQuestion());
            }
            setErrorMessage(null);
        }
    }, [isOpen, initialData, mode]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!questionForm.prompt.trim()) {
            setErrorMessage("Prompt is required");
            return;
        }

        // Validate non-empty options don't have empty strings
        const hasEmptyOption = questionForm.options.some((opt) => !opt.trim());
        if (hasEmptyOption) {
            setErrorMessage("All options must have text (or remove empty options)");
            return;
        }

        // Validate correct_index if there are options
        if (questionForm.options.length > 0 &&
            (questionForm.correct_index < 0 || questionForm.correct_index >= questionForm.options.length)) {
            setErrorMessage("Choose a valid correct answer");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            await onSubmit(questionForm);
            onClose();
        } catch (error: any) {
            console.error(error);
            setErrorMessage(error.message || "Unable to save question");
        } finally {
            setIsSubmitting(false);
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
            prev.options.length >= 4 ? prev : { ...prev, options: [...prev.options, ""] });
    };

    const removeOption = (index: number) => {
        setQuestionForm((prev) => {
            const next = prev.options.filter((_, idx) => idx !== index);
            // Adjust correct_index if it's out of bounds
            const newCorrect = next.length > 0 ? Math.min(prev.correct_index, next.length - 1) : 0;
            return { ...prev, options: next, correct_index: newCorrect };
        });
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    zIndex: 50,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                }}
            >
                {/* Modal */}
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: "white",
                        borderRadius: 16,
                        padding: "2rem",
                        maxWidth: 700,
                        width: "100%",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h2 style={{ margin: 0 }}>{mode === "edit" ? "Edit question" : "Add new question"}</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: "transparent",
                                border: "none",
                                fontSize: "1.5rem",
                                cursor: "pointer",
                                color: "#64748b",
                                lineHeight: 1,
                            }}
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
                        {/* Prompt */}
                        <div>
                            <label style={{ fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Prompt</label>
                            <textarea
                                value={questionForm.prompt}
                                onChange={(event) => setQuestionForm((prev) => ({ ...prev, prompt: event.target.value }))}
                                rows={3}
                                style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: 12, border: "1px solid #cbd5f5" }}
                            />
                        </div>

                        {/* Options */}
                        <div>
                            <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
                                Options {questionForm.options.length === 0 && <span style={{ color: "#64748b", fontWeight: 400 }}>(optional)</span>}
                            </label>
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
                                        <button
                                            type="button"
                                            className="btn"
                                            onClick={() => removeOption(index)}
                                            style={{ background: "#fee2e2", color: "#dc2626" }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {questionForm.options.length < 4 && (
                                <button type="button" className="btn" style={{ marginTop: "0.5rem" }} onClick={addOption}>
                                    + Add option
                                </button>
                            )}
                        </div>

                        {/* Correct Answer, Points, Difficulty */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                            {/* Correct Answer - only show if there are options */}
                            {questionForm.options.length > 0 && (
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
                            )}

                            {/* Points */}
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

                            {/* Difficulty */}
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

                        {/* Error Message */}
                        {errorMessage && (
                            <span style={{ color: "#dc2626" }}>
                                {errorMessage}
                            </span>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                                style={{ flex: 1, opacity: isSubmitting ? 0.6 : 1 }}
                            >
                                {isSubmitting ? "Saving..." : mode === "edit" ? "Update question" : "Add question"}
                            </button>
                            <button type="button" className="btn" onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};
