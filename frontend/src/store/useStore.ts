import { create } from 'zustand';
import { Patient, VitalReading } from '../api';
import { INITIAL_PATIENTS, INITIAL_ALERTS } from '../lib/mockData';

type Role = 'Attending Physician' | 'ICU Nurse' | 'Resident' | 'Charge Nurse' | null;

interface Toast {
  id: string;
  type: 'success' | 'warning' | 'critical' | 'info';
  message: string;
}

interface DeathLog {
  patientId: string;
  confirmedAt: string;
  physicianNote: string;
  vitalsAtDeath: VitalReading;
}

interface AppState {
  // Auth
  role: Role;
  login: (role: Role) => void;
  logout: () => void;

  // Settings
  demoMode: boolean;
  toggleDemoMode: () => void;
  thresholds: { critical: number; high: number; watch: number };
  setThresholds: (thresholds: { critical: number; high: number; watch: number }) => void;

  // Data
  patients: Patient[];
  alerts: any[];
  deathLogs: Record<string, DeathLog>;
  setPatients: (patients: Patient[]) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  
  // Death Confirmation Engine
  codeBluePatient: string | null;
  triggerCodeBlue: (patientId: string) => void;
  confirmDeath: (patientId: string, note: string) => void;
  cancelCodeBlue: (patientId: string) => void;

  // UI
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  
  // Shadow Testing
  shadowMode: boolean;
  toggleShadowMode: () => void;
  patientAssessments: Record<string, string>;
  submitAssessment: (patientId: string, assessment: string) => void;

  // Integration
  integrationStatus: Record<string, 'Connected' | 'Simulated' | 'Not Configured'>;
  hl7Logs: { id: string; msg: string; timestamp: string }[];
  addHl7Log: (msg: string) => void;

  // Simulator Actions
  simulateGradualDeath: (patientId: string) => void;
  simulateHardwareFailure: (patientId: string) => void;
  simulateHardwareRecovery: (patientId: string) => void;
  addPatient: (patient: Patient) => void;
  markAlertLogged: (alertId: string) => void;
  
  // Demo Mode
  demoModeActive: boolean;
  setDemoModeActive: (active: boolean) => void;
  demoVitals: VitalReading | null;
  setDemoVitals: (vitals: VitalReading | null) => void;
  demoProbability: number;
  setDemoProbability: (prob: number) => void;
  demoCountdown: number;
  setDemoCountdown: (mins: number) => void;
}

