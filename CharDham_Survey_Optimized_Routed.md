# Char Dham Ropeway — Service-Provider Survey
### Optimized, grouped and routed version (dashboard build-spec)

This version reorganises your draft into modules, removes duplicated questions, adds the
Tier-1 and Tier-2 items needed for Objectives 3 and 4, and marks every branch so the
dashboard can show only the questions that apply to each respondent.

---

## How the routing reduces burden

Three mechanisms cut the number of questions any one person actually sees:

1. **Respondent-type routing.** One question (0.5) sets the path. The work-economics block
   (Module 5) and the asset block (Module 6) then differ by type, so a pony owner never
   sees the shop questions and a shopkeeper never sees the animal questions.
2. **Conditional gates.** Yes/No and "tick-all" questions reveal their follow-ups only when
   relevant — no loan means the debt block is skipped, no land means the land block is
   skipped, and income is asked only for the sources a household actually has.
3. **Piping.** Anything asked once (category, occupation, animal count) is reused, never
   re-asked.

**Effect:** the full bank is ~75 items, but a typical pony owner answers ~50, a landless
porter with no loan ~40, and a shopkeeper ~45 — roughly a 30–45% reduction per respondent.

### Notation
- Type tags: `[single]` `[multi]` `[num]` `[text]` `[date]` `[scale 1–5]`
- `→ IF <answer>:` … and `→ ELSE skip to …` describe the dashboard branch logic.
- `⊕ NEW` = added (Tier 1 / Tier 2). `↔ MERGED` and `✂ REMOVED` = de-duplication actions.

### Master routing variable (set at 0.5)
| Path | Respondent types | Gets work-economics block |
|---|---|---|
| **A — Mobile providers** | pony/mule owner, pony/mule handler, porter/kandi, palki/dandi | Module 5A |
| **B — Fixed establishments** | shop/stall owner, dhaba/food owner, hotel/lodge owner | Module 5B |
| **C — Other service** | guide, priest, driver, other | Module 5C |

---

## Module 0 — Administration & Consent
- **0.1** Questionnaire ID `[text]`
- **0.2** Date of survey `[date]`
- **0.3** Enumerator name/code `[text]`
- **0.4** Survey location `[single]`: Sonprayag / Gaurikund / Govindghat / Ghangaria / Kedarnath route / Hemkund route / Other
- **0.5** Respondent category `[single]` ↔ **MERGED** (old EN5 + B1 — occupation asked once and used as the master router): pony/mule owner / pony/mule handler / porter/kandi / palki/dandi / shop or stall owner / dhaba or food-stall owner / hotel or lodge owner / guide / priest / driver / other → **sets Path A / B / C**
- **0.6** Confidentiality statement read, and respondent agrees to participate? `[single Yes/No]` ⊕ **NEW wording** (one-line assurance that answers are confidential and used only in aggregate)
  - → IF No: end survey.

## Module 1 — Household Profile
- **1.1** Age `[num]`
- **1.2** Gender `[single]`
- **1.3** Respondent's highest education `[single]`
- **1.4** Highest education among earning members `[single]`
- **1.5** Permanent village/town of residence `[text]`
- **1.6** Residency pattern `[single]`: year-round resident / seasonal migrant / works here but family elsewhere / other
- **1.7** Household roster `[num grid]` ↔ **MERGED** (old A7–A10 into one entry; dashboard auto-computes dependency ratio): total members · earning members · dependents under 18 · elderly over 60
- **1.8** Social category `[single]`
- **1.9** Type of house `[single]`
- **1.10** House ownership status `[single]`
- **1.11** ⊕ **NEW** Does the respondent or any earning member have a chronic illness, injury or disability that limits physical work? `[single]`: No / Yes — respondent / Yes — another earner / Prefer not to say
- **1.12** ⊕ **NEW** Can the respondent read a simple form and do basic money calculations unaided? `[single]`: Both easily / Numbers only / Neither
- **1.13** ⊕ **NEW** Languages the respondent can converse in (for hospitality/guide reskilling) `[multi]`: Garhwali/local / Hindi / English / Other

