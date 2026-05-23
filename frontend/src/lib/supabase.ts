import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  is_guest: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
};

export type AudioFile = {
  id: string;
  user_id: string;
  original_filename: string;
  file_size: number;
  duration: number | null;
  format: string;
  processing_steps: ProcessingStep[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
};

export type ProcessingStep = {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed';
  progress: number;
};
