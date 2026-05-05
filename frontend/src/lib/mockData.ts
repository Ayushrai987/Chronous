import { Patient } from '../api';

const generateVitals = (trend: 'stable' | 'deteriorating' | 'improving' | 'septic_shock' | 'dka' | 'ards' | 'cardiogenic_shock' | 'neuro_decline', baseHR: number, baseMAP: number, baseSpO2: number = 98, baseRR: number = 16, baseTemp: number = 37.0, baseLac: number = 1.0, baseGCS: number = 15, baseUO: number = 60) => {
  return Array.from({ length: 12 }).map((_, i) => {
    const hoursPast = i; // 0 to 11. i=11 is current time
    let hr = baseHR, map = baseMAP, spo2 = baseSpO2, rr = baseRR, temp = baseTemp, lac = baseLac, gcs = baseGCS, uo = baseUO;

    if (trend === 'septic_shock') {
      // Septic shock: MAP drops steadily, HR rises compensatorily, Lactate climbs, Temp spikes then might drop, UO drops
      map = baseMAP - (hoursPast * 2.5); // drops from 78 to ~50
      hr = baseHR + (hoursPast * 3.5); // rises from 88 to ~126
      lac = baseLac + (hoursPast * 0.35); // climbs from 1.8 to ~5.6
      temp = baseTemp + (hoursPast < 6 ? hoursPast * 0.2 : 1.2); // fever spike
      uo = Math.max(10, baseUO - (hoursPast * 4)); 
      rr = baseRR + (hoursPast * 0.5);
    } else if (trend === 'dka') {
      // DKA: Kussmaul breathing (high RR), tachycardia, dehydration (lower MAP), high UO initially then dropping
      rr = baseRR + (hoursPast * 0.8); // 22 to ~31
      hr = baseHR + (hoursPast * 1.5);
      map = baseMAP - (hoursPast * 0.5);
      uo = Math.max(30, 150 - (hoursPast * 10));
    } else if (trend === 'ards') {
      // ARDS: SpO2 dropping, RR climbing, HR climbing
      spo2 = baseSpO2 - (hoursPast * 0.7); // 94 to ~86
      rr = baseRR + (hoursPast * 1.2); // 20 to ~33
      hr = baseHR + (hoursPast * 1.5);
      map = baseMAP + (hoursPast * 0.5); // might be slightly hypertensive from stress
    } else if (trend === 'cardiogenic_shock') {
      // Cardiogenic shock: MAP drops severely, HR rises or irregular, SpO2 drops slightly, Lactate rises
      map = baseMAP - (hoursPast * 3);
      hr = baseHR + (hoursPast * 2);
      spo2 = baseSpO2 - (hoursPast * 0.3);
      lac = baseLac + (hoursPast * 0.4);
      uo = Math.max(5, baseUO - (hoursPast * 5));
    } else if (trend === 'neuro_decline') {
      // Neuro: GCS drops, HR might drop (Cushing's reflex), MAP rises
      gcs = Math.max(3, baseGCS - Math.floor(hoursPast * 0.4));
      map = baseMAP + (hoursPast * 2); // hypertension
      hr = Math.max(40, baseHR - (hoursPast * 1.5)); // bradycardia
      rr = Math.max(8, baseRR - (hoursPast * 0.5)); // irregular/slow breathing
    } else if (trend === 'deteriorating') {
      map = baseMAP - (hoursPast * 1.5);
      hr = baseHR + (hoursPast * 2);
      spo2 = baseSpO2 - (hoursPast * 0.5);
    } else if (trend === 'improving') {
      map = baseMAP + (hoursPast * 1.5);
      hr = baseHR - (hoursPast * 2);
      spo2 = Math.min(100, baseSpO2 + (hoursPast * 0.5));
      lac = Math.max(1.0, baseLac - (hoursPast * 0.2));
    }

    // Add some random noise
    return {
      patient_id: "mock",
      timestamp: new Date(Date.now() - (11 - i) * 3600 * 1000).toISOString(),
      heart_rate: Math.round(hr + (Math.random() * 4 - 2)),
      map_pressure: Math.round(map + (Math.random() * 4 - 2)),
      spo2: Math.min(100, Math.max(0, Math.round(spo2 + (Math.random() * 2 - 1)))),
      respiratory_rate: Math.round(rr + (Math.random() * 2 - 1)),
      temperature: Number((temp + (Math.random() * 0.4 - 0.2)).toFixed(1)),
      serum_lactate: Number((Math.max(0.1, lac + (Math.random() * 0.2 - 0.1))).toFixed(1)),
      gcs_score: gcs,
      urine_output: Math.max(0, Math.round(uo + (Math.random() * 10 - 5)))
    };
  });
};

