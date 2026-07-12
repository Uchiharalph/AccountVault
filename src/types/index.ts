export type Category =
  | "Social Media"
  | "Shopping"
  | "Banking & Finance"
  | "Entertainment"
  | "Work & Productivity"
  | "Education"
  | "Health & Fitness"
  | "Travel"
  | "Gaming"
  | "Other";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  website_url?: string;
  email_used: string;
  category: Category;
  login_method:
    | "Email/Password"
    | "Google"
    | "Apple"
    | "Facebook"
    | "Other";
  notes?: string;
  created_at: string;
  last_used_at?: string;
  is_active: boolean;
}