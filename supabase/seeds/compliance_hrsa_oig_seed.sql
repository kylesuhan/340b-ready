-- ============================================================
-- Compliance Monitor seed — HRSA & OIG source items
-- Run in Supabase → SQL Editor
-- ============================================================

INSERT INTO compliance_items (
  source_id, source_type, source_url, source_label,
  title, raw_summary, ai_summary,
  urgency, affected_entities, resources,
  publication_date, effective_date, detected_at, published
) VALUES

-- 1. HRSA 340B Program Integrity Initiative
(
  'hrsa-integrity-2024-01',
  'hrsa',
  'https://www.hrsa.gov/opa/integrity/index.html',
  'HRSA 340B Integrity',
  'HRSA 340B Program Integrity Initiative: Audit Findings Summary 2024',
  'HRSA conducts audits of covered entities and manufacturers to ensure compliance with 340B program requirements. Common findings include patient eligibility errors, duplicate discount violations, and diversion of 340B drugs to ineligible patients.',
  'HRSA published its 2024 audit findings summary highlighting the most common 340B compliance violations. Top findings include improper patient eligibility determinations, failure to exclude 340B claims from Medicaid rebate requests, and inadequate contract pharmacy oversight. Covered entities should perform internal audits against these findings before HRSA contact.',
  'action-required',
  ARRAY['covered-entity', 'tpa'],
  '[
    {"label": "HRSA Integrity Program", "url": "https://www.hrsa.gov/opa/integrity/index.html"},
    {"label": "Audit Self-Assessment Tool", "url": "https://www.hrsa.gov/opa/integrity/audits/index.html"},
    {"label": "Common Audit Findings", "url": "https://www.hrsa.gov/sites/default/files/hrsa/opa/pdf/audit-findings-summary.pdf"}
  ]'::jsonb,
  '2024-02-01',
  NULL,
  now() - interval '3 days',
  true
),

-- 2. HRSA OPAIS System Update Notice
(
  'hrsa-opais-system-2024',
  'hrsa',
  'https://www.hrsa.gov/opa/registration/index.html',
  'HRSA 340B Program Updates',
  'HRSA OPAIS System Update: New Fields Required for Contract Pharmacy Registration',
  'HRSA updated the OPAIS system to require additional data fields when registering contract pharmacy arrangements, including dispensing records attestation and TPA information.',
  'HRSA updated OPAIS to require covered entities to provide additional details when registering contract pharmacies, including Third Party Administrator (TPA) information and a new attestation regarding dispensing record access. Entities adding new contract pharmacies after the effective date must complete these additional fields or registration will be rejected.',
  'deadline',
  ARRAY['covered-entity', 'contract-pharmacy'],
  '[
    {"label": "OPAIS System", "url": "https://340bopais.hrsa.gov/"},
    {"label": "Contract Pharmacy Registration Guide", "url": "https://www.hrsa.gov/opa/program-requirements/contract-pharmacy-services/index.html"},
    {"label": "HRSA Program Updates", "url": "https://www.hrsa.gov/opa/updates/index.html"}
  ]'::jsonb,
  '2024-04-01',
  '2024-05-15',
  now() - interval '2 days',
  true
),

-- 3. HRSA Manufacturer Compliance Notice — Penny Pricing
(
  'hrsa-penny-pricing-2024',
  'hrsa',
  'https://www.hrsa.gov/opa/integrity/index.html',
  'HRSA 340B Integrity',
  'HRSA Notice to Manufacturers: Penny Pricing and Ceiling Price Calculation Requirements',
  'HRSA issued guidance clarifying that when a 340B ceiling price calculates to less than $0.01, manufacturers must charge a penny per unit rather than providing the drug for free. This penny pricing policy applies to all covered outpatient drugs subject to the 340B program.',
  'HRSA clarified that penny pricing applies when the calculated 340B ceiling price is below $0.01. Manufacturers must charge exactly $0.01 — not zero. Covered entities should verify their TPA or purchasing system correctly handles penny-priced drugs to avoid overpaying or triggering overcharge disputes.',
  'informational',
  ARRAY['covered-entity', 'manufacturer', 'tpa'],
  '[
    {"label": "Ceiling Price Overview", "url": "https://www.hrsa.gov/opa/program-requirements/ceiling-prices/index.html"},
    {"label": "Penny Pricing Guidance", "url": "https://www.hrsa.gov/sites/default/files/hrsa/opa/pdf/penny-pricing-guidance.pdf"},
    {"label": "340B PRIME System", "url": "https://340bprime.hrsa.gov/"}
  ]'::jsonb,
  '2023-09-01',
  NULL,
  now() - interval '6 days',
  true
),

