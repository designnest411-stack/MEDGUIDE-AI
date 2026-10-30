/**
 * Realistic Indian Clinical Patient Cohort
 * Provides 6 diverse, high-fidelity patient cases across major medical specialties:
 * - Cardiology (Acute Anterior STEMI with Aspirin Allergy)
 * - Pulmonology (Severe Lobar Pneumonia with Penicillin Anaphylaxis)
 * - Nephrology & Endocrinology (DKD Stage 4 with NSAID & Metformin Alerts)
 * - Neurology (Acute Ischemic Stroke with Atrial Fibrillation)
 * - Hepatology (Decompensated HBV Cirrhosis & Encephalopathy)
 * - Rheumatology (Systemic Lupus Erythematosus with Active Nephritis)
 */

import { addDoc } from "firebase/firestore";
import { getCollections, type PatientRecord, type TimelineEvent } from "./db";

export interface SeedPatientWithTimeline {
  patient: Omit<PatientRecord, "createdAt">;
  timeline: Array<Omit<TimelineEvent, "createdAt" | "patientId">>;
}

export const INDIAN_CLINICAL_COHORT: SeedPatientWithTimeline[] = [
  {
    patient: {
      name: "Rajesh Kumar Sharma",
      age: "58",
      sex: "Male",
      question:
        "58-year-old male with type 2 diabetes and hypertension presenting with crushing retrosternal chest pain radiating to left jaw, diaphoresis, and acute dyspnea for 90 minutes. ECG confirms 2mm ST elevation in V1-V4.",
      history:
        "Type 2 Diabetes Mellitus (12 years, HbA1c 8.6%), Essential Hypertension (8 years), Dyslipidemia. 25 pack-year smoking history, quit 6 months ago. Family history of premature CAD in father.",
      medications:
        "Metformin 1000mg BID, Glimepiride 2mg OD, Telmisartan 40mg OD, Atorvastatin 20mg HS.",
      allergies:
        "Aspirin (severe bronchospasm and facial angioedema documented 3 years ago; contraindicates standard ASA loading in acute coronary protocol).",
      vitals:
        "BP: 154/94 mmHg, HR: 102 bpm (regular sinus tachycardia), RR: 22/min, SpO2: 94% on room air, Temp: 36.8°C, BMI: 27.8 kg/m².",
      labs: "High-sensitivity Troponin-I: 1.84 ng/mL (elevated, ref <0.04), CK-MB: 48 U/L, HbA1c: 8.6%, Random Blood Glucose: 214 mg/dL, Serum Creatinine: 1.1 mg/dL, eGFR: 74 mL/min/1.73m², Potassium: 4.2 mEq/L, Total Cholesterol: 238 mg/dL, LDL: 152 mg/dL.",
    },
    timeline: [
      {
        date: "Today, 06:30 AM",
        kind: "symptom",
        title: "Acute Retrosternal Chest Pain",
        detail:
          "Sudden onset crushing central chest tightness radiating to the left arm and lower jaw, accompanied by profuse cold diaphoresis and nausea.",
      },
      {
        date: "Today, 07:15 AM",
        kind: "test",
        title: "12-Lead Emergency ECG",
        detail:
          "Demonstrates hyperacute T waves and 2-3mm ST segment elevation in anterior leads V1 through V4 with reciprocal ST depression in inferior leads II, III, and aVF.",
      },
      {
        date: "Today, 07:45 AM",
        kind: "medication",
        title: "Clopidogrel Loading (Aspirin Sparing)",
        detail:
          "Given documented severe aspirin anaphylaxis/bronchospasm, aspirin loading withheld. Loaded with Clopidogrel 600mg and Unfractionated Heparin bolus per cardiology consult.",
      },
      {
        date: "Today, 08:00 AM",
        kind: "outcome",
        title: "Cardiac Catheterization Lab Activation",
        detail:
          "Transferred directly to interventional cardiology catheterization lab for immediate Primary Percutaneous Coronary Intervention (PPCI).",
      },
    ],
  },
  {
    patient: {
      name: "Priya Sundaram Patel",
      age: "34",
      sex: "Female",
      question:
        "34-year-old female schoolteacher presenting with high spiking fevers (39.1°C), pleuritic right-sided chest pain, productive cough with rust-colored sputum, and tachypnea for 4 days. Auscultation reveals right lower lobe bronchial breath sounds and crackles.",
      history:
        "Mild intermittent childhood asthma (well-controlled on PRN inhaler). No prior hospital admissions. Non-smoker. No known tuberculosis contacts.",
      medications: "Salbutamol 100mcg MDI 2 puffs PRN (used twice in past month).",
      allergies:
        "Penicillin & Amoxicillin (anaphylaxis - generalized urticaria, wheezing, and laryngeal edema at age 14; strict avoidance of beta-lactams).",
      vitals:
        "BP: 112/74 mmHg, HR: 108 bpm, RR: 26/min, SpO2: 91% on room air (corrects to 96% on 2L nasal cannula), Temp: 39.1°C, BMI: 22.4 kg/m².",
      labs: "WBC: 17,400/mcL (88% neutrophils, 6% bands), CRP: 168 mg/L (ref <5), ESR: 62 mm/hr, Serum Procalcitonin: 2.4 ng/mL, Sputum Gram stain: Gram-positive lancet-shaped diplococci, Urea: 24 mg/dL (CURB-65 score = 1).",
    },
    timeline: [
      {
        date: "4 days ago",
        kind: "symptom",
        title: "Initial Fevers & Dry Cough",
        detail:
          "Developed sudden rigors, general malaise, body ache, and low-grade pyrexia treated initially with over-the-counter paracetamol.",
      },
      {
        date: "2 days ago",
        kind: "symptom",
        title: "Pleuritic Pain & Purulent Sputum",
        detail:
          "Cough became productive of thick rust-colored sputum. Developed sharp right infrascapular pain worsened on deep inspiration.",
      },
      {
        date: "Today, 09:30 AM",
        kind: "imaging",
        title: "Chest Radiography (PA View)",
        detail:
          "Demonstrates dense alveolar consolidation with visible air bronchograms in the right lower lobe, without blunting of the costophrenic angle.",
      },
      {
        date: "Today, 10:15 AM",
        kind: "medication",
        title: "Non-Beta-Lactam Targeted Therapy",
        detail:
          "Initiated on IV Levofloxacin 750mg OD due to documented severe penicillin anaphylaxis, achieving reliable Streptococcus pneumoniae coverage.",
      },
    ],
  },
  {
    patient: {
      name: "Sunita Ramesh Verma",
      age: "66",
      sex: "Female",
      question:
        "66-year-old female with long-standing diabetic nephropathy presenting with 3+ bilateral pitting pedal edema, persistent nausea, and rising serum creatinine to 2.9 mg/dL (eGFR 18 mL/min/1.73m²) while taking Metformin and Ibuprofen.",
      history:
        "Type 2 Diabetes Mellitus (20 years), Diabetic Kidney Disease stage 4, Essential Hypertension (15 years), Osteoarthritis of bilateral knees.",
      medications:
        "Metformin 1000mg BID (critical safety contraindication at eGFR <30), Glipizide 5mg OD, Amlodipine 10mg OD, Ibuprofen 400mg TID PRN for knee joint pain (nephrotoxic trigger).",
      allergies:
        "Sulfonamides / Co-trimoxazole (fixed drug eruption and severe erythema multiforme-like rash).",
      vitals:
        "BP: 168/98 mmHg, HR: 76 bpm (regular), RR: 18/min, SpO2: 96% on room air, Temp: 36.6°C, Weight: 74 kg, BMI: 29.2 kg/m².",
      labs: "Serum Creatinine: 2.9 mg/dL (baseline 1.8 three months prior), eGFR: 18 mL/min/1.73m² (CKD stage 4), Blood Urea Nitrogen: 58 mg/dL, Serum Potassium: 5.3 mEq/L, Urine Albumin-Creatinine Ratio (UACR): 890 mg/g, Hemoglobin: 9.8 g/dL (normocytic normochromic), Serum Bicarbonate: 18 mEq/L.",
    },
    timeline: [
      {
        date: "3 months ago",
        kind: "test",
        title: "Baseline Nephrology Panel",
        detail:
          "Routine outpatient renal panel recorded serum creatinine at 1.8 mg/dL with eGFR 34 mL/min/1.73m²; instructed on low sodium diet.",
      },
      {
        date: "2 weeks ago",
        kind: "medication",
        title: "Self-Initiated NSAID Analgesia",
        detail:
          "Started taking over-the-counter Ibuprofen 400mg three times daily for bilateral knee osteoarthritis pain.",
      },
      {
        date: "Today, 11:00 AM",
        kind: "test",
        title: "Acute-on-Chronic Renal Decline",
        detail:
          "Serum creatinine acutely deteriorated to 2.9 mg/dL. Prompt CDSS alert generated for hemodynamically mediated acute kidney injury.",
      },
      {
        date: "Today, 11:30 AM",
        kind: "note",
        title: "Pharmacovigilance Deprescribing Action",
        detail:
          "Immediate discontinuation of Ibuprofen and Metformin (lactic acidosis danger). Switched to topical NSAIDs / Paracetamol and referred for renal dose adjustments.",
      },
    ],
  },
  {
    patient: {
      name: "Amitabh Debroy Mukherjee",
      age: "71",
      sex: "Male",
      question:
        "71-year-old male with persistent atrial fibrillation presenting with sudden-onset right facial droop, global expressive aphasia, and dense right hemiparesis (arm 2/5, leg 3/5) beginning 2 hours ago. Baseline NIHSS score 12.",
      history:
        "Non-valvular Atrial Fibrillation (CHA2DS2-VASc score = 5), Prior Ischemic CVA 4 years ago with near-complete neurological recovery, Hypertension, Dyslipidemia.",
      medications:
        "Apixaban 5mg BID (family reports patient omitted last 3 scheduled doses), Metoprolol Succinate 50mg OD, Ramipril 5mg OD, Rosuvastatin 20mg HS.",
      allergies: "No known drug allergies (NKDA).",
      vitals:
        "BP: 178/102 mmHg, HR: 96 bpm (irregularly irregular rhythm), RR: 19/min, SpO2: 97% on ambient air, Temp: 37.0°C, Point-of-care Blood Glucose: 126 mg/dL.",
      labs: "INR: 1.1, PT: 12.8s, aPTT: 31s, Platelet count: 245,000/mcL, Serum Sodium: 139 mEq/L, Serum Creatinine: 1.0 mg/dL. Non-contrast Head CT: ASPECTS score 9, no acute intracranial hemorrhage or midline shift.",
    },
    timeline: [
      {
        date: "Today, 08:00 AM",
        kind: "symptom",
        title: "Acute Neurological Deficit Onset",
        detail:
          "Family observed sudden inability to speak and drop of coffee mug from right hand. Sudden right facial asymmetry noted.",
      },
      {
        date: "Today, 08:50 AM",
        kind: "imaging",
        title: "Emergency Non-Contrast Brain CT",
        detail:
          "Excluded acute intracranial hemorrhage or subdural collection. Early ischemic changes limited to left insular ribbon (ASPECTS 9).",
      },
      {
        date: "Today, 09:20 AM",
        kind: "test",
        title: "CT Angiography Head & Neck",
        detail:
          "Demonstrates abrupt occlusion of the left middle cerebral artery (MCA) M1 segment with adequate leptomeningeal collaterals.",
      },
      {
        date: "Today, 09:45 AM",
        kind: "outcome",
        title: "Endovascular Thrombectomy Candidate",
        detail:
          "Given last known well within 4.5 hours and large vessel occlusion with confirmed omitted DOAC doses, patient routed for emergent mechanical thrombectomy.",
      },
    ],
  },
  {
    patient: {
      name: "Mohammed Tariq Farooq",
      age: "52",
      sex: "Male",
      question:
        "52-year-old male with chronic hepatitis B cirrhosis presenting with progressive abdominal distension, scleral icterus, flapping tremors (asterixis), and reversed sleep-wake cycles for 3 days. Shifting dullness and fluid thrill positive.",
      history:
        "Chronic Hepatitis B Cirrhosis (genotype D, diagnosed 9 years ago; discontinued Entecavir 8 months ago), Portal Hypertension, Grade 2 esophageal varices on prior surveillance EGD.",
      medications:
        "Spironolactone 100mg OD, Furosemide 40mg OD, Propranolol 20mg BID (previously on Entecavir 0.5mg OD, currently non-adherent).",
      allergies:
        "Ciprofloxacin & Levofloxacin (severe bilateral Achilles tendonitis and arthralgia).",
      vitals:
        "BP: 104/64 mmHg, HR: 84 bpm, RR: 20/min, SpO2: 95% on room air, Temp: 37.4°C, BMI: 24.1 kg/m².",
      labs: "Total Bilirubin: 6.8 mg/dL (direct 4.9 mg/dL), ALT: 98 U/L, AST: 142 U/L, Alkaline Phosphatase: 184 U/L, Serum Albumin: 2.4 g/dL, INR: 1.82 (coagulopathy), Platelets: 68,000/mcL (hypersplenism), Blood Ammonia: 86 mcg/dL (elevated), Serum Sodium: 131 mEq/L.",
    },
    timeline: [
      {
        date: "8 months ago",
        kind: "note",
        title: "Antiviral Interruption",
        detail:
          "Patient self-discontinued daily Entecavir therapy due to medication supply issues; did not attend interval gastroenterology follow-up.",
      },
      {
        date: "1 week ago",
        kind: "symptom",
        title: "Progressive Jaundice & Ascites",
        detail:
          "Developed rapid abdominal enlargement, tight clothing, dark tea-colored urine, and daytime somnolence.",
      },
      {
        date: "Today, 01:15 PM",
        kind: "test",
        title: "Diagnostic Paracentesis",
        detail:
          "Sampled 50mL peritoneal fluid: Total nucleated cell count 180/mcL with 35% polymorphonuclear cells (PMN count 63/mcL, excluding spontaneous bacterial peritonitis). Serum-ascites albumin gradient (SAAG) = 1.6 g/dL (portal hypertension).",
      },
      {
        date: "Today, 02:00 PM",
        kind: "medication",
        title: "Hepatic Encephalopathy Protocol",
        detail:
          "Initiated on oral Lactulose 30mL TID titrated to 2-3 soft bowel movements daily, plus Rifaximin 550mg BID and restarted on oral Entecavir.",
      },
    ],
  },
  {
    patient: {
      name: "Dr. Lakshmi Anand Iyer",
      age: "28",
      sex: "Female",
      question:
        "28-year-old female medical resident presenting with prominent malar butterfly rash, symmetrical polyarthritis affecting MCP and PIP joints of both hands, diffuse non-scarring alopecia, painless oral ulcers, and pleuritic chest discomfort for 6 weeks.",
      history:
        "Raynaud's phenomenon for 2 years, recurrent aphthous stomatitis, iron deficiency anemia. No history of deep vein thrombosis or miscarriages.",
      medications:
        "Hydroxychloroquine 200mg OD, Naproxen 500mg BID PRN, Ferrous Ascorbate 100mg OD.",
      allergies:
        "Trimethoprim-Sulfamethoxazole (severe photo-distributed bullous skin eruptions; cross-reactivity warning for sulfonamides).",
      vitals:
        "BP: 118/76 mmHg, HR: 82 bpm, RR: 16/min, SpO2: 98% on room air, Temp: 37.8°C, BMI: 21.0 kg/m².",
      labs: "Antinuclear Antibody (ANA): Positive 1:640 (homogeneous and speckled pattern), Anti-dsDNA: 145 IU/mL (strongly elevated, ref <25), Anti-Smith (Sm): Positive, Serum Complement C3: 54 mg/dL (low, ref 90-180), Serum Complement C4: 8 mg/dL (low, ref 10-40), ESR: 78 mm/hr, 24-hour urine protein: 620 mg/day (sub-nephrotic proteinuria), Urinalysis: 10-15 RBCs/HPF without red cell casts.",
    },
    timeline: [
      {
        date: "6 weeks ago",
        kind: "symptom",
        title: "Photosensitive Malar Rash",
        detail:
          "Developed prominent fixed erythema over both malar eminences sparing the nasolabial folds following intense sunlight exposure.",
      },
      {
        date: "3 weeks ago",
        kind: "symptom",
        title: "Symmetric Inflammatory Polyarthritis",
        detail:
          "Morning stiffness lasting >90 minutes involving bilateral wrist joints, 2nd and 3rd metacarpophalangeal (MCP) joints, and proximal interphalangeal joints.",
      },
      {
        date: "Today, 10:00 AM",
        kind: "test",
        title: "Autoimmune Serology Confirmation",
        detail:
          "Markedly high-titer anti-dsDNA and hypocomplementemia confirm active Systemic Lupus Erythematosus flare (SLEDAI-2K score = 14).",
      },
      {
        date: "Today, 11:00 AM",
        kind: "outcome",
        title: "Renal Biopsy Scheduling",
        detail:
          "Scheduled for ultrasound-guided percutaneous renal biopsy to evaluate for Class III/IV lupus nephritis in light of active urinary sediment and proteinuria.",
      },
    ],
  },
];

/**
 * Seeds the 6 realistic Indian patient cases and associated timeline events
 * directly into the current authenticated user's Firestore workspace.
 */
export async function seedIndianClinicalCohort(userId: string): Promise<{
  patientsCount: number;
  timelineCount: number;
}> {
  if (!userId) {
    throw new Error("Cannot seed cohort: User ID is required.");
  }

  const cols = getCollections(userId);
  let totalPatients = 0;
  let totalTimeline = 0;

  for (const item of INDIAN_CLINICAL_COHORT) {
    // 1. Insert patient record
    const patientDoc = await addDoc(cols.patients, {
      ...item.patient,
      createdAt: Date.now() - Math.floor(Math.random() * 3600000 * 24),
    });
    totalPatients++;

    // 2. Insert related timeline events linked to this patient's ID
    for (const evt of item.timeline) {
      await addDoc(cols.timeline, {
        ...evt,
        patientId: patientDoc.id,
        createdAt: Date.now() - Math.floor(Math.random() * 3600000 * 12),
      });
      totalTimeline++;
    }
  }

  return {
    patientsCount: totalPatients,
    timelineCount: totalTimeline,
  };
}
