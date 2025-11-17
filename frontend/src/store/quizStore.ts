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
    const { data } = await apiClient.post<QuizRead>(`/profiles/${profileId}/quizzes`, payload);
    set((state) => ({ quizzes: [...state.quizzes, { ...data, question_count: data.questions.length }] }));
    return data;
  },
  async updateQuiz(quizId: string, payload: QuizPayload) {
    const { data } = await apiClient.put<QuizRead>(`/quizzes/${quizId}`, payload);
    set((state) => ({
      selectedQuiz: state.selectedQuiz?.id === quizId ? data : state.selectedQuiz,
      quizzes: state.quizzes.map((quiz) => (quiz.id === quizId ? { ...quiz, ...payload } : quiz)),
    }));
    return data;
  },
  async deleteQuiz(quizId: string) {
    await apiClient.delete(`/quizzes/${quizId}`);
    set((state) => ({
      quizzes: state.quizzes.filter((quiz) => quiz.id !== quizId),
      selectedQuiz: state.selectedQuiz?.id === quizId ? null : state.selectedQuiz,
    }));
  },
  async duplicateQuiz(quizId: string) {
    const { data } = await apiClient.post<QuizRead>(`/quizzes/${quizId}/duplicate`);
    set((state) => ({ quizzes: [...state.quizzes, { ...data, question_count: data.questions.length }] }));
    return data;
  },
  async createQuestion(quizId: string, payload: QuestionPayload) {
    const { data } = await apiClient.post<Question>(`/quizzes/${quizId}/questions`, payload);
    set((state) => ({
      selectedQuiz:
        state.selectedQuiz?.id === quizId
          ? { ...state.selectedQuiz, questions: [...state.selectedQuiz.questions, data] }
          : state.selectedQuiz,
      quizzes: state.quizzes.map((quiz) =>
        quiz.id === quizId ? { ...quiz, question_count: quiz.question_count + 1 } : quiz,
      ),
    }));
    return data;
  },
  async updateQuestion(questionId: string, payload: Partial<QuestionPayload>) {
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
    }));
    return data;
  },
  async deleteQuestion(questionId: string) {
    await apiClient.delete(`/questions/${questionId}`);
    set((state) => ({
      selectedQuiz: state.selectedQuiz
        ? {
            ...state.selectedQuiz,
            questions: state.selectedQuiz.questions.filter((question) => question.id !== questionId),
          }
        : state.selectedQuiz,
    }));
  },
  async reorderQuestion(
    questionId: string,
    payload: Partial<Pick<QuestionPayload, "points" | "difficulty">>,
  ) {
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
    }));
    return data;
  },
  clearSelectedQuiz() {
    set({ selectedQuiz: null });
  },
});

export const useQuizStore = create<QuizState>()(quizStore);

export type { QuizState };
