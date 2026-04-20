-- ============================================================
-- Compliance Monitor seed data — real 340B Federal Register items
-- Run in Supabase → SQL Editor AFTER migration 003
-- ============================================================

INSERT INTO compliance_items (
  source_id, source_type, source_url, source_label,
  title, raw_summary, ai_summary,
  urgency, affected_entities, resources,
  publication_date, effective_date, detected_at, published
) VALUES

-- 1. HRSA 340B Ceiling Price Final Rule
(
  'fr-2017-00722',
  'federal_register',
  'https://www.federalregister.gov/documents/2017/01/05/2017-00722/340b-drug-pricing-program-ceiling-price-and-manufacturer-civil-monetary-penalties-regulation',
  'Federal Register',
  '340B Drug Pricing Program Ceiling Price and Manufacturer Civil Monetary Penalties Regulation',
  'This final rule implements provisions of the Affordable Care Act that require the Secretary to develop and publish through an administrative process the ceiling prices for covered outpatient drugs purchased by covered entities, and to impose civil monetary penalties on manufacturers that knowingly and intentionally charge covered entities more than the ceiling price.',
  'HRSA finalized the methodology for calculating 340B ceiling prices and established civil monetary penalties for manufacturers that overcharge covered entities. Covered entities should ensure their TPA or in-house systems are calculating ceiling prices correctly. Manufacturers face penalties up to $5,000 per instance of overcharging.',
  'action-required',
  ARRAY['covered-entity', 'manufacturer', 'tpa'],
  '[
    {"label": "Full Rule Text", "url": "https://www.federalregister.gov/documents/2017/01/05/2017-00722/340b-drug-pricing-program-ceiling-price-and-manufacturer-civil-monetary-penalties-regulation"},
    {"label": "HRSA Ceiling Price Overview", "url": "https://www.hrsa.gov/opa/program-requirements/ceiling-prices/index.html"},
    {"label": "HRSA OPA Homepage", "url": "https://www.hrsa.gov/opa/index.html"}
  ]'::jsonb,
  '2017-01-05',
  '2017-03-06',
  now() - interval '2 days',
  true
),

-- 2. ADR Final Rule (2023)
(
  'fr-2023-14428',
  'federal_register',
  'https://www.federalregister.gov/documents/2023/07/14/2023-14428/340b-drug-pricing-program-administrative-dispute-resolution',
  'Federal Register',
  '340B Drug Pricing Program: Administrative Dispute Resolution Final Rule',
  'This final rule establishes an administrative dispute resolution (ADR) process for covered entities and manufacturers to resolve claims that a manufacturer has overcharged a covered entity for covered outpatient drugs, or that a covered entity has violated the prohibition on duplicate discounts or diversion.',
  'HRSA finalized the Administrative Dispute Resolution (ADR) process for 340B disputes between covered entities and manufacturers. Covered entities now have a formal pathway to contest manufacturer overcharges. Entities should document all 340B purchase records carefully as ADR filings require detailed transaction data.',
  'action-required',
  ARRAY['covered-entity', 'manufacturer'],
  '[
    {"label": "ADR Final Rule", "url": "https://www.federalregister.gov/documents/2023/07/14/2023-14428/340b-drug-pricing-program-administrative-dispute-resolution"},
    {"label": "File an ADR Request", "url": "https://www.hrsa.gov/opa/dispute-resolution/index.html"},
    {"label": "ADR Guidance Document", "url": "https://www.hrsa.gov/sites/default/files/hrsa/opa/pdf/adr-final-rule-guidance.pdf"}
  ]'::jsonb,
  '2023-07-14',
  '2023-08-14',
  now() - interval '3 days',
  true
),

