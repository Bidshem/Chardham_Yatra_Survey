/* =============================================================================
   Char Dham Ropeway — Service-Provider Survey
   SURVEY SCHEMA (data-driven, with routing + conditional gates)

   Each module = one step/page in the form.
   Each question:
     id      : MD numbering ("0.1", "5A.3" ...) — also the stored key
     label   : question text
     type    : 'single' | 'multi' | 'num' | 'text' | 'date' | 'scale' | 'numgrid' | 'note'
     options : array of choices (single / multi)
     fields  : [{key,label}] for numgrid
     unit    : optional suffix shown after a num input
     required: boolean
     noDKR   : true  -> do NOT append "Don't know / Refused" to a single question
     showIf  : (a) => boolean — a is the answers map keyed by question id.
               Question only renders (and is only validated) when this returns true.

   Path routing (set at 0.5):
     A — Mobile providers      : pony/mule owner, pony/mule handler, porter/kandi, palki/dandi
     B — Fixed establishments  : shop or stall owner, dhaba or food-stall owner, hotel or lodge owner
     C — Other service         : guide, priest, driver, other
   ========================================================================== */

const DKR = "Don't know / Refused";

const CATEGORY_OPTIONS = [
  "Pony/mule owner",
  "Pony/mule handler",
  "Porter/kandi",
  "Palki/dandi",
  "Shop or stall owner",
  "Dhaba or food-stall owner",
  "Hotel or lodge owner",
  "Guide",
  "Priest",
  "Driver",
  "Other",
];

// Maps category -> path
const PATH_MAP = {
  "Pony/mule owner": "A",
  "Pony/mule handler": "A",
  "Porter/kandi": "A",
  "Palki/dandi": "A",
  "Shop or stall owner": "B",
  "Dhaba or food-stall owner": "B",
  "Hotel or lodge owner": "B",
  "Guide": "C",
  "Priest": "C",
  "Driver": "C",
  "Other": "C",
};

function pathOf(a) {
  return PATH_MAP[a["0.5"]] || null;
}

// Helper used by Module 4 gating: did respondent tick this income source?
function hasSource(a, src) {
  const v = a["4.1"];
  return Array.isArray(v) && v.includes(src);
}

const INCOME_SOURCES = [
  "Yatra service",
  "Agriculture",
  "Animal husbandry",
  "Shop-business",
  "Wage labour",
  "Salary",
  "Remittance",
  "Govt pension-scheme",
  "Other",
];

const EDUCATION_OPTIONS = [
  "No formal education",
  "Primary (up to 5th)",
  "Middle (up to 8th)",
  "Secondary (up to 10th)",
  "Higher secondary (12th)",
  "Graduate or above",
];

