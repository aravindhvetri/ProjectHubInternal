// MetricsTypes.ts

export type StatusOption =
  | "Not Started"
  | "In Progress"
  | "Partially Compliant"
  | "Fully Compliant"
  | "Not Applicable";

export const STATUS_SCORE: Record<StatusOption, number | null> = {
  "Not Started": 0,
  "In Progress": 1,
  "Partially Compliant": 2,
  "Fully Compliant": 3,
  "Not Applicable": null, // Exclude from calculation
};

export const STATUS_OPTIONS: StatusOption[] = [
  "Not Started",
  "In Progress",
  "Partially Compliant",
  "Fully Compliant",
  "Not Applicable",
];

export interface IChecklistItem {
  label: string;
  status: StatusOption;
}

export interface ISmallProjectSections {
  initiation: IChecklistItem[];
  execution: IChecklistItem[];
  financial: IChecklistItem[];
  closure: IChecklistItem[];
}

export interface IMediumProjectSections {
  initiation: IChecklistItem[];
  governance: IChecklistItem[];
  financial: IChecklistItem[];
  quality: IChecklistItem[];
  reporting: IChecklistItem[];
  closure: IChecklistItem[];
}

export interface ILargeProjectSections {
  preInitiation: IChecklistItem[];
  initiation: IChecklistItem[];
  executionGovernance: IChecklistItem[];
  financial: IChecklistItem[];
  quality: IChecklistItem[];
  delivery: IChecklistItem[];
  // reporting: IChecklistItem[];
  closure: IChecklistItem[];
}

// Section weights per project size
export const SMALL_WEIGHTS: Record<string, number> = {
  initiation: 0.15,
  execution: 0.2,
  financial: 0.25,
  closure: 0.1,
  // quality & reporting not applicable for small — redistribute
};

// For weighted score calc (using the doc's recommended weights mapped to actual SP columns)
export const SECTION_WEIGHTS_SMALL: { key: keyof ISmallProjectSections; label: string; weight: number }[] = [
  { key: "initiation", label: "Initiation & Planning", weight: 0.15 },
  { key: "execution", label: "Execution Control", weight: 0.35 }, // governance+quality+reporting merged
  { key: "financial", label: "Financial Control", weight: 0.4 }, // higher for small
  { key: "closure", label: "Closure", weight: 0.1 },
];

export const SECTION_WEIGHTS_MEDIUM: { key: keyof IMediumProjectSections; label: string; weight: number }[] = [
  { key: "initiation", label: "Initiation", weight: 0.15 },
  { key: "governance", label: "Governance", weight: 0.2 },
  { key: "financial", label: "Financial Governance", weight: 0.25 },
  { key: "quality", label: "Quality & Delivery", weight: 0.2 },
  { key: "reporting", label: "Reporting", weight: 0.1 },
  { key: "closure", label: "Closure", weight: 0.1 },
];

export const SECTION_WEIGHTS_LARGE: { key: keyof ILargeProjectSections; label: string; weight: number }[] = [
  { key: "preInitiation", label: "Pre-Initiation", weight: 0.05 },
  { key: "initiation", label: "Initiation & Planning", weight: 0.15 },
  { key: "executionGovernance", label: "Execution Governance", weight: 0.2 },
  { key: "financial", label: "Financial & Margin Control", weight: 0.25 },
  { key: "quality", label: "Quality & Audit", weight: 0.15 },
  { key: "delivery", label: "Delivery Health", weight: 0.1 },
  // { key: "reporting", label: "Reporting", weight: 0.05 },
  { key: "closure", label: "Closure", weight: 0.05 },
];

