import { Patient, VitalReading } from '../api';

const INDIAN_NAMES_M = [
  "Aarav Sharma", "Arjun Patel", "Rohan Gupta", "Vikram Singh", "Sanjay Kumar", 
  "Aditya Reddy", "Ishaan Malhotra", "Vivek Menon", "Anil Deshmukh", "Rajesh Khanna",
  "Karan Johar", "Rahul Dravid", "Sunil Gavaskar", "Virat Kohli", "Suresh Raina",
  "Abhishek Bachchan", "Hrithik Roshan", "Ranbir Kapoor", "Ayushmann Khurrana", "Pankaj Tripathi",
  "Nawazuddin Siddiqui", "Manoj Bajpayee", "Irfaan Khan", "Shah Rukh Khan", "Salman Khan",
  "Aamir Khan", "Akshay Kumar", "Ajay Devgn", "Saif Ali Khan", "Ranveer Singh",
  "Varun Dhawan", "Siddharth Malhotra", "Ishaan Khatter", "Kartik Aaryan", "Vicky Kaushal",
  "Rajkummar Rao", "Ayush Rai", "Umesh Chaudhary", "Prakash Nambiar", "Ramesh Agarwal",
  "Suresh Prabhu", "Nitin Gadkari", "Arvind Kejriwal", "Yogi Adityanath", "Mamata Banerjee",
  "Rahul Gandhi", "Amit Shah", "Narendra Modi", "Manmohan Singh", "Pranab Mukherjee",
  "Abdul Kalam", "Atal Bihari", "Lal Bahadur", "Jawaharlal Nehru", "Subhash Chandra"
];

const INDIAN_NAMES_F = [
  "Ananya Iyer", "Priya Das", "Neha Joshi", "Sneha Patil", "Kavita Singh",
  "Savitri Desai", "Meena Patil", "Deepa Rao", "Sunita Sharma", "Ritu Desai",
  "Meera Menon", "Kavitha Nair", "Pooja Reddy", "Neha Singh", "Shanti Devi",
  "Radha Rani", "Laxmi Bai", "Sarojini Naidu", "Indira Gandhi", "Sushma Swaraj",
  "Nirmala Sitharaman", "Smriti Irani", "Kiran Bedi", "Mary Kom", "Saina Nehwal",
  "P.V. Sindhu", "Mithali Raj", "Jhulan Goswami", "Harmanpreet Kaur", "Smriti Mandhana",
  "Deepika Padukone", "Priyanka Chopra", "Alia Bhatt", "Shraddha Kapoor", "Kriti Sanon",
  "Kiara Advani", "Rashmika Mandanna", "Samantha Ruth", "Nayanthara", "Anushka Shetty",
  "Trisha Krishnan", "Kajal Aggarwal", "Tamannaah Bhatia", "Rakul Preet", "Taapsee Pannu",
  "Vidya Balan", "Rani Mukerji", "Kajol", "Madhuri Dixit", "Sridevi",
  "Rekha", "Hema Malini", "Jaya Bachchan", "Aishwarya Rai", "Kareena Kapoor"
];

const DIAGNOSES = [
  "Septic Shock", "ARDS", "AMI", "DKA", "Hypertensive Emergency", 
  "AKI on CRRT", "Acute Liver Failure", "TBI post neurosurgery", "Pulmonary Embolism", 
  "Decompensated Heart Failure", "Cerebral Malaria", "GI Bleed with hemorrhagic shock", 
  "Snake Envenomation", "Ischemic Stroke", "Polytrauma post RTA", "Post-CABG Recovery", 
  "Pneumonia with respiratory failure", "Meningococcal Sepsis", "Dengue with shock syndrome", 
  "Acute Pancreatitis with MODS", "Eclampsia post partum", "Acute Renal Failure", 
  "Anaphylactic Shock", "Carbon Monoxide Poisoning", "Organophosphate Poisoning"
];