const makePatient = (
  id: string, name: string, age: number, sex: string, bed: string, dx: string, 
  trend: any, hr: number, map: number, spo2: number, rr: number, temp: number, lac: number, gcs: number, uo: number,
  tier: 'STABLE' | 'WATCH' | 'HIGH' | 'CRITICAL', crash: number, sepsis: number, window: number,
  drivers: any[], edges: any[], action: string
): Patient => ({
  patient_id: id, name, age, sex, bed_id: bed, 
  admission_time: new Date(Date.now() - Math.random() * 5 * 24 * 3600 * 1000).toISOString(),
  assigned_nurse: ["Kavitha Nair", "Pooja Reddy", "Neha Singh", "Ritu Desai", "Meera Menon", "Sneha Patil"][Math.floor(Math.random() * 6)],
  diagnosis: dx, status: "Active", baseline_stats: {},
  crash_probability: crash, sepsis_probability: sepsis, risk_tier: tier, intervention_window: window,
  top_drivers: drivers, causal_edges: edges, 
  counterfactual: action ? [{ feature: drivers[0]?.feature || 'Vitals', current_probability: crash, post_intervention_probability: Math.max(0.1, crash - 0.3), probability_reduction: 0.3, action, icon: "⚡", intervention_window_hours: window }] : [],
  vitals: generateVitals(trend, hr, map, spo2, rr, temp, lac, gcs, uo),
  interventions: []
});

