import type { GraphEdge, GraphNode } from "@/lib/agents/types";

/**
 * Seeded clinical knowledge graph.
 * Disease -> symptoms -> risk factors -> labs -> drugs -> contraindications
 * -> treatments -> complications.
 */

interface DiseaseSpec {
  id: string;
  label: string;
  symptoms: string[];
  risks: string[];
  labs: string[];
  drugs: string[];
  contraindications: string[];
  treatments: string[];
  complications: string[];
}

export const DISEASES: DiseaseSpec[] = [
  {
    id: "community-acquired-pneumonia",
    label: "Community-Acquired Pneumonia",
    symptoms: ["Productive cough", "Fever", "Pleuritic chest pain", "Dyspnoea", "Tachypnoea"],
    risks: ["Age > 65", "Smoking", "COPD", "Immunosuppression", "Alcohol use"],
    labs: ["CRP", "White cell count", "Blood cultures", "Chest X-ray", "Sputum culture"],
    drugs: ["Amoxicillin", "Doxycycline", "Azithromycin", "Ceftriaxone"],
    contraindications: ["Penicillin allergy", "QT prolongation (macrolides)"],
    treatments: [
      "Oral antibiotics (CURB-65 0-1)",
      "IV antibiotics + admission (CURB-65 >= 2)",
      "Oxygen therapy",
    ],
    complications: ["Parapneumonic effusion", "Empyema", "Sepsis", "Respiratory failure"],
  },
  {
    id: "acute-coronary-syndrome",
    label: "Acute Coronary Syndrome",
    symptoms: [
      "Crushing chest pain",
      "Radiation to jaw or left arm",
      "Diaphoresis",
      "Nausea",
      "Dyspnoea",
    ],
    risks: ["Hypertension", "Diabetes mellitus", "Smoking", "Hyperlipidaemia", "Family history"],
    labs: ["High-sensitivity troponin", "12-lead ECG", "Lipid profile", "HbA1c"],
    drugs: ["Aspirin", "Ticagrelor", "Atorvastatin", "Metoprolol", "Heparin"],
    contraindications: [
      "Active bleeding",
      "Recent haemorrhagic stroke",
      "Severe bradycardia (beta blockers)",
    ],
    treatments: [
      "Dual antiplatelet therapy",
      "Primary PCI",
      "Fibrinolysis if PCI unavailable",
      "Cardiac rehabilitation",
    ],
    complications: ["Cardiogenic shock", "Arrhythmia", "Heart failure", "Mechanical rupture"],
  },
  {
    id: "heart-failure-with-reduced-ef",
    label: "Heart Failure with Reduced Ejection Fraction (HFrEF)",
    symptoms: ["Orthopnoea", "Paroxysmal nocturnal dyspnoea", "Bilateral ankle oedema", "Fatigue", "Elevated JVP"],
    risks: ["Ischaemic heart disease", "Hypertension", "Valvular disease", "Cardiomyopathy"],
    labs: ["BNP / NT-proBNP", "Echocardiogram (EF < 40%)", "Serum electrolytes", "Urea and creatinine"],
    drugs: ["Sacubitril/valsartan (ARNI)", "Dapagliflozin", "Bisoprolol", "Spironolactone", "Furosemide"],
    contraindications: ["ACEi/ARNI within 36 hours", "eGFR < 20", "Serum K+ > 5.5 mmol/L"],
    treatments: [
      "Guideline-directed medical therapy (4 pillars)",
      "Loop diuretics for decongestion",
      "Cardiac resynchronisation therapy (CRT) if QRS > 130ms",
      "Implantable cardioverter-defibrillator (ICD)",
    ],
    complications: ["Acute pulmonary oedema", "Ventricular arrhythmias", "Cardiorenal syndrome", "Sudden cardiac death"],
  },
  {
    id: "atrial-fibrillation",
    label: "Atrial Fibrillation",
    symptoms: ["Palpitations", "Irregular pulse", "Fatigue", "Lightheadedness", "Exertional dyspnoea"],
    risks: ["Age > 65", "Hypertension", "Valvular disease", "Thyrotoxicosis", "Sleep apnoea", "Excess alcohol"],
    labs: ["12-lead ECG (absent P waves, irregular R-R)", "Thyroid function tests (TSH)", "Echocardiogram", "CHA2DS2-VASc score"],
    drugs: ["Apixaban", "Rivaroxaban", "Bisoprolol", "Diltiazem", "Amiodarone", "Digoxin"],
    contraindications: ["Active major haemorrhage", "Decompensated heart failure (diltiazem)", "Severe asthma (beta-blockers)"],
    treatments: [
      "Rate control (beta blocker or rate-limiting CCB)",
      "Anticoagulation for CHA2DS2-VASc >= 1 in men, >= 2 in women",
      "Electrical cardioversion if hemodynamically compromised",
      "Catheter ablation for symptomatic paroxysmal AF",
    ],
    complications: ["Embolic ischaemic stroke", "Tachycardia-induced cardiomyopathy", "Heart failure decompensation"],
  },
  {
    id: "aortic-dissection",
    label: "Acute Aortic Dissection",
    symptoms: ["Sudden severe ripping or tearing chest/back pain", "Blood pressure differential between arms (>20 mmHg)", "Syncope", "Focal neurological deficit"],
    risks: ["Severe uncontrolled hypertension", "Bicuspid aortic valve", "Marfan syndrome", "Prior aortic aneurysm", "Cocaine use"],
    labs: ["CT Aortography (gold standard)", "Transthoracic / Transoesophageal Echo", "D-dimer", "Troponin"],
    drugs: ["Labetalol IV", "Esmolol IV", "Sodium nitroprusside (after beta-blockade)", "Morphine IV"],
    contraindications: ["Vasodilators without prior beta-blockade (avoids reflex tachycardia / sheer stress)"],
    treatments: [
      "Aggressive BP control (target systolic 100-120 mmHg, HR < 60)",
      "Emergency cardiac surgery for Stanford Type A",
      "Medical therapy or TEVAR for uncomplicated Stanford Type B",
    ],
    complications: ["Aortic rupture", "Cardiac tamponade", "Coronary ostial occlusion (STEMI)", "Acute aortic regurgitation"],
  },
  {
    id: "infective-endocarditis",
    label: "Infective Endocarditis",
    symptoms: ["Persistent fever", "New or changing heart murmur", "Splinter haemorrhages", "Osler nodes", "Roth spots", "Night sweats"],
    risks: ["Prosthetic heart valves", "Prior endocarditis", "Intravenous drug use", "Congenital heart disease", "Poor dentition"],
    labs: ["Three sets of blood cultures (before antibiotics)", "Transoesophageal Echocardiogram (TOE)", "CRP / ESR", "Urinalysis (microscopic haematuria)"],
    drugs: ["Amoxicillin + Gentamicin", "Flucloxacillin", "Vancomycin", "Rifampicin", "Ceftriaxone"],
    contraindications: ["Immediate anticoagulation start in active cerebral embolism"],
    treatments: [
      "Prolonged bactericidal IV antibiotic regimen (4-6 weeks)",
      "Surgical valve repair/replacement for severe regurgitation or persistent vegetations",
      "Dental assessment and eradication of septic foci",
    ],
    complications: ["Valve destruction and acute heart failure", "Septic cerebral emboli", "Myocardial abscess", "Glomerulonephritis"],
  },
  {
    id: "pulmonary-embolism",
    label: "Pulmonary Embolism",
    symptoms: ["Sudden dyspnoea", "Pleuritic chest pain", "Haemoptysis", "Tachycardia", "Syncope"],
    risks: ["Recent surgery", "Immobility", "Malignancy", "Oestrogen therapy", "Prior VTE"],
    labs: ["D-dimer", "CTPA", "Arterial blood gas", "ECG", "Troponin"],
    drugs: ["Apixaban", "Rivaroxaban", "Enoxaparin", "Warfarin", "Alteplase"],
    contraindications: ["Active major bleeding", "Severe thrombocytopenia", "Pregnancy (DOACs)"],
    treatments: [
      "Anticoagulation",
      "Thrombolysis if haemodynamically unstable",
      "IVC filter if anticoagulation contraindicated",
    ],
    complications: [
      "Right heart strain",
      "Chronic thromboembolic pulmonary hypertension",
      "Sudden death",
    ],
  },
  {
    id: "asthma-exacerbation",
    label: "Asthma Exacerbation",
    symptoms: ["Wheeze", "Chest tightness", "Nocturnal cough", "Breathlessness"],
    risks: ["Atopy", "Allergen exposure", "Viral infection", "Poor inhaler adherence"],
    labs: ["Peak expiratory flow", "Spirometry", "FeNO", "Oxygen saturation"],
    drugs: [
      "Salbutamol",
      "Prednisolone",
      "Ipratropium",
      "Budesonide/formoterol",
      "Magnesium sulfate",
    ],
    contraindications: ["Non-selective beta blockers", "NSAID sensitivity subgroup"],
    treatments: [
      "Inhaled bronchodilators",
      "Systemic corticosteroids",
      "Controlled oxygen",
      "Escalation to HDU if life-threatening",
    ],
    complications: ["Respiratory failure", "Pneumothorax", "Status asthmaticus"],
  },
  {
    id: "copd-exacerbation",
    label: "COPD Exacerbation",
    symptoms: ["Worsening breathlessness", "Increased sputum volume", "Increased sputum purulence", "Wheeze", "Ankle swelling"],
    risks: ["Heavy tobacco smoking history", "Biomass fuel exposure", "Alpha-1 antitrypsin deficiency", "Cold weather exposure"],
    labs: ["Arterial Blood Gas (PaO2, PaCO2, pH)", "Chest radiograph", "Sputum microscopy and culture", "ECG"],
    drugs: ["Salbutamol + Ipratropium nebulised", "Prednisolone", "Amoxicillin or Doxycycline", "Controlled low-flow Oxygen (24-28% Venturi)"],
    contraindications: ["Uncontrolled high-flow oxygen (risk of hypercapnic respiratory arrest)"],
    treatments: [
      "Controlled oxygen targeting SpO2 88-92%",
      "Short-acting inhaled bronchodilators",
      "5-day oral corticosteroid course",
      "Non-invasive ventilation (NIV/BiPAP) for acute hypercapnic respiratory failure (pH < 7.35)",
    ],
    complications: ["Acute hypercapnic respiratory failure", "Secondary pneumothorax", "Cor pulmonale", "Secondary bacterial pneumonia"],
  },
  {
    id: "tension-pneumothorax",
    label: "Tension Pneumothorax",
    symptoms: ["Sudden severe pleuritic chest pain", "Severe dyspnoea", "Tracheal deviation away from affected side", "Hyper-resonant percussion note", "Hypotension and tachycardia"],
    risks: ["Pre-existing bullous emphysema", "Mechanical ventilation with high PEEP", "Central venous catheter insertion", "Thoracic trauma"],
    labs: ["Clinical diagnosis (do NOT delay for chest X-ray)", "Point-of-care lung ultrasound (barcode sign)"],
    drugs: ["Oxygen high-flow", "Analgesia post-decompression"],
    contraindications: ["Delaying decompression to obtain confirmation radiology"],
    treatments: [
      "Immediate needle decompression (2nd intercostal space mid-clavicular line or 5th ICS anterior axillary line)",
      "Followed promptly by formal intercostal chest tube drain insertion with underwater seal",
    ],
    complications: ["Obstructive shock", "Cardiac arrest (PEA)", "Hypoxic brain injury"],
  },
  {
    id: "type-2-diabetes",
    label: "Type 2 Diabetes Mellitus",
    symptoms: ["Polyuria", "Polydipsia", "Fatigue", "Blurred vision", "Slow wound healing"],
    risks: ["Obesity", "Sedentary lifestyle", "Family history", "Gestational diabetes"],
    labs: ["HbA1c", "Fasting glucose", "eGFR", "Urine ACR", "Lipid profile"],
    drugs: ["Metformin", "Empagliflozin", "Semaglutide", "Gliclazide", "Insulin glargine"],
    contraindications: [
      "eGFR < 30 (metformin)",
      "History of DKA (SGLT2)",
      "Personal MTC history (GLP-1)",
    ],
    treatments: [
      "Lifestyle modification",
      "Metformin first line",
      "SGLT2 inhibitor if CV/renal disease",
      "Structured education",
    ],
    complications: ["Diabetic retinopathy", "Nephropathy", "Neuropathy", "Cardiovascular disease"],
  },
  {
    id: "diabetic-ketoacidosis",
    label: "Diabetic Ketoacidosis (DKA)",
    symptoms: ["Kussmaul breathing (deep sighing)", "Fruity acetone breath odour", "Nausea and vomiting", "Abdominal pain", "Dehydration", "Altered mental status"],
    risks: ["Type 1 diabetes", "Omission of insulin", "Intercurrent infection / sepsis", "SGLT2 inhibitor use (euglycaemic DKA)"],
    labs: ["Venous blood gas (pH < 7.30, HCO3- < 15)", "Blood capillary ketones (> 3.0 mmol/L)", "Blood glucose (> 11.0 mmol/L)", "Electrolytes (anion gap > 12, serum K+)"],
    drugs: ["Sodium chloride 0.9% IV", "Soluble insulin fixed-rate infusion (0.1 units/kg/hr)", "Potassium chloride IV replacement", "Glucose 10% IV when glucose < 14"],
    contraindications: ["Starting insulin without checking potassium (danger of fatal hypokalaemia if K+ < 3.5)"],
    treatments: [
      "Aggressive fluid resuscitation with crystalloids",
      "Fixed rate intravenous insulin infusion",
      "Continuous potassium replacement to maintain K+ 4.0-5.0",
      "Resolution criteria: venous pH > 7.3, HCO3- > 18, ketones < 0.6",
    ],
    complications: ["Cerebral oedema (especially paediatric)", "Severe hypokalaemia / cardiac arrest", "Fluid overload", "Venous thromboembolism"],
  },
  {
    id: "hyperosmolar-hyperglycemic-state",
    label: "Hyperosmolar Hyperglycemic State (HHS)",
    symptoms: ["Profound dehydration", "Confusion / lethargy / coma", "Polyuria progressing to oliguria", "Focal neurological signs"],
    risks: ["Elderly type 2 diabetes", "CVA / MI / Infection trigger", "Limited access to fluids", "Diuretic / steroid therapy"],
    labs: ["Blood glucose (often > 30 mmol/L)", "Serum osmolality (calculated > 320 mOsm/kg)", "Venous gas (pH > 7.3, HCO3- normal)", "Urinary/blood ketones negative or trace"],
    drugs: ["Sodium chloride 0.9% IV fluid resuscitation", "Low-dose insulin infusion (0.05 units/kg/hr if glucose stops falling with fluids)", "Prophylactic low-molecular-weight heparin"],
    contraindications: ["Aggressive rapid glucose lowering (risk of cardiovascular collapse / neurological shifts)"],
    treatments: [
      "Cautious fluid rehydration over 48-72 hours",
      "Normalize osmolality gradually (rate < 5 mOsm/kg/hr)",
      "Prophylactic LMWH due to extreme hyperviscosity and thrombosis risk",
    ],
    complications: ["Thromboembolism (stroke, DVT/PE)", "Hypovolaemic shock", "Pontine myelinolysis", "Acute tubular necrosis"],
  },
  {
    id: "acute-ischemic-stroke",
    label: "Acute Ischaemic Stroke",
    symptoms: ["Sudden unilateral facial droop", "Unilateral arm / leg weakness", "Dysarthria or expressive/receptive aphasia", "Visual field defect", "Ataxia"],
    risks: ["Atrial fibrillation", "Carotid stenosis", "Hypertension", "Diabetes", "Smoking"],
    labs: ["Immediate Non-Contrast CT Brain (exclude haemorrhage)", "CT Angiography / Perfusion (large vessel occlusion)", "Blood glucose (rule out hypoglycaemia)", "ECG"],
    drugs: ["Alteplase IV or Tenecteplase IV", "Aspirin 300mg (deferred 24h if thrombolysed)", "Atorvastatin 80mg", "Labetalol IV (BP control)"],
    contraindications: ["Active internal bleeding", "Recent intracranial haemorrhage or neurosurgery", "Platelets < 100k, INR > 1.7", "Blood pressure > 185/110 mmHg"],
    treatments: [
      "Intravenous thrombolysis if within 4.5 hours of symptom onset",
      "Endovascular mechanical thrombectomy if large vessel occlusion within 6-24 hours",
      "Admission to dedicated hyperacute stroke unit (HASU)",
      "Early swallowing screen and secondary prevention",
    ],
    complications: ["Haemorrhagic transformation", "Malignant cerebral oedema (MCA syndrome)", "Aspiration pneumonia", "Post-stroke depression"],
  },
  {
    id: "subarachnoid-hemorrhage",
    label: "Subarachnoid Haemorrhage (SAH)",
    symptoms: ["Sudden onset occipital thunderclap headache ('worst headache of life', peak in seconds)", "Neck stiffness / meningism", "Photophobia", "Transient loss of consciousness", "Vomiting"],
    risks: ["Intracranial berry aneurysms", "Autosomal dominant polycystic kidney disease (ADPKD)", "Smoking", "Severe hypertension"],
    labs: ["Urgent non-contrast CT head (< 6 hours sensitivity > 98%)", "Lumbar puncture for CSF spectrophotometry / xanthochromia (> 12 hours)", "CT Cerebral Angiogram"],
    drugs: ["Nimodipine 60mg enteral 4-hourly (neuroprotection)", "Opioid analgesia", "Stool softeners (prevent Valsalva)"],
    contraindications: ["Lumbar puncture before brain imaging (risk of uncal herniation)", "Anticoagulants or antiplatelets"],
    treatments: [
      "Urgent neurosurgical referral",
      "Endovascular aneurysm coiling or surgical clipping within 24-48 hours",
      "Strict systolic BP target (< 140 mmHg) prior to securing aneurysm",
      "Nimodipine for 21 days to prevent delayed cerebral ischemia (vasospasm)",
    ],
    complications: ["Re-bleeding (highest mortality in first 24h)", "Delayed cerebral ischemia / vasospasm (days 4-14)", "Obstructive hydrocephalus", "Hyponatraemia (cerebral salt wasting)"],
  },
  {
    id: "bacterial-meningitis",
    label: "Acute Bacterial Meningitis",
    symptoms: ["Fever", "Severe headache", "Neck stiffness (nuchal rigidity)", "Photophobia", "Non-blanching purpuric rash (Meningococcal)", "Kernig / Brudzinski signs positive"],
    risks: ["Asplenia", "Complement deficiency", "Crowded living conditions (university dorms/military)", "Immunosuppression"],
    labs: ["Lumbar puncture (turbid CSF, polymorphs, low glucose < 40% of plasma, high protein > 1 g/L)", "Blood cultures", "Meningococcal / Pneumococcal PCR"],
    drugs: ["Ceftriaxone IV 2g BD", "Dexamethasone IV (prior to or with first antibiotic dose)", "Ampicillin / Amoxicillin (add for Listeria if age > 55)", "Vancomycin (if penicillin-resistant pneumococcus suspected)"],
    contraindications: ["Delaying antibiotic administration for lumbar puncture or CT scan (emergency!)"],
    treatments: [
      "Immediate empiric high-dose IV antibiotics without delay",
      "IV Dexamethasone for 4 days to reduce neurological sequelae and sensorineural hearing loss",
      "Droplet respiratory isolation for first 24 hours",
      "Prophylaxis with Rifampicin or Ciprofloxacin for close household contacts",
    ],
    complications: ["Sensorineural hearing loss", "Cerebral herniation", "Hydrocephalus", "Cerebral venous sinus thrombosis", "DIC / purpura fulminans"],
  },
  {
    id: "acute-pancreatitis",
    label: "Acute Pancreatitis",
    symptoms: ["Severe epigastric pain radiating through to back", "Nausea and persistent vomiting", "Epigastric tenderness and guarding", "Grey Turner / Cullen signs (severe retroperitoneal haemorrhage)"],
    risks: ["Gallstones (biliary)", "Alcohol excess", "Hypertriglyceridaemia", "Post-ERCP", "Drugs (azathioprine, steroids)"],
    labs: ["Serum amylase or lipase (> 3x upper limit of normal)", "Abdominal ultrasound (gallstones and biliary dilation)", "Liver function tests (elevated ALT suggests biliary etiology)", "Contrast-enhanced CT abdomen (> 72 hours for necrosis)"],
    drugs: ["Aggressive intravenous crystalloids (Ringer's lactate)", "Opioid analgesia (IV morphine or fentanyl)", "Anti-emetics"],
    contraindications: ["Routine prophylactic antibiotics in mild acute pancreatitis"],
    treatments: [
      "Aggressive early fluid resuscitation (200-500 mL/hr crystalloid, monitor urine output)",
      "Urgent ERCP within 72 hours if gallstone pancreatitis with cholangitis or persistent biliary obstruction",
      "Early oral or enteral nutrition as tolerated",
      "Cholecystectomy during same admission for mild gallstone pancreatitis",
    ],
    complications: ["Pancreatic necrosis and infected walled-off necrosis", "Acute Peripancreatic fluid collections / pseudocyst", "Systemic inflammatory response syndrome (SIRS)", "Splenic vein thrombosis"],
  },
  {
    id: "upper-gi-bleeding",
    label: "Acute Upper GI Bleeding",
    symptoms: ["Haematemesis (fresh red or 'coffee-ground')", "Melaena (black tarry offensive stools)", "Postural dizziness / syncope", "Tachycardia and hypotension"],
    risks: ["Peptic ulcer disease (H. pylori, NSAIDs)", "Oesophageal varices (cirrhosis, portal hypertension)", "Mallory-Weiss tear", "Anticoagulation / antiplatelet use"],
    labs: ["Full blood count (haemoglobin, platelets)", "Coagulation profile (INR, fibrinogen)", "Urea to creatinine ratio (elevated BUN reflects digested blood protein)", "Glasgow-Blatchford Score (GBS)"],
    drugs: ["Terlipressin IV (if variceal bleed suspected)", "Ceftriaxone IV (antibiotic prophylaxis in cirrhosis)", "Omeprazole / Pantoprazole IV high-dose", "Tranexamic acid (specific trauma protocols)"],
    contraindications: ["Over-transfusion in portal hypertension (target Hb 70-80 g/L to prevent rebound variceal bleeding)"],
    treatments: [
      "Hemodynamic resuscitation with blood products (1:1:1 protocol in massive bleed)",
      "Early endoscopy within 24 hours (within 12 hours if haemodynamically unstable)",
      "Endoscopic band ligation for varices or clip/thermal coagulation for peptic ulcers",
      "Balloon tamponade (Sengstaken-Blakemore tube) or TIPSS for refractory variceal haemorrhage",
    ],
    complications: ["Hemorrhagic shock and exsanguination", "Aspiration of blood / asphyxiation", "Acute myocardial infarction due to supply/demand mismatch", "Hepatic encephalopathy"],
  },
  {
    id: "decompensated-cirrhosis",
    label: "Decompensated Liver Cirrhosis",
    symptoms: ["Abdominal distension (ascites)", "Jaundice (scleral icterus)", "Hepatic encephalopathy (asterixis, confusion)", "Peripheral oedema", "Spider naevi and palmar erythema"],
    risks: ["Chronic alcohol abuse", "Hepatitis B / C infection", "Non-alcoholic steatohepatitis (MASH)", "Autoimmune hepatitis / Hemochromatosis"],
    labs: ["Diagnostic ascitic paracentesis (WCC, neutrophil count > 250/mm3 defines SBP)", "Bilirubin, Albumin, Prothrombin time / INR (Child-Pugh score)", "Serum sodium (hyponatraemia)", "Renal function (creatinine, eGFR)"],
    drugs: ["Spironolactone + Furosemide", "Lactulose (titrated to 2-3 soft stools/day)", "Rifaximin (secondary encephalopathy prevention)", "Cefotaxime or Ceftriaxone (empirical for SBP)", "Human Albumin Solution 20%"],
    contraindications: ["NSAIDs (precipitates severe hepatorenal syndrome)", "Sedatives/benzodiazepines (worsens encephalopathy)", "Excess paracentesis without albumin replacement"],
    treatments: [
      "Large-volume paracentesis with 8g IV albumin per litre ascites removed (> 5L)",
      "Empirical antibiotics for spontaneous bacterial peritonitis (SBP)",
      "Lactulose plus rifaximin for encephalopathy",
      "Assessment for liver transplantation",
    ],
    complications: ["Hepatorenal syndrome (HRS-AKI)", "Spontaneous bacterial peritonitis", "Refractory variceal bleeding", "Hepatocellular carcinoma (HCC)"],
  },
  {
    id: "acute-kidney-injury",
    label: "Acute Kidney Injury (AKI)",
    symptoms: ["Oliguria or anuria (< 0.5 mL/kg/hr for > 6 hours)", "Fatigue and nausea", "Peripheral or pulmonary oedema", "Confusion (uraemic)"],
    risks: ["Sepsis", "Hypovolaemia / dehydration", "Nephrotoxic drugs (NSAIDs, ACEi, aminoglycosides, IV contrast)", "Pre-existing CKD", "Urinary tract obstruction"],
    labs: ["Serum creatinine (rise >= 26 umol/L in 48h or 1.5x baseline)", "Serum potassium and bicarbonate", "Urinalysis (protein, blood, casts)", "Urgent renal tract ultrasound (exclude hydronephrosis)"],
    drugs: ["Stop nephrotoxins immediately (NSAIDs, ACEi, ARBs)", "Intravenous crystalloids for volume depletion", "Calcium gluconate 10% IV (if hyperkalaemia ECG changes)", "Insulin-dextrose infusion (drive K+ into cells)"],
    contraindications: ["Potassium-sparing diuretics", "Metformin continuation during AKI", "Potassium-containing IV fluids"],
    treatments: [
      "Identify and reverse underlying etiology (pre-renal, intrinsic, post-renal)",
      "Urgent urinary catheterization for acute urinary retention",
      "Emergency treatment of hyperkalaemia (K+ > 6.0 mmol/L)",
      "Urgent renal replacement therapy (haemodialysis) for refractory acidosis, hyperkalaemia, or pulmonary oedema",
    ],
    complications: ["Life-threatening hyperkalaemia with arrhythmias", "Severe metabolic acidosis", "Acute pulmonary oedema", "Progression to end-stage renal disease"],
  },
  {
    id: "chronic-kidney-disease",
    label: "Chronic Kidney Disease",
    symptoms: ["Fatigue", "Peripheral oedema", "Nocturia", "Pruritus", "Anorexia"],
    risks: ["Diabetes", "Hypertension", "NSAID use", "Glomerulonephritis"],
    labs: ["eGFR", "Urine ACR", "Serum potassium", "Parathyroid hormone", "Haemoglobin"],
    drugs: ["Ramipril", "Empagliflozin", "Furosemide", "Sevelamer", "Erythropoietin"],
    contraindications: [
      "Bilateral renal artery stenosis (ACEi)",
      "Hyperkalaemia",
      "Contrast nephrotoxicity",
    ],
    treatments: [
      "Blood pressure control",
      "RAAS blockade",
      "SGLT2 inhibitor",
      "Dialysis planning in stage 5",
    ],
    complications: ["Anaemia", "Renal bone disease", "Hyperkalaemia", "End-stage renal failure"],
  },
  {
    id: "acute-appendicitis",
    label: "Acute Appendicitis",
    symptoms: ["Periumbilical abdominal pain migrating to right lower quadrant (McBurney's point)", "Anorexia ('hamburger sign')", "Low-grade fever", "Nausea and vomiting", "Rebound tenderness and guarding"],
    risks: ["Age 10-30", "Faecolith obstruction of appendiceal lumen", "Lymphoid hyperplasia following viral infection"],
    labs: ["Full blood count (neutrophilic leukocytosis)", "C-reactive protein", "Urinalysis (rule out UTI / pregnancy test in females)", "Ultrasound abdomen / CT Abdomen-Pelvis with IV contrast"],
    drugs: ["Intravenous Ceftriaxone + Metronidazole", "Adequate analgesia (IV paracetamol, titrating opioids)", "Intravenous hydration"],
    contraindications: ["Administering enemas or cathartics (risk of perforation)"],
    treatments: [
      "Nil by mouth with IV fluid support",
      "Preoperative IV broad-spectrum antibiotics covering gram-negative and anaerobes",
      "Laparoscopic appendectomy (gold standard)",
    ],
    complications: ["Appendiceal perforation with peritonitis", "Appendiceal abscess / phlegmon", "Portal pyaemia (pylephlebitis)", "Adhesive small bowel obstruction"],
  },
  {
    id: "septic-shock",
    label: "Sepsis & Septic Shock",
    symptoms: ["Persistent hypotension (MAP < 65 mmHg despite volume resuscitation)", "Altered mental status", "Tachypnoea (respiratory rate > 22)", "Mottled cold peripheries or flushed skin", "Oliguria"],
    risks: ["Immunosuppression / chemotherapy", "Indwelling catheters / lines", "Recent invasive surgery", "Extreme age (< 1 or > 75)"],
    labs: ["Serum blood lactate (> 2.0 mmol/L)", "At least two sets of blood cultures prior to antibiotics", "Full blood count with differential", "Arterial blood gas", "Source investigation (chest X-ray, urine, wound swab)"],
    drugs: ["Noradrenaline (first-line vasopressor)", "Broad-spectrum IV antibiotics within 1 hour (e.g. Piperacillin-tazobactam or Meropenem)", "Balanced crystalloids 30 mL/kg within first 3 hours", "Hydrocortisone IV (in refractory shock)"],
    contraindications: ["Delaying antibiotic administration beyond 1 hour of recognition"],
    treatments: [
      "Surviving Sepsis Hour-1 bundle execution",
      "Rapid intravenous crystalloid fluid bolus (30 mL/kg)",
      "Early central venous access and noradrenaline infusion to maintain MAP >= 65 mmHg",
      "Urgent surgical or radiological source control within 6-12 hours",
    ],
    complications: ["Multi-organ dysfunction syndrome (MODS)", "Disseminated intravascular coagulation (DIC)", "Acute respiratory distress syndrome (ARDS)", "High in-hospital mortality"],
  },
  {
    id: "systemic-lupus-erythematosus",
    label: "Systemic Lupus Erythematosus (SLE)",
    symptoms: ["Malar 'butterfly' facial rash (sparing nasolabial folds)", "Photosensitivity", "Non-erosive inflammatory polyarthritis", "Oral or nasopharyngeal ulcers", "Pleurisy or pericarditis"],
    risks: ["Female sex (reproductive age 9:1 ratio)", "Family history of autoimmune disease", "African/Asian/Hispanic ancestry", "UV light exposure"],
    labs: ["Antinuclear antibodies (ANA sensitive > 95%)", "Anti-double-stranded DNA (anti-dsDNA specific, correlates with disease activity)", "Anti-Smith antibodies", "Complement C3 and C4 (consumed/low in flare)", "Urine protein-creatinine ratio (lupus nephritis)"],
    drugs: ["Hydroxychloroquine (cornerstone for all SLE patients)", "Prednisolone", "Mycophenolate mofetil", "Cyclophosphamide (severe nephritis)", "Belimumab"],
    contraindications: ["Live vaccines while on immunosuppressive therapy", "Estrogen-containing oral contraceptives if positive antiphospholipid antibodies"],
    treatments: [
      "Universal Hydroxychloroquine maintenance (reduces mortality and flares)",
      "Strict photoprotection (broad-spectrum sunscreen)",
      "Corticosteroid bursts tapered to lowest effective dose",
      "Renal biopsy for proteinuria > 0.5g/24h to classify lupus nephritis",
    ],
    complications: ["Lupus nephritis leading to ESRD", "Accelerated coronary artery disease", "Antiphospholipid syndrome with arterial/venous thromboses", "Neuropsychiatric lupus"],
  },
];