const generateVitals = (trend: string, base: any, noise: number = 2) => {
  return Array.from({ length: 12 }).map((_, i) => {
    const hoursPast = i;
    let hr = base.hr, map = base.map, spo2 = base.spo2, rr = base.rr, temp = base.temp, lac = base.lac, gcs = base.gcs, uo = base.uo;

    if (trend === 'deceased_gradual') {
      // Ramesh Agarwal pattern: MAP 65 -> 0, HR 124 -> 0, etc.
      map = Math.max(0, 65 - (hoursPast * 6));
      hr = Math.max(0, 124 - (hoursPast * 11));
      spo2 = Math.max(0, 88 - (hoursPast * 8));
      rr = Math.max(0, 32 - (hoursPast * 3));
      gcs = Math.max(3, 8 - (hoursPast * 0.5));
      if (hoursPast >= 10) { map = 0; hr = 0; spo2 = 0; rr = 0; gcs = 3; }
    } else if (trend === 'deceased_sudden') {
      // Savitri Desai pattern: sudden collapse
      if (hoursPast < 10) {
        hr = 95; map = 75; spo2 = 94; rr = 18;
      } else {
        hr = 0; map = 0; spo2 = 0; rr = 0; gcs = 3;
      }
    } else if (trend === 'hardware_failure') {
      // Prakash Nambiar pattern: HR/MAP drop at hour 9
      if (hoursPast >= 9) {
        hr = 0; map = 0;
      }
    } else if (trend === 'deteriorating') {
      hr += hoursPast * 2;
      map -= hoursPast * 1.5;
      spo2 -= hoursPast * 0.5;
    } else if (trend === 'stable') {
      hr += Math.random() * 2 - 1;
    }

    return {
      patient_id: "mock",
      timestamp: new Date(Date.now() - (11 - i) * 3600 * 1000).toISOString(),
      heart_rate: Math.round(hr),
      map_pressure: Math.round(map),
      spo2: Math.min(100, Math.max(0, Math.round(spo2))),
      respiratory_rate: Math.round(rr),
      temperature: Number(temp.toFixed(1)),
      serum_lactate: Number(lac.toFixed(1)),
      gcs_score: Math.round(gcs),
      urine_output: Math.max(0, Math.round(uo))
    };
  });
};

const makePatient = (i: number, overrides: Partial<Patient> = {}): Patient => {
  const isMale = Math.random() > 0.5;
  const name = isMale ? INDIAN_NAMES_M[i % INDIAN_NAMES_M.length] : INDIAN_NAMES_F[i % INDIAN_NAMES_F.length];
  const age = 20 + Math.floor(Math.random() * 60);
  const sex = isMale ? "M" : "F";
  const bedId = `ICU-${String.fromCharCode(65 + Math.floor(i / 10))}${i % 10 + 1}`;
  const dx = DIAGNOSES[i % DIAGNOSES.length];
  
  const tiers: ('STABLE' | 'WATCH' | 'HIGH' | 'CRITICAL')[] = ['STABLE', 'WATCH', 'HIGH', 'CRITICAL'];
  const tier = tiers[i % 4];
  const crash = tier === 'CRITICAL' ? 0.8 + Math.random() * 0.15 : tier === 'HIGH' ? 0.5 + Math.random() * 0.2 : 0.1 + Math.random() * 0.3;

  const base = { hr: 80, map: 75, spo2: 97, rr: 16, temp: 37.0, lac: 1.2, gcs: 15, uo: 50 };

  return {
    patient_id: `P-${1000 + i}`,
    name, age, sex, bed_id: bedId,
    admission_time: new Date(Date.now() - Math.random() * 10 * 24 * 3600 * 1000).toISOString(),
    assigned_nurse: ["Kavitha Nair", "Pooja Reddy", "Neha Singh", "Ritu Desai", "Meera Menon", "Sneha Patil"][i % 6],
    attending_physician: ["Dr. V. Rao", "Dr. S. Mukherjee", "Dr. A. Kulkarni", "Dr. R. Gupta"][i % 4],
    diagnosis: dx,
    status: "Active",
    baseline_stats: {},
    crash_probability: Number(crash.toFixed(2)),
    sepsis_probability: Number((crash * 0.8).toFixed(2)),
    risk_tier: tier,
    intervention_window: tier === 'CRITICAL' ? 1.5 : tier === 'HIGH' ? 3.0 : 6.0,
    top_drivers: [
      { rank: 1, feature: "MAP", importance: 0.3, direction: "risk-increasing", trend: "falling", label: "MAP unstable" }
    ],
    causal_edges: [],
    counterfactual: [],
    vitals: generateVitals("stable", base),
    interventions: [],
    alert_history: [],
    clinical_notes: `Patient admitted for ${dx}. Monitoring vitals and starting standard protocol.`,
    ...overrides
  };
};