export const INITIAL_PATIENTS: Patient[] = [
  makePatient(
    "P2001", "Ramesh Iyer", 65, "M", "ICU-01", "Septic Shock / Urosepsis", 
    "septic_shock", 88, 78, 96, 18, 38.5, 1.8, 15, 40,
    "CRITICAL", 0.85, 0.92, 1.5,
    [
      { rank: 1, feature: "MAP", importance: 0.35, direction: "risk-increasing", trend: "falling", label: "MAP falling steadily to 52 — profound vasodilation" },
      { rank: 2, feature: "Serum Lactate", importance: 0.28, direction: "risk-increasing", trend: "rising", label: "Lactate climbed to 5.8 — severe tissue hypoxia" },
      { rank: 3, feature: "Heart Rate", importance: 0.15, direction: "risk-increasing", trend: "rising", label: "Compensatory tachycardia up to 128" }
    ],
    [
      { source: "MAP", target: "Serum Lactate", label: "Hypoperfusion → Anaerobic Metabolism", cascade: "Septic Shock", active: true },
      { source: "MAP", target: "Heart Rate", label: "Hypotension → Tachycardia", cascade: "Hemodynamic Collapse", active: true }
    ],
    "Initiate Norepinephrine infusion — target MAP > 65mmHg"
  ),
  makePatient(
    "P2002", "Sunita Sharma", 42, "F", "ICU-02", "Severe DKA", 
    "dka", 110, 85, 98, 22, 36.8, 1.2, 14, 150,
    "HIGH", 0.65, 0.10, 2.5,
    [
      { rank: 1, feature: "Respiratory Rate", importance: 0.30, direction: "risk-increasing", trend: "rising", label: "Kussmaul breathing pattern — RR climbed to 31" },
      { rank: 2, feature: "Heart Rate", importance: 0.20, direction: "risk-increasing", trend: "rising", label: "Dehydration driving tachycardia" }
    ],
    [{ source: "Respiratory Rate", target: "Heart Rate", label: "Acidosis → Tachycardia", cascade: "Metabolic Crisis", active: true }],
    "Increase IV fluid rate and adjust insulin protocol"
  ),
  makePatient(
    "P2003", "Anil Deshmukh", 55, "M", "ICU-03", "ARDS post Viral Pneumonia", 
    "ards", 95, 80, 94, 20, 37.8, 1.5, 15, 50,
    "CRITICAL", 0.78, 0.35, 1.0,
    [
      { rank: 1, feature: "SpO2", importance: 0.40, direction: "risk-increasing", trend: "falling", label: "SpO2 deteriorating to 86 despite O2 support" },
      { rank: 2, feature: "Respiratory Rate", importance: 0.25, direction: "risk-increasing", trend: "rising", label: "Severe tachypnea developing" }
    ],
    [{ source: "SpO2", target: "Respiratory Rate", label: "Hypoxia → Tachypnea", cascade: "Respiratory Failure", active: true }],
    "Consider early intubation and prone positioning"
  ),
  makePatient(
    "P2004", "Meena Patil", 70, "F", "ICU-04", "Cardiogenic Shock post STEMI", 
    "cardiogenic_shock", 100, 75, 95, 18, 36.5, 2.0, 14, 30,
    "CRITICAL", 0.90, 0.15, 0.5,
    [
      { rank: 1, feature: "MAP", importance: 0.38, direction: "risk-increasing", trend: "falling", label: "Pump failure causing MAP drop" },
      { rank: 2, feature: "Urine Output", importance: 0.22, direction: "risk-increasing", trend: "falling", label: "Renal hypoperfusion" }
    ],
    [{ source: "MAP", target: "Urine Output", label: "Hypotension → AKI", cascade: "Organ Failure", active: true }],
    "Start Inotropic support (Dobutamine) immediately"
  ),
  makePatient(
    "P2005", "Vivek Menon", 38, "M", "ICU-05", "Traumatic Brain Injury", 
    "neuro_decline", 75, 90, 99, 16, 37.2, 1.0, 13, 60,
    "HIGH", 0.72, 0.05, 1.5,
    [
      { rank: 1, feature: "GCS Score", importance: 0.45, direction: "risk-increasing", trend: "falling", label: "GCS dropped from 13 to 8" },
      { rank: 2, feature: "MAP", importance: 0.20, direction: "risk-increasing", trend: "rising", label: "Hypertension (Cushing reflex)" },
      { rank: 3, feature: "Heart Rate", importance: 0.15, direction: "risk-increasing", trend: "falling", label: "Bradycardia developing" }
    ],
    [{ source: "MAP", target: "Heart Rate", label: "ICP Spike → Cushing Reflex", cascade: "Herniation", active: true }],
    "Administer Hyperosmolar therapy (Mannitol) and arrange urgent CT"
  ),
  makePatient(
    "P2006", "Sneha Reddy", 48, "F", "ICU-06", "Post-Op Bowel Resection", 
    "improving", 110, 65, 94, 20, 38.0, 3.0, 15, 40,
    "WATCH", 0.25, 0.45, 6.0,
    [
      { rank: 1, feature: "Serum Lactate", importance: 0.25, direction: "risk-decreasing", trend: "falling", label: "Lactate clearance improving" }
    ],
    [],
    ""
  ),
  makePatient("P2007", "Rajiv Khanna", 62, "M", "ICU-07", "Exacerbation of COPD", "stable", 85, 80, 92, 18, 36.9, 1.2, 15, 50, "STABLE", 0.12, 0.08, 0, [], [], ""),
  makePatient("P2008", "Priya Das", 29, "F", "ICU-08", "Dengue Hemorrhagic Fever", "deteriorating", 100, 85, 98, 16, 39.0, 1.5, 15, 40, "WATCH", 0.40, 0.30, 4.5, [{ rank: 1, feature: "Heart Rate", importance: 0.2, direction: "risk-increasing", trend: "rising", label: "Tachycardia worsening" }], [], "Monitor hematocrit and platelet count closely"),
  makePatient("P2009", "Sanjay Gupta", 54, "M", "ICU-09", "Acute Pancreatitis", "septic_shock", 95, 80, 96, 20, 37.5, 2.2, 15, 45, "HIGH", 0.68, 0.75, 2.0, [{ rank: 1, feature: "MAP", importance: 0.25, direction: "risk-increasing", trend: "falling", label: "MAP starting to drift down" }], [], "Aggressive fluid resuscitation"),
  makePatient("P2010", "Kavita Singh", 66, "F", "ICU-10", "Pulmonary Embolism", "ards", 105, 85, 92, 24, 37.1, 1.8, 15, 55, "HIGH", 0.60, 0.10, 3.0, [{ rank: 1, feature: "SpO2", importance: 0.3, direction: "risk-increasing", trend: "falling", label: "Refractory hypoxemia" }], [], "Consider thrombolysis evaluation"),
  makePatient("P2011", "Arun Prakash", 71, "M", "ICU-11", "Ischemic Stroke", "stable", 75, 95, 97, 14, 36.8, 1.1, 12, 60, "STABLE", 0.15, 0.05, 0, [], [], ""),
  makePatient("P2012", "Neha Joshi", 33, "F", "ICU-12", "Post-partum Hemorrhage", "improving", 115, 60, 98, 22, 37.0, 4.5, 14, 20, "WATCH", 0.35, 0.15, 5.0, [{ rank: 1, feature: "MAP", importance: 0.3, direction: "risk-decreasing", trend: "rising", label: "MAP recovering post-transfusion" }], [], ""),
  makePatient("P2013", "Vikram Bajaj", 59, "M", "ICU-13", "Cirrhosis with Variceal Bleed", "deteriorating", 90, 75, 95, 18, 36.5, 2.5, 13, 35, "HIGH", 0.55, 0.40, 2.5, [{ rank: 1, feature: "MAP", importance: 0.25, direction: "risk-increasing", trend: "falling", label: "MAP dropping, possible re-bleed" }], [], "Prepare for emergent endoscopy"),
  makePatient("P2014", "Deepa Rao", 45, "F", "ICU-14", "Status Epilepticus", "neuro_decline", 120, 90, 93, 26, 38.2, 3.5, 8, 45, "CRITICAL", 0.82, 0.20, 1.0, [{ rank: 1, feature: "GCS Score", importance: 0.3, direction: "risk-increasing", trend: "falling", label: "GCS remains poor post-seizure" }], [], "Continuous EEG monitoring and adjust antiepileptics"),
  makePatient("P2015", "Mohan Lal", 78, "M", "ICU-15", "Congestive Heart Failure Exacerbation", "improving", 85, 85, 90, 24, 36.7, 1.4, 15, 80, "STABLE", 0.18, 0.10, 0, [], [], "")
];

