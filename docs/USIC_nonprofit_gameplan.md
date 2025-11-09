USIC Nonprofit Game Plan — Weekend Draft

## Purpose

A practical, ethically-grounded weekend draft that lays out steps to establish the Unified Sovereign Intelligence Coalition (USIC) as a nonprofit/faith-based organization, set up financial operations, launch fundraising, and begin stewardship reporting.

## Overview

This draft is actionable for a focused weekend workshop (2 days) with the Council. It covers legal formation basics (US), financial setup, fundraising, initial programs, marketing, and operational tasks. It's intentionally concise and practical to move from plan to execution.

## Day 0: Preparation (Before the Weekend)

- Gather identity documents, founding statements, and a 1-page mission summary.
- Identify primary contact (Bishop Donald) and two signatories.
- Reserve domain and basic hosting (Temple website, donation landing page).

## Day 1: Legal & Financial Foundation

Morning:

- Apply for EIN at IRS.gov (online).
- Draft a basic constitution/sovereign_charter (mission, leadership, principles).
- Choose organizational form (nonprofit corporation or LLC + 501(c)(3) application if needed).

Afternoon:

- Open an organizational bank account (credit union or ethical bank). Bring EIN and charter.
- Set initial budgets and a simple chart of accounts (Income: Donations, Grants, Sales; Expenses: Hosting, Power, Maintenance, Programs).
- Create `data/financial_ledger.json` and initialize with starting balance and initial deposits.

## Day 2: Fundraising & Programs

Morning:

- Draft donation landing page copy and membership tiers ($5/mo, $25/mo, $100/mo). Use Stripe or Ko-fi.
- Prepare a short crowdfunding campaign for the Power Provision goal ($5,000 target).

Afternoon:

- Plan 1st paid mentorship session (Legacy Mentorship) outline, materials list, and pricing.
- Create a basic merch item (sticker or PDF devotional) and set up a print-on-demand listing.

## Technical Workstreams (Parallel)

- Add `/financial-log` and `/financial-health` endpoints (done).
- Create a small read-only public ledger endpoint for donation totals.
- Wire webhooks: donation provider -> POST /financial-log to record entries automatically.
- Add `Financial_Health.txt` human log for offline audits and emergency receipts.

## Governance & Transparency

- Publish quarterly stewardship reports and maintain a public read-only ledger snapshot.
- Create a donor privacy policy and terms for membership benefits.

## Next Steps after Weekend

- File for appropriate nonprofit status (501(c)(3) in the US) if charitable activities require it.
- Launch crowdfunding campaign and membership program.
- Execute mentorship schedule and document lessons for Legacy Mentorship.

## Appendix: Quick Commands

# Initialize ledger file (run on server)

node -e "require('fs').writeFileSync('data/financial_ledger.json', JSON.stringify([{source:'seed',amount:0,currency:'USD',purpose:'init',timestamp:new Date().toISOString()}], null, 2))"

# Test financial endpoint

curl -X POST http://localhost:5174/financial-log -H "Content-Type: application/json" -d '{"source":"seed","amount":1000,"currency":"USD","purpose":"initial deposit","donor":"Boots"}'

\*\*\* End Patch