// Default section data
export const DEFAULT_SMALL_SECTIONS: ISmallProjectSections = {
  initiation: [
    { label: "SOW / Contract available", status: "Not Started" },
    { label: "Scope clearly documented", status: "Not Started" },
    { label: "Effort estimation documented", status: "Not Started" },
    { label: "Resource allocation confirmed", status: "Not Started" },
    { label: "Basic project plan created", status: "Not Started" },
    { label: "Risk list created (minimum 3 risks)", status: "Not Started" },
  ],
  execution: [
    { label: "Weekly status update shared", status: "Not Started" },
    { label: "Timesheet compliance > 95%", status: "Not Started" },
    { label: "Change requests tracked (if any)", status: "Not Started" },
    { label: "Customer communication recorded", status: "Not Started" },
  ],
  financial: [
    { label: "Deal Sheet approved", status: "Not Started" },
    { label: "FPM updated (Monthly)", status: "Not Started" },
    { label: "Invoice milestone mapping validated", status: "Not Started" },
    { label: "Revenue vs Planned variance reviewed", status: "Not Started" },
  ],
  closure: [
    { label: "UAT signoff", status: "Not Started" },
    { label: "Final invoice raised", status: "Not Started" },
    { label: "Lessons learned captured", status: "Not Started" },
  ],
};

export const DEFAULT_MEDIUM_SECTIONS: IMediumProjectSections = {
  initiation: [
    { label: "Approved SOW", status: "Not Started" },
    { label: "Detailed Scope Baseline", status: "Not Started" },
    { label: "WBS created", status: "Not Started" },
    { label: "Project Plan baseline approved", status: "Not Started" },
    { label: "RAID Log created", status: "Not Started" },
    { label: "Communication plan documented", status: "Not Started" },
    { label: "Stakeholder list identified", status: "Not Started" },
  ],
  governance: [
    { label: "Weekly internal review meeting", status: "Not Started" },
    { label: "Weekly/biweekly customer review", status: "Not Started" },
    { label: "Risk register updated weekly", status: "Not Started" },
    { label: "Dependency tracker maintained", status: "Not Started" },
    { label: "Resource utilization reviewed monthly", status: "Not Started" },
  ],
  financial: [
    { label: "Deal Sheet version control maintained", status: "Not Started" },
    { label: "FPM reviewed monthly", status: "Not Started" },
    { label: "Gross Margin variance analysis done", status: "Not Started" },
    { label: "Forecast revenue updated", status: "Not Started" },
    { label: "Unbilled revenue reviewed", status: "Not Started" },
    { label: "Invoice plan aligned with milestones", status: "Not Started" },
  ],
  quality: [
    { label: "Test plan documented", status: "Not Started" },
    { label: "Code review checklist followed", status: "Not Started" },
    { label: "UAT plan defined", status: "Not Started" },
    { label: "Defect leakage monitored", status: "Not Started" },
    { label: "Change request impact analysis documented", status: "Not Started" },
  ],
  reporting: [
    { label: "Monthly dashboard submitted", status: "Not Started" },
    { label: "Variance report (Schedule/Cost)", status: "Not Started" },
    { label: "Top 5 risks highlighted", status: "Not Started" },
  ],
  closure: [
    { label: "Formal signoff", status: "Not Started" },
    { label: "Financial closure reconciliation", status: "Not Started" },
    { label: "Knowledge transfer completed", status: "Not Started" },
    { label: "Retrospective completed", status: "Not Started" },
  ],
};