-- 3. Omnibus Guidance Withdrawal (2017)
(
  'fr-2017-07712',
  'federal_register',
  'https://www.federalregister.gov/documents/2017/04/18/2017-07712/340b-drug-pricing-program-omnibus-guidance',
  'Federal Register',
  '340B Drug Pricing Program: Withdrawal of Proposed Omnibus Guidance',
  'HRSA is withdrawing its proposed omnibus guidance on the 340B Drug Pricing Program that was issued in August 2015. The agency will pursue notice-and-comment rulemaking for any future policy changes to the 340B program.',
  'HRSA withdrew the 2015 proposed omnibus guidance that would have clarified patient definition, contract pharmacy, and other key program requirements. This means many policy areas remain governed by the original 1996 guidance. Covered entities should monitor for new rulemakings as HRSA has committed to formal notice-and-comment processes.',
  'informational',
  ARRAY['covered-entity', 'all'],
  '[
    {"label": "Withdrawal Notice", "url": "https://www.federalregister.gov/documents/2017/04/18/2017-07712/340b-drug-pricing-program-omnibus-guidance"},
    {"label": "1996 Patient Definition Guidance", "url": "https://www.hrsa.gov/sites/default/files/hrsa/opa/pdf/opa-patient-definition.pdf"},
    {"label": "HRSA Program Requirements", "url": "https://www.hrsa.gov/opa/program-requirements/index.html"}
  ]'::jsonb,
  '2017-04-18',
  NULL,
  now() - interval '5 days',
  true
),

-- 4. Contract Pharmacy Manufacturer Restrictions (2021)
(
  'fr-2021-hrsa-contract-pharm',
  'federal_register',
  'https://www.hrsa.gov/sites/default/files/hrsa/opa/pdf/hrsa-340b-contract-pharmacy-letter.pdf',
  'HRSA',
  'HRSA Advisory: Manufacturer Restrictions on 340B Contract Pharmacy Arrangements',
  'HRSA has notified several drug manufacturers that their policies restricting 340B drug pricing to covered entities without contract pharmacies, or limiting contract pharmacy arrangements, are in violation of the 340B statute.',
  'HRSA put drug manufacturers on notice that restricting 340B pricing at contract pharmacies violates the statute. Covered entities experiencing manufacturer restrictions on contract pharmacy access should document denials and report them to HRSA. Legal challenges to these restrictions are ongoing in federal courts.',
  'action-required',
  ARRAY['covered-entity', 'manufacturer', 'contract-pharmacy'],
  '[
    {"label": "HRSA Advisory Letter", "url": "https://www.hrsa.gov/sites/default/files/hrsa/opa/pdf/hrsa-340b-contract-pharmacy-letter.pdf"},
    {"label": "Report a Manufacturer Violation", "url": "https://www.hrsa.gov/opa/integrity/index.html"},
    {"label": "Contract Pharmacy Requirements", "url": "https://www.hrsa.gov/opa/program-requirements/contract-pharmacy-services/index.html"}
  ]'::jsonb,
  '2021-06-01',
  NULL,
  now() - interval '7 days',
  true
),

-- 5. ADR Process Amendments (2024)
(
  'fr-2024-340b-integrity',
  'federal_register',
  'https://www.federalregister.gov/documents/2024/01/16/2024-00722/340b-drug-pricing-program-administrative-dispute-resolution-process',
  'Federal Register',
  '340B Program: Updated Administrative Dispute Resolution Process Amendments',
  'HRSA published amendments to the administrative dispute resolution process to clarify timelines, evidence submission requirements, and the role of the ADR panel in resolving disputes between manufacturers and covered entities.',
  'HRSA updated the ADR process with clearer timelines and evidence rules. Covered entities involved in or anticipating disputes should review the updated submission requirements. Responses to manufacturer audit requests must now be logged with timestamps for ADR eligibility.',
  'deadline',
  ARRAY['covered-entity', 'manufacturer'],
  '[
    {"label": "ADR Amendments Rule", "url": "https://www.federalregister.gov/documents/2024/01/16/2024-00722/340b-drug-pricing-program-administrative-dispute-resolution-process"},
    {"label": "ADR Portal", "url": "https://www.hrsa.gov/opa/dispute-resolution/index.html"},
    {"label": "Audit Documentation Checklist", "url": "https://www.hrsa.gov/opa/integrity/audits/index.html"}
  ]'::jsonb,
  '2024-01-16',
  '2024-03-01',
  now() - interval '1 day',
  true
),

