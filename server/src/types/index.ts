export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  created_at: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  model: string;
  tokens: number;
  cost: number;
  api_key_id: string;
  endpoint: string;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key: string;
  last_used: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_cost: number;
  total_tokens: number;
  total_requests: number;
  active_keys: number;
  daily_cost: { date: string; cost: number }[];
  model_breakdown: { model: string; cost: number; tokens: number; requests: number }[];
  recent_calls: UsageRecord[];
}

export interface JwtPayload {
  userId: string;
  username: string;
}