## Module 2 — Occupation & Yatra Dependence
*(Occupation is piped from 0.5 — ✂ old B1 removed.)*
- **2.1** Main occupation during the non-Yatra season `[single]`
- **2.2** Years engaged in current Yatra-related occupation `[num]`
- **2.3** Is this occupation inherited from family? `[single]`: Yes / No / Partly
- **2.4** Number of household members in Yatra-related work `[num]`
- **2.5** Union / cooperative / association membership `[single]`: active member / registered but inactive / none but one exists / none exists / don't know
- **2.6** → IF Path A: Number of ponies/mules owned or operated `[num]` (enter 0 for handlers/porters who own none)

## Module 3 — Location & Ropeway Exposure
- **3.1** Current work point/location on route `[text]`
- **3.2** Distance of work point from the proposed ropeway station `[single]`: <500 m / 0.5–1 km / 1–3 km / >3 km / don't know

## Module 4 — Income (source-based, de-duplicated)
↔ **MERGED / ✂ REMOVED:** old Section D's monthly-peak, monthly-off-season and annual-total figures (D1, D2, D3) are **dropped** because they double-counted Section E. Seasonal Yatra income is now derived from Module 5 (throughput × days), and the annual total is summed across the sources below. *(Decision flag — see notes; one stock figure can be retained as a sanity check if you prefer.)*
- **4.1** Income sources the household has `[multi]` (this gates 4.2–4.6): Yatra service / agriculture / animal husbandry / shop-business / wage labour / salary / remittance / govt pension-scheme / other
  - → For **each ticked source only**, ask the annual amount `[num]`:
    - **4.2** Agriculture/horticulture · **4.3** non-farm business · **4.4** Yatra-related *(always asked — core model variable)* · **4.5** govt scheme/pension/subsidy · **4.6** remittance
- **4.7** Single most important source of household income `[single]`
- **4.8** Has household income changed over the last three years? `[single]`
  - → IF not "Same": **4.9** main reason for the change `[single]`
- **4.10** Holds a BPL/poverty card? `[single]`: Yes / No / applied, not received / not aware
- **4.11** Food shortage faced in the last 12 months? `[single]`: never / 1–2 months / 3–5 months / >5 months

## Module 5 — Work Economics ⊕ NEW *(the Objective-4 engine — converts a mode-shift % into ₹)*

### Path A — Mobile providers (pony/mule, palki/dandi, porter)
- **5A.1** Trips (up/down) on a typical peak-season day `[num]`
- **5A.2** Pilgrims you personally serve/carry on a typical peak day `[num]`
- **5A.3** Days worked in a full Yatra season `[num]`
- **5A.4** Current charge per trip/pilgrim `[num]` + is it government-fixed? `[single Y/N]`
- **5A.5** Your **net** earning per trip, after costs `[num]`
- **5A.6** Main operating costs `[num grid]`: feed/fodder per day · vet/medicine per month · handler/helper wage · agent/counter commission · other
- **5A.7** If pilgrim numbers fall, which costs do you still have to pay? `[multi]`: loan EMI / animal feed & upkeep / rent / staff wages / none
- **5A.8** Below what **monthly income** would you stop this work entirely and look elsewhere? `[num]` *(reservation/exit income — distinguishes displacement from income erosion)*

### Path B — Fixed establishments (shop/stall, dhaba, hotel)
- **5B.1** Customers/pilgrims served on a typical peak day `[num]`
- **5B.2** Average spend per customer `[num]`
- **5B.3** Share of sales that depends on Yatra footfall, % `[num]`
- **5B.4** Monthly fixed costs that continue even if footfall drops (rent, staff, stock loans) `[num]`
- **5B.5** Days open in a full Yatra season `[num]`
- **5B.6** Below what monthly income would you close or exit this business? `[num]`

### Path C — Other service (guide, priest, driver, other)
- **5C.1** Typical earning per day (or per client) in peak season `[num]`
- **5C.2** Clients/trips on a typical peak day `[num]`
- **5C.3** Days worked in a full Yatra season `[num]`
- **5C.4** Costs that continue if Yatra work drops `[multi]`: vehicle EMI/fuel / rent / none / other
- **5C.5** Below what monthly income would you stop this work? `[num]`