const TYPE_OF: Record<string, GraphNode["type"]> = {
  symptoms: "symptom",
  risks: "risk",
  labs: "lab",
  drugs: "drug",
  contraindications: "contraindication",
  treatments: "treatment",
  complications: "complication",
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function buildGraph(
  diseaseIds?: string[],
  /** Cap branches per relation type so the canvas stays readable. */
  maxPerRelation = Infinity,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const list = diseaseIds?.length ? DISEASES.filter((d) => diseaseIds.includes(d.id)) : DISEASES;
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (const d of list) {
    nodes.set(d.id, { id: d.id, label: d.label, type: "disease" });
    for (const key of Object.keys(TYPE_OF) as (keyof typeof TYPE_OF)[]) {
      const values = (d[key as keyof DiseaseSpec] as string[]).slice(0, maxPerRelation);
      for (const v of values) {
        const id = `${TYPE_OF[key]}:${slug(v)}`;
        if (!nodes.has(id)) nodes.set(id, { id, label: v, type: TYPE_OF[key]! });
        edges.push({ id: `${d.id}->${id}`, source: d.id, target: id, label: key });
      }
    }
  }
  return { nodes: [...nodes.values()], edges };
}

/** Naive keyword match of free text against the disease library. */
export function matchDiseases(text: string, limit = 3): DiseaseSpec[] {
  const t = text.toLowerCase();
  const scored = DISEASES.map((d) => {
    const terms = [d.label, ...d.symptoms, ...d.risks, ...d.drugs, ...d.complications];
    const score = terms.reduce((acc, term) => {
      const words = term
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter((w) => w.length > 4);
      return acc + words.filter((w) => t.includes(w)).length;
    }, 0);
    return { d, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return (scored.length ? scored : DISEASES.map((d) => ({ d, score: 0 })))
    .slice(0, limit)
    .map((s) => s.d);
}

export const NODE_COLORS: Record<GraphNode["type"], string> = {
  disease: "var(--color-primary)",
  symptom: "var(--color-info)",
  risk: "var(--color-warning)",
  lab: "var(--color-evidence)",
  drug: "var(--color-agent)",
  contraindication: "var(--color-destructive)",
  treatment: "var(--color-success)",
  complication: "var(--color-chart-5)",
};
