/**
 * API client for Project Chronos backend.
 * All calls are local — no external network requests.
 */

const API_BASE = '/api';

export interface VitalReading {
  id?: number;
  patient_id: string;
  timestamp: string;
  heart_rate: number;
  map_pressure: number;
  spo2: number;
  respiratory_rate: number;
  temperature: number;
  serum_lactate: number;
  gcs_score: number;
  urine_output: number;
  is_missing?: number;
}

export interface TopDriver {
  rank: number;
  feature: string;
  importance: number;
  direction: 'risk-increasing' | 'risk-decreasing';
  trend: 'rising' | 'falling' | 'stable';
  label: string;
}

export interface CausalEdge {
  source: string;
  target: string;
  label: string;
  cascade: string;
  active: boolean;
}

export interface Counterfactual {
  feature: string;
  current_probability: number;
  post_intervention_probability: number;
  probability_reduction: number;
  action: string;
  icon: string;
  intervention_window_hours: number;
}

export interface Patient {
  patient_id: string;
  name: string;
  age: number;
  sex: string;
  bed_id: string;
  admission_time: string;
  assigned_nurse?: string;
  attending_physician?: string;
  diagnosis: string;
  allergies?: string[];
  medications?: string[];
  status: string;
  baseline_stats: Record<string, { mean: number; std: number }>;
  crash_probability: number;
  sepsis_probability: number;
  risk_tier: 'CRITICAL' | 'HIGH' | 'WATCH' | 'STABLE';
  top_drivers: TopDriver[];
  causal_edges: CausalEdge[];
  counterfactual: Counterfactual[];
  intervention_window: number;
  vitals: VitalReading[];
  shap_values?: number[][];
  is_new?: boolean;
  interventions?: any[];
  alert_history?: any[];
  clinical_notes?: string;
}

export interface PatientsResponse {
  timestamp: string;
  patient_count: number;
  patients: Patient[];
}

export async function fetchPatients(): Promise<PatientsResponse> {
  const res = await fetch(`${API_BASE}/patients`);
  if (!res.ok) throw new Error(`Failed to fetch patients: ${res.status}`);
  return res.json();
}

export async function fetchPatient(patientId: string): Promise<Patient> {
  const res = await fetch(`${API_BASE}/patients/${patientId}`);
  if (!res.ok) throw new Error(`Failed to fetch patient: ${res.status}`);
  return res.json();
}

export async function fetchShiftBrief(): Promise<string> {
  const res = await fetch(`${API_BASE}/shift-brief`);
  if (!res.ok) throw new Error(`Failed to fetch shift brief: ${res.status}`);
  return res.text();
}

export async function fetchSystemStatus(): Promise<{
  status: string;
  crash_model_loaded: boolean;
  sepsis_model_loaded: boolean;
  simulator_running: boolean;
  total_patients: number;
}> {
  const res = await fetch(`${API_BASE}/system-status`);
  if (!res.ok) throw new Error(`Failed to fetch status: ${res.status}`);
  return res.json();
}

export function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    CRITICAL: '#dc2626',
    HIGH: '#d97706',
    WATCH: '#ca8a04',
    STABLE: '#16a34a',
  };
  return colors[tier] || '#6b7280';
}

export function getTierBg(tier: string): string {
  const colors: Record<string, string> = {
    CRITICAL: 'rgba(220, 38, 38, 0.08)',
    HIGH: 'rgba(217, 119, 6, 0.08)',
    WATCH: 'rgba(202, 138, 4, 0.08)',
    STABLE: 'rgba(22, 163, 74, 0.08)',
  };
  return colors[tier] || 'rgba(107, 114, 128, 0.08)';
}

export const FEATURE_UNITS: Record<string, string> = {
  'Heart Rate': 'bpm',
  'MAP': 'mmHg',
  'SpO2': '%',
  'Respiratory Rate': '/min',
  'Temperature': '°C',
  'Serum Lactate': 'mmol/L',
  'GCS Score': '/15',
  'Urine Output': 'mL/hr',
};

export const VITAL_KEYS = [
  'heart_rate', 'map_pressure', 'spo2', 'respiratory_rate',
  'temperature', 'serum_lactate', 'gcs_score', 'urine_output'
] as const;

export const VITAL_LABELS: Record<string, string> = {
  heart_rate: 'Heart Rate',
  map_pressure: 'MAP',
  spo2: 'SpO2',
  respiratory_rate: 'Resp. Rate',
  temperature: 'Temp',
  serum_lactate: 'Lactate',
  gcs_score: 'GCS',
  urine_output: 'Urine Output',
};

export const VITAL_COLORS: Record<string, string> = {
  heart_rate: '#e05555',
  map_pressure: '#5588dd',
  spo2: '#44aa88',
  respiratory_rate: '#8899aa',
  temperature: '#d97706',
  serum_lactate: '#ca8a04',
  gcs_score: '#16a34a',
  urine_output: '#4f83cc',
};