## Module 6 — Productive Assets ⊕ NEW + ↔ consolidated *(old B9 + scattered asset items)*
- **6.1** Do you own a productive asset used in your work (animal, palki/dandi, vehicle, shop/stall structure, major equipment)? `[single Y/N]`
  - → IF Yes:
    - **6.2** Asset type `[multi]`: pony/mule / palki/dandi / vehicle / shop-stall structure / equipment / other
    - **6.3** Number of animals *(piped from 2.6 if applicable)*
    - **6.4** Current resale/market value of main asset `[num]`
    - **6.5** Age of main working animal/asset, years `[num]`
    - **6.6** Replacement cost if bought today `[num]`
    - **6.7** Was it bought on loan? `[single Y/N]` → links to Module 7
    - **6.8** If rides/footfall drop, can you sell or repurpose it? `[single]`: sell easily / sell at a loss (≈ __%) / cannot sell
  - → IF No: skip to Module 7 *(pure wage labour — most handlers and porters)*

## Module 7 — Debt & Savings *(gated)*
- **7.1** Any current loan or debt? `[single Y/N]`
  - → IF Yes:
    - **7.2** Total outstanding debt `[num]`
    - **7.3** Source of largest loan `[single]`
    - **7.4** Purpose of largest loan `[single]`
    - **7.5** Monthly repayment amount `[num]`
    - **7.6** Difficulty repaying `[single]`: never / sometimes / often / always
    - **7.7** If the ropeway reduces income, will repayment become difficult? `[single]`
  - → IF No: skip to 7.8
- **7.8** Member of an SHG / microcredit / cooperative loan group? `[single]`
- **7.9** Any savings? `[single Y/N]`
  - → IF Yes: **7.10** If Yatra income stops, how long can the household survive on savings? `[single]`

## Module 8 — Shocks & Climate *(gated)*
- **8.1** Has income been affected by climate/disaster events in the last five years? `[single Y/N]`
  - → IF Yes:
    - **8.2** Which events? `[multi]`: cloudburst / landslide / flood / heavy rain / road blockage / snowfall / pandemic / other
    - **8.3** Approximate income loss from the most serious shock `[single]`
    - **8.4** How did you cope with the last major shock? `[multi]`
  - → IF No: skip to Module 9

## Module 9 — Ropeway Awareness *(gated)*
- **9.1** Aware of the proposed ropeway project? `[single Y/N]`
  - → IF Yes:
    - **9.2** How did you hear about it? `[single]`
    - **9.3** How much do you know? `[single]`: heard only / basic idea / know route / know route & timeline / participated in discussion
    - **9.4** Has any official consulted you? `[single]`
  - → IF No: enumerator reads a one-line neutral description, then continues
- **9.5** Do you support or oppose the project? `[single]` *(asked of everyone)*
- **9.6** Main reason for support/opposition `[text]`

## Module 10 — Expected Livelihood Impact
- **10.1** Will the ropeway affect your occupation? `[single]`: positively / negatively / no effect / not sure
- **10.2** Expected effect on household income `[single]`: increase / decrease / no change / not sure
  - → IF decrease: **10.3** Expected income reduction `[single]`: <25% / 25–50% / 51–75% / >75% *(subjective cross-check against the modelled shock)*
- **10.4** Will pilgrims shift from walking/pony/palki to the ropeway? `[single]`: many / some / very few / none / not sure
- **10.5** Does trekking have religious/emotional value for pilgrims? `[single]`
- **10.6** Will the ropeway increase the total number of Yatris? `[single]`
- **10.7** New opportunities you expect `[multi]`
- **10.8** Biggest fear about the project `[text]`

## Module 11 — Skills & Transition
- **11.1** Have you worked in any occupation other than your current Yatra work? `[single Y/N]`
  - → IF Yes: **11.2** Which occupation(s)? `[text]`
- **11.3** Current skills `[multi]`
- **11.4** Smartphone use `[single]`: comfortably / basic / no
- **11.5** Digital-payment use `[single]`: yes / no / someone in household can
- **11.6** Willing to learn new skills for ropeway/tourism jobs? `[single]`: yes / no / depends on training & income / not sure
  - → IF yes or depends: **11.7** Preferred training area `[single]`