export const DEFAULT_LARGE_SECTIONS: ILargeProjectSections = {
  preInitiation: [
    { label: "Commercial feasibility reviewed", status: "Not Started" },
    { label: "Margin sensitivity analysis done", status: "Not Started" },
    { label: "Risk-based pricing validated", status: "Not Started" },
  ],
  initiation: [
    { label: "Detailed Project Charter", status: "Not Started" },
    { label: "Approved Scope Baseline", status: "Not Started" },
    { label: "Detailed WBS (Level 3 or 4)", status: "Not Started" },
    { label: "Baseline schedule locked", status: "Not Started" },
    { label: "Resource ramp-up & ramp-down plan", status: "Not Started" },
    { label: "Governance model defined", status: "Not Started" },
    { label: "Steering committee structure defined", status: "Not Started" },
    { label: "RACI matrix prepared", status: "Not Started" },
    { label: "Communication matrix defined", status: "Not Started" },
    { label: "Quality management plan", status: "Not Started" },
    { label: "Risk mitigation plan documented", status: "Not Started" },
    { label: "Dependency mapping across streams", status: "Not Started" },
  ],
  executionGovernance: [
    { label: "Weekly internal review", status: "Not Started" },
    { label: "Weekly customer review", status: "Not Started" },
    { label: "Monthly steering review", status: "Not Started" },
    { label: "RAID log updated weekly", status: "Not Started" },
    { label: "Risk exposure trend monitored", status: "Not Started" },
    { label: "Earned Value tracking (if applicable)", status: "Not Started" },
    { label: "Change Control Board functioning", status: "Not Started" },
    { label: "Scope creep tracking", status: "Not Started" },
  ],
  financial: [
    { label: "Deal Sheet locked (version controlled)", status: "Not Started" },
    { label: "FPM updated monthly", status: "Not Started" },
    { label: "GM variance >5% escalated", status: "Not Started" },
    { label: "Revenue forecast vs actual reviewed", status: "Not Started" },
    { label: "Cost overrun analysis", status: "Not Started" },
    { label: "Billing realization % tracked", status: "Not Started" },
    { label: "Resource cost vs billing rate variance tracked", status: "Not Started" },
    { label: "Unbilled & overdue invoice monitored", status: "Not Started" },
  ],
  quality: [
    { label: "Internal Quality Audit completed", status: "Not Started" },
    { label: "Compliance with org standards verified", status: "Not Started" },
    { label: "Test coverage metrics tracked", status: "Not Started" },
    { label: "Defect density monitored", status: "Not Started" },
    { label: "Rework % monitored", status: "Not Started" },
  ],
  delivery: [
    { label: "Schedule variance (SV)", status: "Not Started" },
    { label: "Cost variance (CV)", status: "Not Started" },
    { label: "Customer satisfaction score", status: "Not Started" },
    { label: "Attrition risk identified", status: "Not Started" },
    { label: "Key dependency risk monitored", status: "Not Started" },
  ],
  // reporting: [
  //   { label: "Monthly executive dashboard", status: "Not Started" },
  //   { label: "Steering deck prepared monthly", status: "Not Started" },
  //   { label: "Red/Amber/Green status reported", status: "Not Started" },
  // ],
  closure: [
    { label: " Final financial reconciliation", status: "Not Started" },
    { label: " Margin realization validated", status: "Not Started" },
    { label: " Contract closure confirmation", status: "Not Started" },
    { label: " Lessons learned repository updated", status: "Not Started" },
    { label: " Reusable assets archived", status: "Not Started" },
  ],
};

// Score calculation utility
export const calculateSectionScore = (
  items: IChecklistItem[]
): { actual: number; max: number; percent: number; isAllNA: boolean } => {
  let actual = 0;
  let max = 0;
  items.forEach((item) => {
    const score = STATUS_SCORE[item.status];
    if (score !== null) {
      actual += score;
      max += 3;
    }
  });
  // A section is all-NA when every item has a null score (i.e. max stays 0)
  const isAllNA = items.length > 0 && max === 0;
  const percent = max === 0 ? 0 : Math.round((actual / max) * 100);
  return { actual, max, percent, isAllNA };
};

export const calculateWeightedScore = (
  sections: Record<string, IChecklistItem[]>,
  weights: { key: string; weight: number }[]
): number => {
  // Determine which sections are all-NA and should be excluded
  const included = weights.filter(({ key }) => {
    const items = sections[key] || [];
    const { isAllNA } = calculateSectionScore(items);
    return !isAllNA;
  });

  if (included.length === 0) return 0;

  // Sum of included weights — used to normalise so percentages still add to 100
  const totalWeight = included.reduce((sum, { weight }) => sum + weight, 0);

  let total = 0;
  included.forEach(({ key, weight }) => {
    const items = sections[key] || [];
    const { percent } = calculateSectionScore(items);
    // Redistribute: effective weight = (original weight / total included weight)
    total += percent * (weight / totalWeight);
  });
  return Math.round(total);
};

export const getComplianceStatus = (score: number): { label: string; color: string } => {
  if (score >= 85) return { label: "🟢 Healthy", color: "#28a745" };
  if (score >= 70) return { label: "🟡 Watch", color: "#ffc107" };
  return { label: "🔴 Risk", color: "#dc3545" };
};

export const getMaturityLevel = (score: number): string => {
  if (score < 60) return "Level 1 – Ad hoc";
  if (score < 75) return "Level 2 – Managed";
  if (score <= 90) return "Level 3 – Defined";
  return "Level 4 – Optimized";
};