export const INITIAL_ALERTS = [
  { id: 'A1', timestamp: new Date(Date.now() - 1200000).toISOString(), patientId: 'P2001', patientName: 'Ramesh Iyer', bedId: 'ICU-01', type: 'Sepsis Risk', riskTier: 'CRITICAL', score: 0.92, drivers: ['Serum Lactate', 'MAP'], intervened: false, vitals: { heart_rate: 125, map_pressure: 54, spo2: 92, serum_lactate: 5.5 } },
  { id: 'A2', timestamp: new Date(Date.now() - 3600000).toISOString(), patientId: 'P2003', patientName: 'Anil Deshmukh', bedId: 'ICU-03', type: 'Respiratory', riskTier: 'CRITICAL', score: 0.78, drivers: ['SpO2', 'Respiratory Rate'], intervened: false, vitals: { heart_rate: 110, map_pressure: 85, spo2: 87, serum_lactate: 1.8 } },
  { id: 'A3', timestamp: new Date(Date.now() - 7200000).toISOString(), patientId: 'P2004', patientName: 'Meena Patil', bedId: 'ICU-04', type: 'Cardiac Risk', riskTier: 'CRITICAL', score: 0.90, drivers: ['MAP', 'Urine Output'], intervened: false, vitals: { heart_rate: 120, map_pressure: 55, spo2: 92, serum_lactate: 2.5 } },
  { id: 'A4', timestamp: new Date(Date.now() - 10800000).toISOString(), patientId: 'P2002', patientName: 'Sunita Sharma', bedId: 'ICU-02', type: 'Metabolic', riskTier: 'HIGH', score: 0.65, drivers: ['Respiratory Rate'], intervened: true, vitals: { heart_rate: 128, map_pressure: 80, spo2: 98, serum_lactate: 1.2 } },
  { id: 'A5', timestamp: new Date(Date.now() - 14400000).toISOString(), patientId: 'P2005', patientName: 'Vivek Menon', bedId: 'ICU-05', type: 'Neurological', riskTier: 'HIGH', score: 0.72, drivers: ['GCS Score', 'MAP'], intervened: true, vitals: { heart_rate: 55, map_pressure: 110, spo2: 99, serum_lactate: 1.0 } },
];
