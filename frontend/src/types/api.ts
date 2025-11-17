export interface Profile {
  id: string;
  name: string;
  created_at: string;
}

export interface ProfileDetail extends Profile {
  quiz_count: number;
  quizzes: QuizSummary[];
}

export interface QuizSummary {
  id: string;
  title: string;
  description?: string | null;
  question_count: number;
  created_at: string;
}

export interface QuizRead {
  id: string;
  profile_id: string;
  title: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  questions: Question[];
}

export interface Question {
  id: string;
  quiz_id: string;
  prompt: string;
  options: string[];
  correct_index: number;
  points: number;
  difficulty?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionTeam {
  id: string;
  name: string;
  score: number;
}

export interface SessionRead {
  id: string;
  quiz_id: string;
  teams: SessionTeam[];
  used_question_ids: string[];
  current_question_id?: string | null;
  question_started_at?: string | null;
}

export interface SessionCreatePayload {
  quiz_id: string;
  teams: { name: string }[];
}

export interface QuestionResolutionPayload {
  team_id: string;
  outcome: "correct" | "incorrect";
  steal_attempt?: {
    team_id: string;
    outcome: "correct" | "incorrect";
  } | null;
}

export interface ConfigResponse {
  primary_timer_seconds: number;
  steal_timer_seconds: number;
  steal_points_factor: number;
  min_teams: number;
  max_teams: number;
}
