export interface Application {
  id: string;
  created_at: string;
  updated_at: string;
  form_data: Record<string, any>;
  looking_for: 'freelance' | 'fulltime';
  first_name: string;
  last_name: string;
  email: string;
  linkedin_url: string;
  status: 'pending' | 'processing' | 'analyzed' | 'failed';
  processing_started_at?: string;
  processing_completed_at?: string;
  scraped_content?: string;
  scraped_linkedin?: Record<string, any>;
}

export interface CandidateAnalysis {
  id: string;
  application_id: string;
  overall_score?: number;
  category_scores?: Record<string, any>;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string;
  fit_assessment?: string;
  linkedin_data?: Record<string, any>;
  portfolio_data?: Record<string, any>;
  documents_data?: Record<string, any>;
  analysis_version?: string;
  model_used?: string;
  created_at: string;
  updated_at: string;
  red_flags?: string[];
  next_steps?: string[];
  data_quality_assessment?: Record<string, any>;
}

export interface CandidateDocument {
  id: string;
  application_id: string;
  file_url?: string;
  file_type?: string;
  original_filename?: string;
  file_size_bytes?: number;
  extracted_content?: string;
  metadata?: Record<string, any>;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface CandidateWithAnalysis extends Application {
  candidate_analysis?: CandidateAnalysis;
  documents?: CandidateDocument[];
  document_count?: number;
}

export interface FilterOptions {
  status?: string;
  looking_for?: string;
  specialization?: string;
  rate_range?: string;
  score_min?: number;
  score_max?: number;
  search?: string;
  sort_by?: 'created_at' | 'overall_score' | 'first_name' | 'last_name';
  sort_order?: 'asc' | 'desc';
}