export const useStore = create<AppState>((set, get) => ({
  role: null,
  login: (role) => set({ role }),
  logout: () => set({ role: null }),

  demoMode: false,
  toggleDemoMode: () => set((state) => ({ demoMode: !state.demoMode })),
  
  thresholds: { critical: 75, high: 50, watch: 25 },
  setThresholds: (thresholds) => set({ thresholds }),

  patients: INITIAL_PATIENTS,
  alerts: INITIAL_ALERTS,
  deathLogs: {},
  
  setPatients: (patients) => set({ patients }),
  updatePatient: (id, updates) => set((state) => ({
    patients: state.patients.map(p => p.patient_id === id ? { ...p, ...updates } : p)
  })),

  codeBluePatient: null,
  
  triggerCodeBlue: (patientId) => {
    set({ codeBluePatient: patientId });
    get().addToast({ type: 'critical', message: `CODE BLUE: Bed ${get().patients.find(p => p.patient_id === patientId)?.bed_id}` });
  },

  confirmDeath: (patientId, note) => {
    const patient = get().patients.find(p => p.patient_id === patientId);
    if (!patient) return;

    const deathLog: DeathLog = {
      patientId,
      confirmedAt: new Date().toISOString(),
      physicianNote: note,
      vitalsAtDeath: patient.vitals[0] // Latest
    };

    set((state) => ({
      codeBluePatient: null,
      deathLogs: { ...state.deathLogs, [patientId]: deathLog },
      patients: state.patients.map(p => 
        p.patient_id === patientId ? { ...p, status: 'Deceased', risk_tier: 'CRITICAL' as any } : p
      )
    }));
    
    get().addToast({ type: 'info', message: `Death confirmed for ${patient.name}` });
  },

  cancelCodeBlue: (patientId) => set({ codeBluePatient: null }),

  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => {
      const newToasts = [...state.toasts, { ...toast, id }];
      if (newToasts.length > 3) newToasts.shift();
      return { toasts: newToasts };
    });
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 5000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),

  // Simulator Actions
  simulateGradualDeath: (patientId) => {
    const steps = 5;
    let step = 0;
    const interval = setInterval(() => {
      const p = get().patients.find(p => p.patient_id === patientId);
      if (!p || step >= steps) {
        clearInterval(interval);
        if (p) get().triggerCodeBlue(patientId);
        return;
      }

      const factor = (steps - step) / steps;
      const newVitals: VitalReading = {
        ...p.vitals[0],
        heart_rate: Math.round(p.vitals[0].heart_rate * factor),
        map_pressure: Math.round(p.vitals[0].map_pressure * factor),
        spo2: Math.round(p.vitals[0].spo2 * factor),
        respiratory_rate: Math.round(p.vitals[0].respiratory_rate * factor),
        gcs_score: Math.max(3, Math.round(p.vitals[0].gcs_score * factor)),
        timestamp: new Date().toISOString()
      };

      get().updatePatient(patientId, { vitals: [newVitals, ...p.vitals.slice(0, 11)] });
      step++;
    }, 5000); // Progress every 5s for demo speed
  },

  simulateHardwareFailure: (patientId) => {
    const p = get().patients.find(p => p.patient_id === patientId);
    if (!p) return;
    const failedVitals: VitalReading = {
      ...p.vitals[0],
      heart_rate: 0,
      map_pressure: 0,
      timestamp: new Date().toISOString()
    };
    get().updatePatient(patientId, { 
      status: 'Hardware Failure', 
      vitals: [failedVitals, ...p.vitals.slice(0, 11)] 
    });
    get().addToast({ type: 'warning', message: `Hardware Fault: ICU-D3 Sensor Dropout` });
  },

  simulateHardwareRecovery: (patientId) => {
    const p = get().patients.find(p => p.patient_id === patientId);
    if (!p) return;
    const recoveredVitals: VitalReading = {
      ...p.vitals[0],
      heart_rate: 82,
      map_pressure: 88,
      timestamp: new Date().toISOString()
    };
    get().updatePatient(patientId, { 
      status: 'Active', 
      vitals: [recoveredVitals, ...p.vitals.slice(0, 11)] 
    });
    get().addToast({ type: 'success', message: `Sensors Restored: ICU-D3 Online` });
  },

  // Shadow Testing
  shadowMode: false,
  toggleShadowMode: () => set((state) => ({ shadowMode: !state.shadowMode })),
  patientAssessments: {},
  submitAssessment: (patientId, assessment) => set((state) => ({
    patientAssessments: { ...state.patientAssessments, [patientId]: assessment }
  })),

  // Integration
  integrationStatus: {
    'HL7 v2 Listener': 'Simulated',
    'FHIR R4 Endpoint': 'Simulated',
    'Epic SMART on FHIR': 'Simulated',
    'Cerner Millennium API': 'Simulated',
    'Generic HIS REST Connector': 'Simulated'
  },
  hl7Logs: [],
  addHl7Log: (msg) => set((state) => {
    const newLogs = [{ id: Math.random().toString(36).substring(7), msg, timestamp: new Date().toLocaleTimeString() }, ...state.hl7Logs];
    return { hl7Logs: newLogs.slice(0, 50) };
  }),

  addPatient: (patient) => set((state) => ({
    patients: [patient, ...state.patients]
  })),

  markAlertLogged: (alertId) => set((state) => ({
    alerts: state.alerts.map(a => a.id === alertId ? { ...a, intervened: true } : a)
  })),

  demoModeActive: false,
  setDemoModeActive: (active) => set({ demoModeActive: active }),
  demoVitals: null,
  setDemoVitals: (vitals) => set({ demoVitals: vitals }),
  demoProbability: 0.55,
  setDemoProbability: (prob) => set({ demoProbability: prob }),
  demoCountdown: 180, // 3 hours in minutes
  setDemoCountdown: (mins) => set({ demoCountdown: mins })
}));