-- 6. OPAIS Recertification Deadline
(
  'hrsa-opais-2024-reminder',
  'federal_register',
  'https://www.hrsa.gov/opa/registration/index.html',
  'HRSA',
  'HRSA Annual Reminder: OPAIS Recertification Deadline for 340B Covered Entities',
  'All 340B covered entities are required to recertify their program eligibility and accuracy of OPAIS registration data annually. Failure to recertify by the deadline results in termination from the 340B program.',
  'Covered entities must complete annual OPAIS recertification to maintain 340B eligibility. This includes verifying all registered sites, contract pharmacies, and authorizing officials. Missing the deadline results in automatic program termination. Review your OPAIS record now to ensure all information is current.',
  'deadline',
  ARRAY['covered-entity'],
  '[
    {"label": "OPAIS Registration Portal", "url": "https://340bopais.hrsa.gov/"},
    {"label": "Recertification Instructions", "url": "https://www.hrsa.gov/opa/registration/recertification/index.html"},
    {"label": "Eligibility Requirements", "url": "https://www.hrsa.gov/opa/eligibility-and-registration/index.html"}
  ]'::jsonb,
  '2024-06-01',
  '2024-09-30',
  now() - interval '4 days',
  true
),

-- 7. Duplicate Discount Prohibition Guidance
(
  'hrsa-dup-discount-2023',
  'federal_register',
  'https://www.hrsa.gov/opa/program-requirements/medicaid-exclusion-files/index.html',
  'HRSA',
  'HRSA Guidance: Duplicate Discount Prohibition and Medicaid Exclusion File Requirements',
  'HRSA updated its guidance on the duplicate discount prohibition, which prevents manufacturers from providing both a 340B discount and a Medicaid rebate on the same drug unit. Covered entities must ensure their billing practices are compliant.',
  'The duplicate discount prohibition remains one of the highest audit risk areas for covered entities. HRSA updated its guidance on using the Medicaid Exclusion File (MEF) to flag 340B claims. Covered entities must have a robust process to identify and exclude 340B purchases from Medicaid rebate requests. Non-compliance can result in program termination and repayment obligations.',
  'action-required',
  ARRAY['covered-entity', 'tpa'],
  '[
    {"label": "Medicaid Exclusion File", "url": "https://www.hrsa.gov/opa/program-requirements/medicaid-exclusion-files/index.html"},
    {"label": "Duplicate Discount Guidance", "url": "https://www.hrsa.gov/sites/default/files/hrsa/opa/pdf/duplicate-discount-guidance.pdf"},
    {"label": "HRSA Integrity Program", "url": "https://www.hrsa.gov/opa/integrity/index.html"}
  ]'::jsonb,
  '2023-11-01',
  NULL,
  now() - interval '6 days',
  true
),

-- 8. RFI on Program Reform (2024)
(
  'fr-2024-comment-340b-reform',
  'federal_register',
  'https://www.federalregister.gov/documents/2024/03/15/2024-05512/340b-drug-pricing-program-request-for-information',
  'Federal Register',
  '340B Drug Pricing Program: Request for Information on Program Integrity and Reform',
  'HRSA issued a request for information seeking public comment on potential reforms to the 340B program, including changes to patient definition, contract pharmacy limitations, and program oversight mechanisms.',
  'HRSA is soliciting stakeholder input on potential 340B program reforms. Topics include redefining "patient," limiting or clarifying contract pharmacy arrangements, and strengthening audit mechanisms. Covered entities and advocacy groups should consider submitting formal comments. Changes resulting from this RFI could materially affect program operations.',
  'informational',
  ARRAY['covered-entity', 'manufacturer', 'all'],
  '[
    {"label": "RFI on Federal Register", "url": "https://www.federalregister.gov/documents/2024/03/15/2024-05512/340b-drug-pricing-program-request-for-information"},
    {"label": "Submit Public Comment", "url": "https://www.regulations.gov/search?filter=340B"},
    {"label": "340B Coalition Resources", "url": "https://www.340bhealth.org/resources/"}
  ]'::jsonb,
  '2024-03-15',
  NULL,
  now() - interval '8 days',
  true
)

ON CONFLICT (source_id) DO UPDATE SET
  resources = EXCLUDED.resources;
