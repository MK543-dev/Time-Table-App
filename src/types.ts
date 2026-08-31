export type UserRole = 'admin' | 'user';
export type ThemeMode = 'glass' | 'dark' | 'light';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'done' | 'skipped';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'rotating_A' | 'rotating_B';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  theme_pref: ThemeMode;
  streak_count: number;
  longest_streak: number;
  xp: number;
  level: number;
  avatar: string;
  department?: string;
}

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  category: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  duration_minutes: number;
  priority: TaskPriority;
  status: TaskStatus;
  recurrence_rule: RecurrenceType;
  is_admin_locked: boolean;
  time_spent_seconds: number;
  tags: string[];
  notes?: string;
  completed_at?: string;
  subject?: string;
  room?: string;
}

export interface TimeLog {
  id: string;
  task_id?: string;
  user_id?: string;
  task_title: string;
  category: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  notes?: string;
  is_manual?: boolean;
}

export interface ClassPeriod {
  id: string;
  name: string; // e.g. "Period 1", "Morning Block"
  start_time: string; // "08:30"
  end_time: string; // "09:45"
  day_type: 'all' | 'A' | 'B';
  default_category: string;
  room?: string;
}

export interface ExamCountdown {
  id: string;
  subject: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  weight_percent: number;
  room: string;
  topics: string[];
}

export interface LockableSetting<T> {
  value: T;
  locked_by_admin: boolean;
}

export interface AdminConfig {
  organization_name: string;
  department: string;
  max_daily_hours_threshold: LockableSetting<number>;
  gamification_enabled: LockableSetting<boolean>;
  rotation_cycle_current: 'A' | 'B';
  ai_tone_persona: string;
  timesheet_export_format: 'csv' | 'json' | 'pdf';
  auto_advance_rotation: boolean;
}

export interface AISummary {
  id: string;
  user_id: string;
  week_of: string;
  insight_text: string;
  generated_at: string;
  metrics: {
    total_completed: number;
    completion_rate: number;
    peak_productivity_window: string;
    skip_analysis: string;
    recommended_focus_adjustment: string;
  };
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  severity: 'info' | 'warning' | 'urgent';
  is_mandatory?: boolean;
}

// Backward compatibility alias
export type OrgAnnouncement = Announcement;

export interface CategoryDef {
  id: string;
  name: string;
  color: string;
  is_locked_by_admin?: boolean;
  is_admin_locked?: boolean;
  is_core_academic?: boolean;
  icon?: string;
}