-- 4. OIG Work Plan — 340B Contract Pharmacy Oversight
(
  'oig-workplan-340b-contract-pharm-2024',
  'oig',
  'https://oig.hhs.gov/reports-and-publications/workplan/summary/wp-summary-0000873.asp',
  'OIG Work Plan — 340B',
  'OIG Work Plan Item: Medicare Reimbursement for Drugs Purchased Under the 340B Program',
  'The OIG will review Medicare reimbursement for drugs purchased under the 340B drug pricing program to determine whether Medicare is reimbursing hospitals appropriately and whether hospitals are correctly identifying 340B claims on Medicare cost reports.',
  'The OIG has an active work plan item examining Medicare reimbursement for 340B-purchased drugs. This includes reviewing whether covered entities are correctly flagging 340B claims and whether cost reporting is accurate. Hospitals and health systems should ensure their 340B billing compliance programs are current and that 340B modifier use on Medicare claims is consistent.',
  'action-required',
  ARRAY['covered-entity'],
  '[
    {"label": "OIG Work Plan Item", "url": "https://oig.hhs.gov/reports-and-publications/workplan/summary/wp-summary-0000873.asp"},
    {"label": "OIG 340B Reports", "url": "https://oig.hhs.gov/reports-and-publications/oei/t.asp?t=340B"},
    {"label": "Medicare 340B Billing Guide", "url": "https://www.cms.gov/Medicare/Medicare-Fee-for-Service-Payment/AcuteInpatientPPS/Downloads/340B-Drug-Pricing-Program.pdf"}
  ]'::jsonb,
  '2024-01-01',
  NULL,
  now() - interval '4 days',
  true
),

-- 5. OIG Report — 340B Covered Entity Compliance
(
  'oig-report-340b-ce-compliance-2023',
  'oig',
  'https://oig.hhs.gov/oei/reports/OEI-05-19-00100.asp',
  'OIG Work Plan — 340B',
  'OIG Report: Hospitals in the 340B Program Did Not Always Meet Requirements for Child Site Registration and Contract Pharmacy Arrangements',
  'This OIG report found that some hospitals participating in the 340B program did not always meet requirements for registering child sites and contract pharmacy arrangements in OPAIS, creating program integrity risks.',
  'The OIG found that a significant portion of reviewed hospitals had unregistered child sites or contract pharmacies operating under the 340B program — a direct compliance violation. All covered entities should audit their OPAIS registration to ensure every dispensing site and contract pharmacy is properly registered. Unregistered sites must stop 340B purchasing immediately until registered.',
  'action-required',
  ARRAY['covered-entity'],
  '[
    {"label": "OIG Report Full Text", "url": "https://oig.hhs.gov/oei/reports/OEI-05-19-00100.asp"},
    {"label": "OPAIS Site Registration", "url": "https://340bopais.hrsa.gov/"},
    {"label": "HRSA Child Site Requirements", "url": "https://www.hrsa.gov/opa/eligibility-and-registration/hospitals/child-sites/index.html"}
  ]'::jsonb,
  '2023-06-15',
  NULL,
  now() - interval '8 days',
  true
),