const SURVEY = [
  /* ---------------------------------------------------------------- Module 0 */
  {
    id: "M0",
    title: "Administration & Consent",
    subtitle: "Module 0",
    questions: [
      { id: "0.1", label: "Questionnaire ID", type: "text", required: true },
      { id: "0.2", label: "Date of survey", type: "date", required: true },
      { id: "0.3", label: "Enumerator name / code", type: "text", required: true },
      {
        id: "0.4",
        label: "Survey location",
        type: "single",
        options: ["Sonprayag", "Gaurikund", "Govindghat", "Ghangaria", "Kedarnath route", "Hemkund route", "Other"],
        required: true,
      },
      {
        id: "0.5",
        label: "Respondent category (sets the survey path A / B / C)",
        type: "single",
        options: CATEGORY_OPTIONS,
        noDKR: true,
        required: true,
      },
      {
        id: "0.6",
        label:
          "Confidentiality statement read: your answers are confidential and used only in aggregate. Does the respondent agree to participate?",
        type: "single",
        options: ["Yes", "No"],
        noDKR: true,
        required: true,
      },
      {
        id: "0.6note",
        type: "note",
        label:
          "⚠ Respondent did not consent. Please end the survey here — do not record further answers. You may still submit this record (it will be marked as 'No consent').",
        showIf: (a) => a["0.6"] === "No",
      },
    ],
  },

  /* ---------------------------------------------------------------- Module 1 */
  {
    id: "M1",
    title: "Household Profile",
    subtitle: "Module 1",
    showIf: (a) => a["0.6"] !== "No",
    questions: [
      { id: "1.1", label: "Age", type: "num", unit: "years", required: true },
      { id: "1.2", label: "Gender", type: "single", options: ["Male", "Female", "Other"], noDKR: true, required: true },
      { id: "1.3", label: "Respondent's highest education", type: "single", options: EDUCATION_OPTIONS, required: true },
      { id: "1.4", label: "Highest education among earning members", type: "single", options: EDUCATION_OPTIONS },
      { id: "1.5", label: "Permanent village / town of residence", type: "text", required: true },
      {
        id: "1.6",
        label: "Residency pattern",
        type: "single",
        options: ["Year-round resident", "Seasonal migrant", "Works here but family elsewhere", "Other"],
        required: true,
      },
      {
        id: "1.7",
        label: "Household roster (dependency ratio is auto-computed)",
        type: "numgrid",
        fields: [
          { key: "total", label: "Total members" },
          { key: "earning", label: "Earning members" },
          { key: "dependents", label: "Dependents under 18" },
          { key: "elderly", label: "Elderly over 60" },
        ],
        required: true,
      },
      { id: "1.8", label: "Social category", type: "single", options: ["General", "OBC", "SC", "ST", "Other"] },
      { id: "1.9", label: "Type of house", type: "single", options: ["Kutcha", "Semi-pucca", "Pucca", "Other"] },
      { id: "1.10", label: "House ownership status", type: "single", options: ["Owned", "Rented", "Provided by employer", "Other"] },
      {
        id: "1.11",
        label: "Does the respondent or any earning member have a chronic illness, injury or disability that limits physical work?",
        type: "single",
        options: ["No", "Yes — respondent", "Yes — another earner", "Prefer not to say"],
        noDKR: true,
      },
      {
        id: "1.12",
        label: "Can the respondent read a simple form and do basic money calculations unaided?",
        type: "single",
        options: ["Both easily", "Numbers only", "Neither"],
        noDKR: true,
      },
      {
        id: "1.13",
        label: "Languages the respondent can converse in",
        type: "multi",
        options: ["Garhwali / local", "Hindi", "English", "Other"],
      },
    ],
  },

  /* ---------------------------------------------------------------- Module 2 */
  {
    id: "M2",
    title: "Occupation & Yatra Dependence",
    subtitle: "Module 2 — occupation is piped from 0.5",
    showIf: (a) => a["0.6"] !== "No",
    questions: [
      {
        id: "2.1",
        label: "Main occupation during the non-Yatra season",
        type: "single",
        options: ["Agriculture", "Animal husbandry", "Wage labour", "Shop / business", "Salaried job", "No other work", "Other"],
        required: true,
      },
      { id: "2.2", label: "Years engaged in current Yatra-related occupation", type: "num", unit: "years", required: true },
      { id: "2.3", label: "Is this occupation inherited from family?", type: "single", options: ["Yes", "No", "Partly"], noDKR: true },
      { id: "2.4", label: "Number of household members in Yatra-related work", type: "num" },
      {
        id: "2.5",
        label: "Union / cooperative / association membership",
        type: "single",
        options: ["Active member", "Registered but inactive", "None but one exists", "None exists", "Don't know"],
        noDKR: true,
      },
      {
        id: "2.6",
        label: "Number of ponies/mules owned or operated (enter 0 if none)",
        type: "num",
        showIf: (a) => pathOf(a) === "A",
      },
    ],
  },

  /* ---------------------------------------------------------------- Module 3 */
  {
    id: "M3",
    title: "Location & Ropeway Exposure",
    subtitle: "Module 3",
    showIf: (a) => a["0.6"] !== "No",
    questions: [
      { id: "3.1", label: "Current work point / location on route", type: "text" },
      {
        id: "3.2",
        label: "Distance of work point from the proposed ropeway station",
        type: "single",
        options: ["<500 m", "0.5–1 km", "1–3 km", ">3 km", "Don't know"],
        noDKR: true,
      },
    ],
  },

  /* ---------------------------------------------------------------- Module 4 */
  {
    id: "M4",
    title: "Income",
    subtitle: "Module 4 — source-based",
    showIf: (a) => a["0.6"] !== "No",
    questions: [
      {
        id: "4.1",
        label: "Income sources the household has (tick all that apply)",
        type: "multi",
        options: INCOME_SOURCES,
        required: true,
      },
      { id: "4.2", label: "Annual income — Agriculture / horticulture", type: "num", unit: "₹/year", showIf: (a) => hasSource(a, "Agriculture") },
      { id: "4.3", label: "Annual income — Non-farm business / shop", type: "num", unit: "₹/year", showIf: (a) => hasSource(a, "Shop-business") },
      { id: "4.4", label: "Annual income — Yatra-related work (core model variable)", type: "num", unit: "₹/year", required: true },
      {
        id: "4.5",
        label: "Annual income — Govt scheme / pension / subsidy",
        type: "num",
        unit: "₹/year",
        showIf: (a) => hasSource(a, "Govt pension-scheme"),
      },
      { id: "4.6", label: "Annual income — Remittance", type: "num", unit: "₹/year", showIf: (a) => hasSource(a, "Remittance") },
      { id: "4.7", label: "Single most important source of household income", type: "single", options: INCOME_SOURCES },
      { id: "4.8", label: "Has household income changed over the last three years?", type: "single", options: ["Increased", "Decreased", "Same"], noDKR: true },
      {
        id: "4.9",
        label: "Main reason for the change",
        type: "single",
        options: ["More pilgrims", "Fewer pilgrims", "Price / charge changes", "Health or family reasons", "Disaster / climate event", "Other"],
        showIf: (a) => a["4.8"] && a["4.8"] !== "Same",
      },
      { id: "4.10", label: "Holds a BPL / poverty card?", type: "single", options: ["Yes", "No", "Applied, not received", "Not aware"], noDKR: true },
      { id: "4.11", label: "Food shortage faced in the last 12 months?", type: "single", options: ["Never", "1–2 months", "3–5 months", ">5 months"], noDKR: true },
    ],
  },

  /* ---------------------------------------------------------------- Module 5 */
  {
    id: "M5",
    title: "Work Economics",
    subtitle: "Module 5 — Objective-4 engine (path-specific)",
    showIf: (a) => a["0.6"] !== "No",
    questions: [
      // -------- Path A
      { id: "5A.head", type: "note", label: "Path A — Mobile providers (pony/mule, palki/dandi, porter)", showIf: (a) => pathOf(a) === "A" },
      { id: "5A.1", label: "Trips (up/down) on a typical peak-season day", type: "num", showIf: (a) => pathOf(a) === "A" },
      { id: "5A.2", label: "Pilgrims you personally serve / carry on a typical peak day", type: "num", showIf: (a) => pathOf(a) === "A" },
      { id: "5A.3", label: "Days worked in a full Yatra season", type: "num", unit: "days", showIf: (a) => pathOf(a) === "A" },
      { id: "5A.4", label: "Current charge per trip / pilgrim", type: "num", unit: "₹", showIf: (a) => pathOf(a) === "A" },
      { id: "5A.5", label: "Your net earning per trip, after costs", type: "num", unit: "₹", showIf: (a) => pathOf(a) === "A" },
      {
        id: "5A.6",
        label: "Main operating costs",
        type: "numgrid",
        fields: [
          { key: "feed", label: "Feed / fodder per day (₹)" },
          { key: "vet", label: "Vet / medicine per month (₹)" },
          { key: "helper", label: "Handler / helper wage (₹)" },
          { key: "commission", label: "Agent / counter commission (₹)" },
          { key: "other", label: "Other (₹)" },
        ],
        showIf: (a) => pathOf(a) === "A",
      },
      {
        id: "5A.7",
        label: "If pilgrim numbers fall, which costs do you still have to pay?",
        type: "multi",
        options: ["Loan EMI", "Animal feed & upkeep", "Rent", "Staff wages", "None"],
        showIf: (a) => pathOf(a) === "A",
      },
      { id: "5A.8", label: "Below what monthly income would you stop this work entirely and look elsewhere? (reservation / exit income)", type: "num", unit: "₹/month", showIf: (a) => pathOf(a) === "A" },

      // -------- Path B
      { id: "5B.head", type: "note", label: "Path B — Fixed establishments (shop/stall, dhaba, hotel)", showIf: (a) => pathOf(a) === "B" },
      { id: "5B.1", label: "Customers / pilgrims served on a typical peak day", type: "num", showIf: (a) => pathOf(a) === "B" },
      { id: "5B.2", label: "Average spend per customer", type: "num", unit: "₹", showIf: (a) => pathOf(a) === "B" },
      { id: "5B.3", label: "Share of sales that depends on Yatra footfall", type: "num", unit: "%", showIf: (a) => pathOf(a) === "B" },
      { id: "5B.4", label: "Monthly fixed costs that continue even if footfall drops (rent, staff, stock loans)", type: "num", unit: "₹/month", showIf: (a) => pathOf(a) === "B" },
      { id: "5B.5", label: "Days open in a full Yatra season", type: "num", unit: "days", showIf: (a) => pathOf(a) === "B" },
      { id: "5B.6", label: "Below what monthly income would you close or exit this business?", type: "num", unit: "₹/month", showIf: (a) => pathOf(a) === "B" },

      // -------- Path C
      { id: "5C.head", type: "note", label: "Path C — Other service (guide, priest, driver, other)", showIf: (a) => pathOf(a) === "C" },
      { id: "5C.1", label: "Typical earning per day (or per client) in peak season", type: "num", unit: "₹", showIf: (a) => pathOf(a) === "C" },
      { id: "5C.2", label: "Clients / trips on a typical peak day", type: "num", showIf: (a) => pathOf(a) === "C" },
      { id: "5C.3", label: "Days worked in a full Yatra season", type: "num", unit: "days", showIf: (a) => pathOf(a) === "C" },
      {
        id: "5C.4",
        label: "Costs that continue if Yatra work drops",
        type: "multi",
        options: ["Vehicle EMI / fuel", "Rent", "None", "Other"],
        showIf: (a) => pathOf(a) === "C",
      },
      { id: "5C.5", label: "Below what monthly income would you stop this work?", type: "num", unit: "₹/month", showIf: (a) => pathOf(a) === "C" },
    ],
  },

  /* ---------------------------------------------------------------- Module 6 */
  {
    id: "M6",
    title: "Productive Assets",
    subtitle: "Module 6 — gated",
    showIf: (a) => a["0.6"] !== "No",
    questions: [
      {
        id: "6.1",
        label: "Do you own a productive asset used in your work (animal, palki/dandi, vehicle, shop/stall structure, major equipment)?",
        type: "single",
        options: ["Yes", "No"],
        noDKR: true,
        required: true,
      },
      {
        id: "6.2",
        label: "Asset type (tick all)",
        type: "multi",
        options: ["Pony / mule", "Palki / dandi", "Vehicle", "Shop-stall structure", "Equipment", "Other"],
        showIf: (a) => a["6.1"] === "Yes",
      },
      { id: "6.3", label: "Number of animals (auto-piped from 2.6 where applicable)", type: "num", showIf: (a) => a["6.1"] === "Yes" },
      { id: "6.4", label: "Current resale / market value of main asset", type: "num", unit: "₹", showIf: (a) => a["6.1"] === "Yes" },
      { id: "6.5", label: "Age of main working animal / asset", type: "num", unit: "years", showIf: (a) => a["6.1"] === "Yes" },
      { id: "6.6", label: "Replacement cost if bought today", type: "num", unit: "₹", showIf: (a) => a["6.1"] === "Yes" },
      { id: "6.7", label: "Was it bought on loan?", type: "single", options: ["Yes", "No"], noDKR: true, showIf: (a) => a["6.1"] === "Yes" },
      {
        id: "6.8",
        label: "If rides / footfall drop, can you sell or repurpose it?",
        type: "single",
        options: ["Sell easily", "Sell at a loss", "Cannot sell"],
        showIf: (a) => a["6.1"] === "Yes",
      },
    ],
  },

  /* ---------------------------------------------------------------- Module 7 */
  {
    id: "M7",
    title: "Debt & Savings",
    subtitle: "Module 7 — gated",
    showIf: (a) => a["0.6"] !== "No",
    questions: [
      { id: "7.1", label: "Any current loan or debt?", type: "single", options: ["Yes", "No"], noDKR: true, required: true },
      { id: "7.2", label: "Total outstanding debt", type: "num", unit: "₹", showIf: (a) => a["7.1"] === "Yes" },
      {
        id: "7.3",
        label: "Source of largest loan",
        type: "single",
        options: ["Bank", "Cooperative", "SHG / microfinance", "Moneylender", "Friends / relatives", "Other"],
        showIf: (a) => a["7.1"] === "Yes",
      },
      {
        id: "7.4",
        label: "Purpose of largest loan",
        type: "single",
        options: ["Business / asset", "Household consumption", "Medical", "Education", "House construction", "Other"],
        showIf: (a) => a["7.1"] === "Yes",
      },
      { id: "7.5", label: "Monthly repayment amount", type: "num", unit: "₹/month", showIf: (a) => a["7.1"] === "Yes" },
      { id: "7.6", label: "Difficulty repaying", type: "single", options: ["Never", "Sometimes", "Often", "Always"], noDKR: true, showIf: (a) => a["7.1"] === "Yes" },
      {
        id: "7.7",
        label: "If the ropeway reduces income, will repayment become difficult?",
        type: "single",
        options: ["Yes", "No", "Not sure"],
        noDKR: true,
        showIf: (a) => a["7.1"] === "Yes",
      },
      { id: "7.8", label: "Member of an SHG / microcredit / cooperative loan group?", type: "single", options: ["Yes", "No"], noDKR: true },
      { id: "7.9", label: "Any savings?", type: "single", options: ["Yes", "No"], noDKR: true },
      {
        id: "7.10",
        label: "If Yatra income stops, how long can the household survive on savings?",
        type: "single",
        options: ["<1 month", "1–3 months", "3–6 months", ">6 months"],
        showIf: (a) => a["7.9"] === "Yes",
      },
    ],
  },

  /* ---------------------------------------------------------------- Module 8 */
  {
    id: "M8",
    title: "Shocks & Climate",
    subtitle: "Module 8 — gated",
    showIf: (a) => a["0.6"] !== "No",
    questions: [
      { id: "8.1", label: "Has income been affected by climate / disaster events in the last five years?", type: "single", options: ["Yes", "No"], noDKR: true, required: true },
      {
        id: "8.2",
        label: "Which events? (tick all)",
        type: "multi",
        options: ["Cloudburst", "Landslide", "Flood", "Heavy rain", "Road blockage", "Snowfall", "Pandemic", "Other"],
        showIf: (a) => a["8.1"] === "Yes",
      },
      {
        id: "8.3",
        label: "Approximate income loss from the most serious shock",
        type: "single",
        options: ["<25%", "25–50%", "51–75%", ">75%"],
        showIf: (a) => a["8.1"] === "Yes",
      },
      {
        id: "8.4",
        label: "How did you cope with the last major shock? (tick all)",
        type: "multi",
        options: ["Borrowed money", "Sold assets", "Used savings", "Reduced consumption", "Migrated for work", "Government help", "Other"],
        showIf: (a) => a["8.1"] === "Yes",
      },
    ],
  },

  /* ---------------------------------------------------------------- Module 9 */
  {
    id: "M9",
    title: "Ropeway Awareness",
    subtitle: "Module 9 — gated",
    showIf: (a) => a["0.6"] !== "No",
    questions: [
      { id: "9.1", label: "Aware of the proposed ropeway project?", type: "single", options: ["Yes", "No"], noDKR: true, required: true },
      {
        id: "9.2",
        label: "How did you hear about it?",
        type: "single",
        options: ["Officials", "News / media", "Community", "Social media", "Other"],
        showIf: (a) => a["9.1"] === "Yes",
      },
      {
        id: "9.3",
        label: "How much do you know?",
        type: "single",
        options: ["Heard only", "Basic idea", "Know route", "Know route & timeline", "Participated in discussion"],
        showIf: (a) => a["9.1"] === "Yes",
      },
      { id: "9.4", label: "Has any official consulted you?", type: "single", options: ["Yes", "No", "Not sure"], noDKR: true, showIf: (a) => a["9.1"] === "Yes" },
      {
        id: "9.1note",
        type: "note",
        label:
          "Enumerator: read this one-line neutral description — \"A ropeway (cable-car) is being proposed along this route to carry pilgrims; it is at the planning stage.\" — then continue.",
        showIf: (a) => a["9.1"] === "No",
      },
      {
        id: "9.5",
        label: "Do you support or oppose the project?",
        type: "single",
        options: ["Strongly support", "Support", "Neutral", "Oppose", "Strongly oppose"],
        noDKR: true,
        required: true,
      },
      { id: "9.6", label: "Main reason for support / opposition", type: "text" },
    ],
  },

  /* --------------------------------------------------------------- Module 10 */
  {
    id: "M10",
    title: "Expected Livelihood Impact",
    subtitle: "Module 10",
    showIf: (a) => a["0.6"] !== "No",
    questions: [
      { id: "10.2", label: "Expected effect on household income", type: "single", options: ["Increase", "Decrease", "No change", "Not sure"], noDKR: true, required: true },
      {
        id: "10.3",
        label: "Expected income reduction",
        type: "single",
        options: ["<25%", "25–50%", "51–75%", ">75%"],
        showIf: (a) => a["10.2"] === "Decrease",
      },
      { id: "10.4", label: "Will pilgrims shift from walking / pony / palki to the ropeway?", type: "single", options: ["Many", "Some", "Very few", "None", "Not sure"], noDKR: true },
      { id: "10.5", label: "Does trekking have religious / emotional value for pilgrims?", type: "single", options: ["Yes, strongly", "Somewhat", "No", "Not sure"], noDKR: true },
      { id: "10.6", label: "Will the ropeway increase the total number of Yatris?", type: "single", options: ["Yes", "No", "Not sure"], noDKR: true },
      {
        id: "10.7",
        label: "New opportunities you expect (tick all)",
        type: "multi",
        options: ["Ropeway jobs", "Hospitality / tourism", "Shop near station", "Transport", "Guiding", "Other", "None"],
      },
      { id: "10.8", label: "Biggest fear about the project", type: "text" },
    ],
  },

  /* --------------------------------------------------------------- Module 11 */
  {
    id: "M11",
    title: "Skills & Transition",
    subtitle: "Module 11",
    showIf: (a) => a["0.6"] !== "No",
    questions: [
      { id: "11.1", label: "Have you worked in any occupation other than your current Yatra work?", type: "single", options: ["Yes", "No"], noDKR: true, required: true },
      { id: "11.2", label: "Which occupation(s)?", type: "text", showIf: (a) => a["11.1"] === "Yes" },
      {
        id: "11.3",
        label: "Current skills (tick all)",
        type: "multi",
        options: ["Animal handling", "Hospitality", "Driving", "Cooking", "Guiding", "Trading", "Construction", "None", "Other"],
      },
      {
        id: "11.4-11.5",
        label: "Digital readiness",
        type: "sgrid",
        rows: [
          { id: "11.4", label: "Smartphone use", options: ["Comfortably", "Basic", "No"] },
          { id: "11.5", label: "Digital-payment use", options: ["Yes", "No", "Someone in household can"] },
        ],
      },
      {
        id: "11.6",
        label: "Willing to learn new skills for ropeway / tourism jobs?",
        type: "single",
        options: ["Yes", "No", "Depends on training & income", "Not sure"],
        noDKR: true,
        required: true,
      },
      {
        id: "11.7",
        label: "Preferred training area",
        type: "single",
        options: ["Hospitality", "Driving", "Computer / digital", "Trade / retail", "Technical / maintenance", "Other"],
        showIf: (a) => a["11.6"] === "Yes" || a["11.6"] === "Depends on training & income",
      },
      {
        id: "11.8",
        label: "If income reduces after the ropeway, what will you do?",
        type: "single",
        options: ["Stay & continue", "Find other local work", "Migrate for work", "Depend on family / farm", "Don't know"],
        noDKR: true,
      },
      { id: "11.9", label: "Preferred destination for migration", type: "text", showIf: (a) => a["11.8"] === "Migrate for work" },
      {
        id: "11.10-11.11",
        label: "Household job mobility",
        type: "sgrid",
        rows: [
          { id: "11.10", label: "Younger household members willing to shift jobs?", options: ["Yes", "No", "Not sure"] },
          { id: "11.11", label: "Older workers able to shift to new jobs?", options: ["Yes", "No", "Not sure"] },
        ],
      },
      {
        id: "11.12",
        label: "Main barrier to shifting occupation",
        type: "single",
        options: ["Age", "Lack of skills", "Lack of capital", "Health", "Family responsibilities", "No opportunities", "Other"],
      },
    ],
  },

  /* --------------------------------------------------------------- Module 12 */
  {
    id: "M12",
    title: "Land & Natural Capital",
    subtitle: "Module 12 — gated (Tier 2)",
    showIf: (a) => a["0.6"] !== "No",
    questions: [
      { id: "12.1", label: "Does the household own agricultural / horticultural land?", type: "single", options: ["Yes", "No"], noDKR: true, required: true },
      { id: "12.2", label: "Approximate area", type: "num", unit: "nali / bigha / acre", showIf: (a) => a["12.1"] === "Yes" },
      { id: "12.3", label: "Months per year own produce feeds the household", type: "num", unit: "months", showIf: (a) => a["12.1"] === "Yes" },
      { id: "12.5", label: "If Yatra income stopped, could you fall back on farming / livestock as a main income?", type: "single", options: ["Fully", "Partly", "No"], noDKR: true, required: true },
    ],
  },

  /* --------------------------------------------------------------- Module 13 */
  {
    id: "M13",
    title: "Wider Economy & Rehabilitation Views",
    subtitle: "Module 13",
    showIf: (a) => a["0.6"] !== "No",
    questions: [
      { id: "13.1", label: "If income falls, which spending would you cut first?", type: "single", options: ["Food", "Education", "Health", "Festivals / social", "Savings", "Other"] },
      { id: "13.3", label: "Who will gain most from the ropeway?", type: "single", options: ["Local workers", "Outside companies", "Pilgrims", "Government", "Large businesses", "Not sure"], noDKR: true },
      {
        id: "13.4",
        label: "What support should the government / project authority provide? (tick all)",
        type: "multi",
        options: ["Cash compensation", "Priority jobs", "Skill training", "Loans / credit", "Alternative livelihood", "Reserved vending zones", "Other"],
      },
      {
        id: "13.7",
        label: "Who should sit on an oversight / grievance committee? (tick all)",
        type: "multi",
        options: ["Local workers' reps", "Gram panchayat", "Govt officials", "Project authority", "NGOs", "Religious bodies", "Other"],
      },
      { id: "13.8", label: "Single most important action for fair implementation", type: "text" },
    ],
  },

  /* --------------------------------------------------------------- Module 14 */
  {
    id: "M14",
    title: "Attitude Statements",
    subtitle: "Module 14 — 1 = Strongly Disagree … 5 = Strongly Agree",
    showIf: (a) => a["0.6"] !== "No",
    questions: [
      { id: "N1", label: "Ropeway will improve accessibility for pilgrims.", type: "scale" },
      { id: "N2", label: "Ropeway will help elderly, disabled and physically weak pilgrims.", type: "scale" },
      { id: "N6", label: "Ropeway may increase inequality between powerful and weaker local groups.", type: "scale" },
      { id: "N7", label: "Rehabilitation support is necessary before ropeway operations begin.", type: "scale" },
      { id: "N8", label: "Ropeway ticket pricing should consider local livelihood protection.", type: "scale" },
    ],
  },

  /* --------------------------------------------------------------- Module 15 */
  {
    id: "M15",
    title: "Enumerator Observation",
    subtitle: "Module 15 — no respondent burden",
    showIf: (a) => a["0.6"] !== "No",
    questions: [
      { id: "O1", label: "Occupation verified by observation", type: "single", options: ["Yes", "No", "Partly"], noDKR: true },
      { id: "O2", label: "Visible livelihood asset", type: "single", options: ["Animal", "Palki / dandi", "Vehicle", "Shop / stall", "None", "Other"] },
      { id: "O3", label: "Observed economic condition", type: "single", options: ["Poor", "Below average", "Average", "Above average", "Well-off"] },
      { id: "O4", label: "Respondent attitude", type: "single", options: ["Cooperative", "Neutral", "Hesitant", "Hostile"] },
      { id: "O5", label: "Main distress observed", type: "single", options: ["None", "Economic", "Health", "Anxiety about ropeway", "Other"] },
      { id: "O6", label: "Exposure classification", type: "single", options: ["High", "Medium", "Low"] },
      { id: "O7", label: "Remarks", type: "text" },
    ],
  },
];

// Expose for both browser <script> use and any module context
if (typeof window !== "undefined") {
  window.SURVEY = SURVEY;
  window.DKR = DKR;
  window.pathOf = pathOf;
  window.PATH_MAP = PATH_MAP;
}
