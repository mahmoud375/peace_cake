import { StateCreator, create } from "zustand";

import apiClient from "../services/apiClient";
import type { Question, QuizRead, QuizSummary } from "../types/api";

export interface QuizPayload {
  title: string;
  description?: string | null;
}

export interface QuestionPayload {
  prompt: string;
  options: string[];
  correct_index: number;
  points: number;
  difficulty?: string | null;
}

interface QuizState {
  quizzes: QuizSummary[];
  selectedQuiz: QuizRead | null;
  loading: boolean;
  error: string | null;
  fetchQuizzes: (profileId: string) => Promise<void>;
  fetchQuiz: (quizId: string) => Promise<QuizRead>;
  createQuiz: (profileId: string, payload: QuizPayload) => Promise<QuizRead>;
  updateQuiz: (quizId: string, payload: QuizPayload) => Promise<QuizRead>;
  deleteQuiz: (quizId: string) => Promise<void>;
  duplicateQuiz: (quizId: string) => Promise<QuizRead>;
  createQuestion: (quizId: string, payload: QuestionPayload) => Promise<Question>;
  updateQuestion: (questionId: string, payload: Partial<QuestionPayload>) => Promise<Question>;
  deleteQuestion: (questionId: string) => Promise<void>;
  reorderQuestion: (questionId: string, payload: Partial<Pick<QuestionPayload, "points" | "difficulty">>) => Promise<Question>;
  clearSelectedQuiz: () => void;
}

const quizStore: StateCreator<QuizState> = (set, get) => ({
  quizzes: [],
  selectedQuiz: null,
  loading: false,
  error: null,
  async fetchQuizzes(profileId: string) {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get<QuizSummary[]>(`/profiles/${profileId}/quizzes`);
      set({ quizzes: data, loading: false });
    } catch (error) {
      console.error(error);
      set({ loading: false, error: "Unable to load quizzes" });
    }
  },
  async fetchQuiz(quizId: string) {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get<QuizRead>(`/quizzes/${quizId}`);
      set({ selectedQuiz: data, loading: false });
      return data;
    } catch (error) {
      console.error(error);
      set({ loading: false, error: "Unable to load quiz" });
      throw error;
    }
  },
  async createQuiz(profileId: string, payload: QuizPayload) {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post<QuizRead>(`/profiles/${profileId}/quizzes`, payload);
      set((state) => ({ quizzes: [...state.quizzes, { ...data, question_count: data.questions.length }], loading: false }));
      return data;
    } catch (error: any) {
      console.error(error);
      set({ loading: false, error: "Failed to create quiz" });
      throw new Error("Failed to create quiz");
    }
  },
  async updateQuiz(quizId: string, payload: QuizPayload) {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.put<QuizRead>(`/quizzes/${quizId}`, payload);
      set((state) => ({
        selectedQuiz: state.selectedQuiz?.id === quizId ? data : state.selectedQuiz,
        quizzes: state.quizzes.map((quiz) => (quiz.id === quizId ? { ...quiz, ...payload } : quiz)),
        loading: false,
      }));
      return data;
    } catch (error: any) {
      console.error(error);
      set({ loading: false, error: "Failed to update quiz" });
      throw new Error("Failed to update quiz");
    }
  },
  async deleteQuiz(quizId: string) {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/quizzes/${quizId}`);
      set((state) => ({
        quizzes: state.quizzes.filter((quiz) => quiz.id !== quizId),
        selectedQuiz: state.selectedQuiz?.id === quizId ? null : state.selectedQuiz,
        loading: false,
      }));
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.status === 404 ? "Quiz not found" : "Failed to delete quiz";
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  async duplicateQuiz(quizId: string) {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post<QuizRead>(`/quizzes/${quizId}/duplicate`);
      set((state) => ({ quizzes: [...state.quizzes, { ...data, question_count: data.questions.length }], loading: false }));
      return data;
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.status === 404 ? "Quiz not found" : "Failed to duplicate quiz";
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  async createQuestion(quizId: string, payload: QuestionPayload) {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post<Question>(`/quizzes/${quizId}/questions`, payload);
      set((state) => ({
        selectedQuiz:
          state.selectedQuiz?.id === quizId
            ? { ...state.selectedQuiz, questions: [...state.selectedQuiz.questions, data] }
            : state.selectedQuiz,
        quizzes: state.quizzes.map((quiz) =>
          quiz.id === quizId ? { ...quiz, question_count: quiz.question_count + 1 } : quiz,
        ),
        loading: false,
      }));
      return data;
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.status === 400 ? "Invalid question data" : "Failed to create question";
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  async updateQuestion(questionId: string, payload: Partial<QuestionPayload>) {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.put<Question>(`/questions/${questionId}`, payload);
      set((state) => ({
        selectedQuiz: state.selectedQuiz
          ? {
            ...state.selectedQuiz,
            questions: state.selectedQuiz.questions.map((question) =>
              question.id === questionId ? data : question,
            ),
          }
          : state.selectedQuiz,
        loading: false,
      }));
      return data;
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.status === 400 ? "Invalid question data" : "Failed to update question";
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  async deleteQuestion(questionId: string) {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/questions/${questionId}`);
      set((state) => ({
        selectedQuiz: state.selectedQuiz
          ? {
            ...state.selectedQuiz,
            questions: state.selectedQuiz.questions.filter((question) => question.id !== questionId),
          }
          : state.selectedQuiz,
        loading: false,
      }));
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.status === 404 ? "Question not found" : "Failed to delete question";
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  async reorderQuestion(
    questionId: string,
    payload: Partial<Pick<QuestionPayload, "points" | "difficulty">>,
  ) {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.patch<Question>(`/questions/${questionId}/order`, payload);
      set((state) => ({
        selectedQuiz: state.selectedQuiz
          ? {
            ...state.selectedQuiz,
            questions: state.selectedQuiz.questions.map((question) =>
              question.id === questionId ? data : question,
            ),
          }
          : state.selectedQuiz,
        loading: false,
      }));
      return data;
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.status === 404 ? "Question not found" : "Failed to reorder question";
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  clearSelectedQuiz() {
    set({ selectedQuiz: null });
  },
});

export const useQuizStore = create<QuizState>()(quizStore);

export type { QuizState };