-- 6. HRSA Manufacturer Audit Results — Overcharging
(
  'hrsa-mfr-audit-2024-overcharge',
  'hrsa',
  'https://www.hrsa.gov/opa/integrity/manufacturers/index.html',
  'HRSA 340B Integrity',
  'HRSA Manufacturer Audit Results: Overcharging Violations and Civil Monetary Penalty Actions',
  'HRSA completed manufacturer audits and identified instances of overcharging covered entities above the 340B ceiling price. HRSA initiated civil monetary penalty proceedings against manufacturers found to have knowingly and intentionally overcharged.',
  'HRSA completed its most recent round of manufacturer audits and identified multiple instances of overcharging. Covered entities that believe they have been overcharged should use the price verification tools available through 340B PRIME and consider filing an ADR request. HRSA has authority to impose up to $5,000 per overcharge incident.',
  'informational',
  ARRAY['covered-entity', 'manufacturer'],
  '[
    {"label": "Manufacturer Audit Program", "url": "https://www.hrsa.gov/opa/integrity/manufacturers/index.html"},
    {"label": "340B PRIME Price Verification", "url": "https://340bprime.hrsa.gov/"},
    {"label": "File ADR Request", "url": "https://www.hrsa.gov/opa/dispute-resolution/index.html"}
  ]'::jsonb,
  '2024-03-01',
  NULL,
  now() - interval '5 days',
  true
),

-- 7. OIG Work Plan — Diversion and Duplicate Discounts
(
  'oig-workplan-diversion-2024',
  'oig',
  'https://oig.hhs.gov/reports-and-publications/workplan/summary/wp-summary-0000912.asp',
  'OIG Work Plan — 340B',
  'OIG Work Plan Item: 340B Program — Diversion and Duplicate Discount Safeguards',
  'The OIG will evaluate the safeguards covered entities and manufacturers have in place to prevent diversion of 340B drugs to ineligible patients and duplicate discounts on Medicaid claims.',
  'The OIG is actively reviewing whether covered entities have adequate safeguards against the two highest-risk 340B violations: drug diversion and duplicate discounts. Organizations should review their split-billing software, Medicaid exclusion file processes, and patient eligibility screening procedures. Documentation of all safeguard controls is essential in the event of an OIG or HRSA review.',
  'action-required',
  ARRAY['covered-entity', 'tpa', 'contract-pharmacy'],
  '[
    {"label": "OIG Work Plan Item", "url": "https://oig.hhs.gov/reports-and-publications/workplan/summary/wp-summary-0000912.asp"},
    {"label": "Medicaid Exclusion File", "url": "https://www.hrsa.gov/opa/program-requirements/medicaid-exclusion-files/index.html"},
    {"label": "Diversion Prevention Guidance", "url": "https://www.hrsa.gov/sites/default/files/hrsa/opa/pdf/opa-diversion-guidance.pdf"}
  ]'::jsonb,
  '2024-02-15',
  NULL,
  now() - interval '7 days',
  true
),

-- 8. HRSA 340B Program Notice — Telehealth Patient Definition
(
  'hrsa-telehealth-patient-def-2023',
  'hrsa',
  'https://www.hrsa.gov/opa/program-requirements/patient-definition/index.html',
  'HRSA 340B Program Updates',
  'HRSA Program Notice: Application of Patient Definition Requirements to Telehealth Encounters',
  'HRSA issued a program notice clarifying how the 340B patient definition applies to patients receiving services via telehealth. The notice addresses whether telehealth visits qualify as covered entity encounters for 340B eligibility purposes.',
  'HRSA clarified that telehealth encounters can satisfy the 340B patient definition requirement, but only when the telehealth visit is conducted by a covered entity provider and the patient has an established healthcare relationship with that covered entity. Incidental or one-time telehealth visits through third-party platforms do not qualify. Covered entities using telehealth should review their patient eligibility policies.',
  'action-required',
  ARRAY['covered-entity'],
  '[
    {"label": "Patient Definition Requirements", "url": "https://www.hrsa.gov/opa/program-requirements/patient-definition/index.html"},
    {"label": "HRSA Telehealth Notice", "url": "https://www.hrsa.gov/sites/default/files/hrsa/opa/pdf/telehealth-patient-definition-notice.pdf"},
    {"label": "HRSA Program Updates", "url": "https://www.hrsa.gov/opa/updates/index.html"}
  ]'::jsonb,
  '2023-08-01',
  NULL,
  now() - interval '9 days',
  true
)

ON CONFLICT (source_id) DO NOTHING;