// Generate 108 patients
const patients: Patient[] = [];

// Specific Deceased 1: Ramesh Agarwal
patients.push(makePatient(0, {
  name: "Ramesh Agarwal", age: 71, sex: "M", bed_id: "ICU-B2", 
  diagnosis: "Refractory Septic Shock with Multi-Organ Failure",
  status: "Deceased", risk_tier: "CRITICAL", crash_probability: 0.99,
  vitals: generateVitals("deceased_gradual", { hr: 124, map: 65, spo2: 88, rr: 32, temp: 38.5, lac: 6.2, gcs: 8, uo: 10 }),
  clinical_notes: "Physiological cessation confirmed after multi-organ failure. Time of death logged after clinical verification."
}));

// Specific Deceased 2: Savitri Desai
patients.push(makePatient(1, {
  name: "Savitri Desai", age: 84, sex: "F", bed_id: "ICU-C1",
  diagnosis: "Massive Pulmonary Embolism with Cardiac Arrest",
  status: "Deceased", risk_tier: "CRITICAL", crash_probability: 0.99,
  vitals: generateVitals("deceased_sudden", { hr: 95, map: 75, spo2: 94, rr: 18, temp: 37.0, lac: 1.5, gcs: 15, uo: 50 }),
  clinical_notes: "Sudden cardiac collapse refractory to resuscitation."
}));

// Specific Hardware Failure: Prakash Nambiar
patients.push(makePatient(2, {
  name: "Prakash Nambiar", age: 58, sex: "M", bed_id: "ICU-D3",
  diagnosis: "Post-Cardiac Surgery Day 2",
  status: "Hardware Failure", risk_tier: "STABLE", crash_probability: 0.15,
  vitals: generateVitals("hardware_failure", { hr: 80, map: 85, spo2: 98, rr: 16, temp: 37.0, lac: 1.2, gcs: 15, uo: 60 }),
  clinical_notes: "Sensor fault detected on HR and MAP transducers. Rest of vitals remain nominal."
}));

// 80 Active (remaining)
for (let i = 3; i < 83; i++) {
  patients.push(makePatient(i));
}

// 15 Discharged
for (let i = 83; i < 98; i++) {
  patients.push(makePatient(i, { status: "Discharged", risk_tier: "STABLE", crash_probability: 0.05 }));
}

// 10 Transferred
for (let i = 98; i < 108; i++) {
  patients.push(makePatient(i, { status: "Transferred", risk_tier: "STABLE", crash_probability: 0.10 }));
}

export const INITIAL_PATIENTS = patients;

export const INITIAL_ALERTS = [
  { id: 'A1', timestamp: new Date(Date.now() - 1200000).toISOString(), patientId: 'P-1000', patientName: 'Ramesh Agarwal', bedId: 'ICU-B2', type: 'Critical Decline', riskTier: 'CRITICAL', score: 0.99, drivers: ['MAP', 'Lactate'], intervened: true, vitals: { heart_rate: 0, map_pressure: 0, spo2: 0, serum_lactate: 12.8 } },
];