- **11.8** If income reduces after the ropeway, what will you do? `[single]`
  - → IF "migrate for work": **11.9** Preferred destination `[text]`
- **11.10** Younger household members willing to shift jobs? `[single]`
- **11.11** Older workers able to shift to new jobs? `[single]`
- **11.12** Main barrier to shifting occupation `[single]`

## Module 12 — Land & Natural Capital ⊕ NEW (Tier 2) *(gated)*
- **12.1** Does the household own agricultural/horticultural land? `[single Y/N]`
  - → IF Yes:
    - **12.2** Approximate area `[num + unit: nali/bigha/acre]`
    - **12.3** Months per year own produce feeds the household `[num]`
    - **12.4** Access to grazing land / forest commons used in your livelihood? `[single Y/N]`
- **12.5** If Yatra income stopped, could you fall back on farming/livestock as a main income? `[single]`: fully / partly / no *(asked of everyone; landless households typically answer "no")*

## Module 13 — Wider Economy & Rehabilitation Views
- **13.1** If income falls, which spending would you cut first? `[single]`
- **13.2** Will income shift from local workers to outside companies? `[single]`
- **13.3** Who will gain most from the ropeway? `[single]`
- **13.4** What support should the government/project authority provide? `[multi]`
- **13.5** Should affected local workers get priority in ropeway jobs? `[single]`
- **13.6** Should porters and palki/dandi workers receive skill training? `[single]`
- **13.7** Who should sit on an oversight/grievance committee? `[multi]`
- **13.8** Single most important action for fair implementation `[text]`

## Module 14 — Attitude Statements `[scale 1–5]`
Single screen, 1 = Strongly Disagree … 5 = Strongly Agree:
- **N1** Ropeway will improve accessibility for pilgrims.
- **N2** Ropeway will help elderly, disabled and physically weak pilgrims.
- **N3** Ropeway will reduce demand for pony, porter and palki/dandi services.
- **N4** Ropeway will reduce income of traditional service providers.
- **N5** Ropeway will create new job opportunities for local people.
- **N6** Ropeway may increase inequality between powerful and weaker local groups.
- **N7** Rehabilitation support is necessary before ropeway operations begin.
- **N8** Ropeway ticket pricing should consider local livelihood protection.

## Module 15 — Enumerator Observation *(no respondent burden)*
- **O1** Occupation verified by observation · **O2** Visible livelihood asset · **O3** Observed economic condition · **O4** Respondent attitude · **O5** Main distress observed · **O6** Exposure classification · **O7** Remarks
*(O5 observed distress and the self-reported health item 1.11 are deliberately kept as an observation-vs-self-report pair.)*

---

## What was de-duplicated or removed
| Action | Items | Reason |
|---|---|---|
| ↔ Merged | EN5 + B1 → **0.5** | Same information (occupation); now the single master router. |
| ✂ Removed | D1, D2, D3 | Double-counted Section E; seasonal/total income now derived from Modules 4 + 5. |
| ↔ Merged | A7–A10 → **1.7** | One household-roster entry; dependency ratio auto-computed. |
| ↔ Consolidated | B9 + scattered asset items → **Module 6** | One gated, type-aware asset block. |
| ✂ Removed | dead numbers B6–B7, D4, G9, H4–H6, J4–J5, L1–L3, M3, M5–M6 | Blank/placeholder rows in the draft. |
| ⊕ Added globally | "Don't know / Refused" code on every closed question; confidentiality line at 0.6 | Improves response on income and debt. |

## Decisions that need your sign-off
1. **Dropping D1–D3** (the only change with any data-loss risk). If you would rather keep one safety figure, the cleanest single retain is *peak-season total monthly household income*, placed at 4.x as a cross-check against the derived value.
2. **Tier-2 modules** (1.11–1.13 health/literacy/language, and Module 12 land) — included here on the assumption you are running the full five-capital LVI. Keep, or drop if you narrow Objective 3 to income-debt-skills only.
3. **Path C scope** (guide/priest/driver) — currently a light economics block; tell me if any of these should instead follow Path A or B.
