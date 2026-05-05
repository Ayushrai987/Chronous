import { create } from 'zustand';
import { Patient } from '../api';
import { INITIAL_PATIENTS, INITIAL_ALERTS } from '../lib/mockData';

type Role = 'Attending Physician' | 'ICU Nurse' | 'Resident' | 'Charge Nurse' | null;

interface Toast {
  id: string;
  type: 'success' | 'warning' | 'critical';
  message: string;
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
  setPatients: (patients: Patient[]) => void;
  addPatient: (p: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  logIntervention: (patientId: string, interventionType: string, notes: string) => void;
  markAlertLogged: (alertId: string) => void;
  
  // UI
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  role: null,
  login: (role) => set({ role }),
  logout: () => set({ role: null }),

  demoMode: false,
  toggleDemoMode: () => set((state) => ({ demoMode: !state.demoMode })),
  
  thresholds: { critical: 75, high: 50, watch: 25 },
  setThresholds: (thresholds) => set({ thresholds }),

  patients: INITIAL_PATIENTS,
  alerts: INITIAL_ALERTS,
  setPatients: (patients) => set({ patients }),
  addPatient: (p) => set((state) => ({ patients: [...state.patients, p] })),
  updatePatient: (id, updates) => set((state) => ({
    patients: state.patients.map(p => p.patient_id === id ? { ...p, ...updates } : p)
  })),
  logIntervention: (patientId, interventionType, notes) => set((state) => ({
    patients: state.patients.map(p => {
      if (p.patient_id === patientId) {
        return {
          ...p,
          interventions: [{ id: Date.now().toString(), type: interventionType, notes, timestamp: new Date().toISOString() }, ...(p.interventions || [])]
        };
      }
      return p;
    }),
    alerts: state.alerts.map(a => a.patientId === patientId && !a.intervened ? { ...a, intervened: true } : a)
  })),
  markAlertLogged: (alertId) => set((state) => ({
    alerts: state.alerts.map(a => a.id === alertId ? { ...a, intervened: true } : a)
  })),

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
}));
