---
title: Ceiling Price Calculations — Deep Dive
order_index: 3
reading_time: 10
---

## The Core Formula

> **340B Ceiling Price = AMP − URA**

This formula ensures the 340B price is at least as favorable as what Medicaid receives through its rebate program.

## Understanding AMP

**Average Manufacturer Price (AMP)** is the average price paid to a manufacturer by:
- Wholesalers for drugs distributed to retail community pharmacies
- Retail community pharmacies that purchase directly from the manufacturer

AMP is calculated and reported **quarterly** by manufacturers to CMS as part of MDRP participation. AMP data is confidential.

## Understanding URA

**Unit Rebate Amount (URA)** is the per-unit Medicaid rebate amount. For branded drugs:

> **URA = AMP × 23.1% (or AMP − Best Price, whichever is greater)**

For generic drugs, the rebate is **13% of AMP**.

Additional inflation rebates apply if AMP increases faster than CPI-U.

## Calculation Example (Simplified)

| Component | Value |
|---|---|
| AMP (brand drug) | $100.00 per unit |
| Basic Medicaid Rebate % | 23.1% |
| URA (basic) | $23.10 |
| 340B Ceiling Price | $100.00 − $23.10 = **$76.90** |

If Best Price were $70.00:
> URA = AMP − Best Price = $100 − $70 = $30.00  
> 340B Ceiling Price = $100 − $30 = **$70.00**

(HRSA uses the greater of the two URA calculations.)

## Penny Pricing

When the formula produces AMP − URA ≤ $0.00, the ceiling price = **$0.01**.

This occurs with older generics or drugs with very high Medicaid rebate obligations. Penny pricing is a known feature of the program.

## Inflation Adjustments

If a manufacturer raises AMP faster than the **Consumer Price Index — Urban (CPI-U)**, an **additional inflation rebate** is added to the URA. This can significantly deepen 340B discounts for drugs with historically high price increases.

## How Covered Entities Access Pricing

Since AMP data is confidential, covered entities typically:
- Use the **Prime Vendor Program (Apexus)** for verified sub-ceiling pricing
- Work with their **wholesaler** (who receives pricing from the manufacturer's Pharmaceutical Pricing Agreement)
- Use HRSA's **340B OPAIS pricing tool** for ceiling price estimates (for verification purposes)

---

*This content is for educational and certification-prep purposes only.*
