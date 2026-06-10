import {
  DatePicker,
  IDatePickerStyles,
  ITextFieldStyles,
  PersonaSize,
  TextField,
} from "@fluentui/react";
import {
  DirectionalHint,
  Label,
  Persona,
  PersonaPresence,
  TooltipDelay,
  TooltipHost,
} from "office-ui-fabric-react";
import { PeoplePicker } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { InputText } from "primereact/inputtext";
import "../CSS/Style.css";
import { useState } from "react";
import type {
  AllocationMonth,
  AllocationRow,
  DashboardStats,
  DateRangeConflict,
  EmployeeAllocationRecord,
  EmployeeAvailabilitySummary,
  EmployeeAvailabilityWindow,
  IEmployeeAllocationDashboardScss,
  IEmployeeAvailabilitySummaryScss,
  IEmployeeAllocationNewFormPanelProps,
  IEmployeeAllocationNewFormScss,
  IPeoplePickerDetails,
} from "./interface";
import * as React from "react";
import { Config, DatePickerStyles, peoplePickerStyles } from "./Config";
import SPServices from "./SPServices";
import styles from "../../webparts/reports/components/MainComponenet.module.scss";

export type {
  AllocationMonth,
  AllocationRow,
  DashboardStats,
  DateRangeConflict,
  EmployeeAllocationRecord,
  EmployeeAvailabilitySummary,
  EmployeeAvailabilityWindow,
  IEmployeeAllocationDashboardScss,
  IEmployeeAvailabilitySummaryScss,
  IEmployeeAllocationNewFormPanelProps,
  IEmployeeAllocationNewFormScss,
} from "./interface";
interface FixedMonthDisplayProps {
  label: string;
  value: string;
}
interface MonthPickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  enabledKeys: string[]; // only these column keys are selectable
  minKey?: string; // lower bound (inclusive)
  maxKey?: string; // upper bound (inclusive)
}

//MultiPeoplePicker Template:
export const multiPeoplePickerTemplate = (users: IPeoplePickerDetails[]) => {
  if (!users?.length) return null;

  const uniqueUsers = users.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t?.email === item?.email),
  );

  return (
    <div
      className="user-selector-group"
      style={{
        display: "flex",
      }}
    >
      {uniqueUsers.map((value, index) => {
        if (index < 2) {
          return (
            <Persona
              key={index}
              styles={{
                root: {
                  cursor: "pointer",
                  margin: "0 !important",
                  ".ms-Persona-details": {
                    display: "none",
                  },
                },
              }}
              imageUrl={`/_layouts/15/userphoto.aspx?size=S&username=${value.email}`}
              title={value.name}
              size={PersonaSize.size24}
            />
          );
        }
        return null;
      })}

      {uniqueUsers.length > 2 && (
        <TooltipHost
          className="all-member-users"
          content={
            <ul style={{ margin: 10, padding: 0 }}>
              {uniqueUsers.map((DName: any, index) => (
                <li key={index} style={{ listStyleType: "none" }}>
                  <div style={{ display: "flex" }}>
                    <Persona
                      showOverflowTooltip
                      size={PersonaSize.size24}
                      presence={PersonaPresence.none}
                      showInitialsUntilImageLoads
                      imageUrl={`/_layouts/15/userphoto.aspx?size=S&username=${DName.email}`}
                    />
                    <Label style={{ marginLeft: 10, fontSize: 12 }}>
                      {DName.name}
                    </Label>
                  </div>
                </li>
              ))}
            </ul>
          }
          delay={TooltipDelay.zero}
          directionalHint={DirectionalHint.bottomCenter}
          styles={{ root: { display: "inline-block" } }}
        >
          <div className="persona">
            +{uniqueUsers.length - 2}
            <div className="allPersona"></div>
          </div>
        </TooltipHost>
      )}
    </div>
  );
};

//PeoplePicker Template:
export const peoplePickerTemplate = (user: IPeoplePickerDetails) => {
  return (
    <>
      {user && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <Persona
            styles={{
              root: {
                margin: "0 !important;",
                ".ms-Persona-details": {
                  display: "none",
                },
              },
            }}
            imageUrl={
              "/_layouts/15/userphoto.aspx?size=S&username=" + user?.email
            }
            title={user?.name}
            size={PersonaSize.size24}
          />
          <p
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              margin: 0,
            }}
            className="displayText"
            title={user?.name}
          >
            {user?.name}
          </p>
        </div>
      )}
    </>
  );
};

//Text Template in Multiline with tooltip:
export const textTemplate = (text: string) => {
  return (
    <div className="MultilinedisplayText" title={text}>
      {text}
    </div>
  );
};

export const FixedMonthDisplay: React.FC<FixedMonthDisplayProps> = ({
  label,
  value,
}) => {
  return (
    <div className={styles.monthPickerWrap}>
      <span className={styles.monthPickerLabel}>{label}</span>
      <div className={styles.fixedMonthDisplay}>
        <span className={styles.fixedMonthValue}>
          {Config.formatColLabel(value)}
        </span>
        <span className={styles.fixedMonthBadge}>Fixed</span>
      </div>
    </div>
  );
};

export const MonthPicker: React.FC<MonthPickerProps> = ({
  label,
  value,
  onChange,
  enabledKeys,
  minKey,
  maxKey,
}) => {
  const years = Array.from(
    new Set(enabledKeys.map((k) => parseInt(k.slice(3), 10))),
  ).sort((a, b) => a - b);

  const { month: selMonth, year: selYear } = Config.parseColumnKey(
    value || enabledKeys[0] || "JAN2025",
  );
  const [viewYear, setViewYear] = useState<number>(selYear);

  const minDate = minKey ? Config.colKeyToDate(minKey) : null;
  const maxDate = maxKey ? Config.colKeyToDate(maxKey) : null;

  const isEnabled = (monthIdx: number, year: number): boolean => {
    const key = `${Config.MONTH_KEYS[monthIdx]}${year}`;
    if (!enabledKeys.includes(key)) return false;
    const d = new Date(year, monthIdx, 1);
    if (minDate && d < minDate) return false;
    if (maxDate && d > maxDate) return false;
    return true;
  };

  const handleSelect = (monthIdx: number) => {
    if (!isEnabled(monthIdx, viewYear)) return;
    onChange(`${Config.MONTH_KEYS[monthIdx]}${viewYear}`);
  };

  return (
    <div className={styles.monthPickerWrap}>
      <span className={styles.monthPickerLabel}>{label}</span>
      <div className={styles.yearNav}>
        <button
          className={styles.yearNavBtn}
          disabled={viewYear <= years[0]}
          onClick={() => setViewYear((y) => y - 1)}
        >
          ‹
        </button>
        <span className={styles.yearText}>{viewYear}</span>
        <button
          className={styles.yearNavBtn}
          disabled={viewYear >= years[years.length - 1]}
          onClick={() => setViewYear((y) => y + 1)}
        >
          ›
        </button>
      </div>
      <div className={styles.monthGrid}>
        {Config.MONTH_ABBRS.map((m, idx) => {
          const enabled = isEnabled(idx, viewYear);
          const selected = idx === selMonth && viewYear === selYear;
          return (
            <button
              key={m}
              className={`${styles.monthCell} ${selected ? styles.monthCellSelected : ""} ${!enabled ? styles.monthCellDisabled : ""}`}
              disabled={!enabled}
              onClick={() => handleSelect(idx)}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─────────────────────────────────────────────
//  DATE HELPERS
// ─────────────────────────────────────────────

/** Returns the last day of the month containing `date`. */
export const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

/** Returns the first day of the month containing `date`. */
export const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/** "Apr-2025" → Date (1st of that month) */
export const parseMonthLabel = (label: string): Date => {
  const [mon, yr] = label.split("-");
  const monthIndex = new Date(`${mon} 1, ${yr}`).getMonth();
  return new Date(parseInt(yr), monthIndex, 1);
};

/** Date → "Apr-2025" */
export const toMonthLabel = (date: Date): string => {
  return (
    date.toLocaleString("default", { month: "short" }) +
    "-" +
    date.getFullYear()
  );
};

/**
 * BeginDate logic (mirrors Excel formula):
 *   BeginDate = AllocatedOn
 *
 * EndDate logic:
 *   =IF(ISBLANK(ReleasedOn),
 *       IF(AllocatedOn < DefaultEndDate, DefaultEndDate, AllocatedOn),
 *       ReleasedOn)
 *
 * DEFAULT_END_DATE comes from Field_List!$B$2 = 2027-03-31
 */
const DEFAULT_END_DATE = new Date(2027, 2, 31); // 31 Mar 2027

export const computeBeginDate = (allocatedOn: string | null): Date | null => {
  if (!allocatedOn) return null;
  return new Date(allocatedOn);
};

export const computeEndDate = (
  allocatedOn: string | null,
  releasedOn: string | null,
): Date | null => {
  if (releasedOn) return new Date(releasedOn);
  if (!allocatedOn) return DEFAULT_END_DATE;
  const alloc = new Date(allocatedOn);
  return alloc < DEFAULT_END_DATE ? DEFAULT_END_DATE : alloc;
};

// ─────────────────────────────────────────────
//  MONTH GENERATION
// ─────────────────────────────────────────────

/**
 * Generate month labels between beginDate and endDate (inclusive).
 * Used to build AllocationJson dynamically.
 */
export const generateMonthsBetween = (
  beginDate: Date,
  endDate: Date,
): string[] => {
  const months: string[] = [];
  const cur = startOfMonth(beginDate);
  const last = startOfMonth(endDate);
  while (cur <= last) {
    months.push(toMonthLabel(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
};

/**
 * Build an AllocationJson array with 0 values for all months
 * between beginDate and endDate.
 */
export const buildBlankAllocationJson = (
  beginDate: Date,
  endDate: Date,
): AllocationMonth[] => {
  return generateMonthsBetween(beginDate, endDate).map((m) => ({
    month: m,
    value: 0,
  }));
};

// ─────────────────────────────────────────────
//  ALLOCATION CALCULATION  (Excel formula → TS)
// ─────────────────────────────────────────────

/**
 * Monthly allocation value for a single row.
 *
 * Excel: =$I*MAX(0, MIN($U, EOMONTH(Y$1,0)) - MAX($T, Y$1) + 1) / DAY(EOMONTH(Y$1,0))
 *
 * Where:
 *   I  = Loading %   (0–1)
 *   T  = BeginDate
 *   U  = EndDate
 *   Y1 = First day of the column month
 *
 * Returns a value 0–1 (fraction of full month allocated).
 */
export const calcMonthAllocation = (
  loading: number,
  beginDate: Date,
  endDate: Date,
  monthFirstDay: Date,
): number => {
  const monthLastDay = endOfMonth(monthFirstDay);
  const activeDays =
    Math.max(
      0,
      Math.min(endDate.getTime(), monthLastDay.getTime()) -
        Math.max(beginDate.getTime(), monthFirstDay.getTime()) +
        86_400_000, // +1 day in ms
    ) / 86_400_000;

  const totalDays = monthLastDay.getDate();
  return loading * (activeDays / totalDays);
};

/**
 * Build a fully calculated AllocationJson for a record.
 * Each month value is computed via calcMonthAllocation.
 */
export const buildCalculatedAllocationJson = (
  loading: number,
  beginDate: Date,
  endDate: Date,
): AllocationMonth[] => {
  const months = generateMonthsBetween(beginDate, endDate);
  return months.map((label) => {
    const monthFirst = parseMonthLabel(label);
    return {
      month: label,
      value: parseFloat(
        calcMonthAllocation(loading, beginDate, endDate, monthFirst).toFixed(4),
      ),
    };
  });
};

// ─────────────────────────────────────────────
//  DASHBOARD ANALYTICS
// ─────────────────────────────────────────────

/** Stable key per CRM / lookup project (Active Projects dedupe) */
const getActiveProjectDedupeKey = (r: EmployeeAllocationRecord): string => {
  const fullId = (r.ProjectFullID ?? "").trim();
  if (fullId) return `crm:${fullId}`;

  const lookupId = (r.ProjectID ?? "").trim();
  if (lookupId && /^\d+$/.test(lookupId)) return `lookup:${lookupId}`;
  if (lookupId) return `crm:${lookupId}`;

  return `row:${r.ID}`;
};

const getActiveProjectDisplayLabel = (r: EmployeeAllocationRecord): string =>
  (r.ProjectFullID ?? "").trim();

/**
 * Given all allocation records for an employee (across all projects),
 * compute dashboard statistics for the current month.
 */
export const computeDashboardStats = (
  records: EmployeeAllocationRecord[],
): DashboardStats => {
  const now = new Date();
  const currentLabel = toMonthLabel(startOfMonth(now));

  // Aggregate by month across all records
  const monthTotalsMap: Record<string, number> = {};
  records.forEach((rec) => {
    rec.AllocationJson.forEach((m) => {
      monthTotalsMap[m.month] = (monthTotalsMap[m.month] || 0) + m.value;
    });
  });

  const currentAllocation = monthTotalsMap[currentLabel] ?? 0;
  const freePercent = Math.max(0, 1 - currentAllocation);
  const benchPercent = freePercent; // bench = unallocated

  // Active projects: every project this employee is assigned to (one row per project)
  const activeProjectsByKey = new Map<string, string>();

  records.forEach((r) => {
    const projectKey = getActiveProjectDedupeKey(r);
    if (activeProjectsByKey.has(projectKey)) return;
    const label = getActiveProjectDisplayLabel(r);
    if (!label) return;
    activeProjectsByKey.set(projectKey, label);
  });

  const activeProjects = Array.from(activeProjectsByKey.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );

  // History: sorted month totals
  const allMonthLabels = Object.keys(monthTotalsMap).sort((a, b) => {
    return parseMonthLabel(a).getTime() - parseMonthLabel(b).getTime();
  });

  const allocationHistory = allMonthLabels.map((m) => ({
    month: m,
    total: parseFloat((monthTotalsMap[m] * 100).toFixed(1)),
  }));

  // Monthly distribution for current record set (all projects, current month view)
  const monthlyDistribution = allMonthLabels.map((m) => ({
    month: m,
    value: parseFloat(((monthTotalsMap[m] || 0) * 100).toFixed(1)),
  }));

  return {
    currentAllocation,
    freePercent,
    benchPercent,
    activeProjects,
    allocationHistory,
    monthlyDistribution,
  };
};

const getRecordAllocationRange = (
  rec: EmployeeAllocationRecord,
): { begin: Date; end: Date } | null => {
  const begin =
    rec.BeginDate != null
      ? new Date(rec.BeginDate)
      : computeBeginDate(rec.AllocatedOn);
  const end =
    rec.EndDate != null
      ? new Date(rec.EndDate)
      : computeEndDate(rec.AllocatedOn, rec.ReleasedOn);
  if (!begin || !end) return null;
  return { begin, end };
};

/** Sum active project load for a calendar day (0–1+ across all projects). */
export const calcTotalAllocationOnDate = (
  records: EmployeeAllocationRecord[],
  date: Date,
): number => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const monthFirst = startOfMonth(day);
  let total = 0;

  records.forEach((rec) => {
    const range = getRecordAllocationRange(rec);
    if (!range) return;

    const begin = new Date(range.begin);
    begin.setHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setHours(23, 59, 59, 999);

    if (day.getTime() < begin.getTime() || day.getTime() > end.getTime())
      return;

    total += calcMonthAllocation(
      rec.Loading,
      range.begin,
      range.end,
      monthFirst,
    );
  });

  return total;
};

const findNextAvailabilityDate = (
  records: EmployeeAllocationRecord[],
  fromDate: Date,
): Date | null => {
  const today = new Date(fromDate);
  today.setHours(0, 0, 0, 0);

  const candidateTimes = new Set<number>();

  const addCandidate = (d: Date) => {
    const normalized = new Date(d);
    normalized.setHours(0, 0, 0, 0);
    if (normalized.getTime() > today.getTime()) {
      candidateTimes.add(normalized.getTime());
    }
  };

  const addDayAfter = (d: Date) => {
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    addCandidate(next);
  };

  records.forEach((rec) => {
    const range = getRecordAllocationRange(rec);
    if (!range) return;

    if (rec.ReleasedOn) {
      addDayAfter(new Date(rec.ReleasedOn));
    }
    addDayAfter(range.end);
  });

  const monthTotalsMap: Record<string, number> = {};
  records.forEach((rec) => {
    rec.AllocationJson.forEach((m) => {
      monthTotalsMap[m.month] = (monthTotalsMap[m.month] || 0) + m.value;
    });
  });

  const currentMonthStart = startOfMonth(today);
  Object.keys(monthTotalsMap).forEach((label) => {
    const monthStart = parseMonthLabel(label);
    if (monthStart <= currentMonthStart) return;
    if ((monthTotalsMap[label] || 0) < 1) {
      addCandidate(monthStart);
    }
  });

  const sorted = Array.from(candidateTimes).sort((a, b) => a - b);
  for (const ts of sorted) {
    const candidate = new Date(ts);
    if (calcTotalAllocationOnDate(records, candidate) < 1) {
      return candidate;
    }
  }

  return null;
};

const addDayAfterToSet = (d: Date, target: Set<number>) => {
  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  target.add(next.getTime());
};

/** Collect dates when combined allocation may change (starts, releases, month boundaries). */
const collectAllocationBoundaryDates = (
  records: EmployeeAllocationRecord[],
  upToDate: Date,
): number[] => {
  const today = new Date(upToDate);
  today.setHours(0, 0, 0, 0);
  const boundaryTimes = new Set<number>();
  boundaryTimes.add(today.getTime());

  records.forEach((rec) => {
    const range = getRecordAllocationRange(rec);
    if (!range) return;

    const begin = new Date(range.begin);
    begin.setHours(0, 0, 0, 0);
    if (begin.getTime() <= today.getTime()) {
      boundaryTimes.add(begin.getTime());
    }

    if (rec.ReleasedOn) {
      const released = new Date(rec.ReleasedOn);
      if (released.getTime() <= today.getTime()) {
        boundaryTimes.add(released.getTime());
        addDayAfterToSet(released, boundaryTimes);
      }
    }

    const end = new Date(range.end);
    if (end.getTime() <= today.getTime()) {
      boundaryTimes.add(end.getTime());
      addDayAfterToSet(end, boundaryTimes);
    }
  });

  const monthTotalsMap: Record<string, number> = {};
  records.forEach((rec) => {
    rec.AllocationJson.forEach((m) => {
      monthTotalsMap[m.month] = (monthTotalsMap[m.month] || 0) + m.value;
    });
  });

  Object.keys(monthTotalsMap).forEach((label) => {
    const monthStart = parseMonthLabel(label);
    if (monthStart.getTime() > today.getTime()) return;
    boundaryTimes.add(monthStart.getTime());
    const monthEnd = endOfMonth(monthStart);
    if (monthEnd.getTime() <= today.getTime()) {
      addDayAfterToSet(monthEnd, boundaryTimes);
    }
  });

  return Array.from(boundaryTimes)
    .filter((t) => t <= today.getTime())
    .sort((a, b) => b - a);
};

/**
 * Most recent date (inclusive) when the employee had no free capacity,
 * then return the following day if that day has free capacity today.
 */
const findAvailableSinceDate = (
  records: EmployeeAllocationRecord[],
  asOfDate: Date,
): Date | null => {
  const today = new Date(asOfDate);
  today.setHours(0, 0, 0, 0);

  if (calcTotalAllocationOnDate(records, today) >= 1) {
    return null;
  }

  const boundaries = collectAllocationBoundaryDates(records, today);

  for (const ts of boundaries) {
    const day = new Date(ts);
    if (calcTotalAllocationOnDate(records, day) >= 1) {
      const from = new Date(day);
      from.setDate(from.getDate() + 1);
      from.setHours(0, 0, 0, 0);
      if (
        from.getTime() <= today.getTime() &&
        calcTotalAllocationOnDate(records, from) < 1
      ) {
        return from;
      }
    }
  }

  let earliestBegin: Date | null = null;
  records.forEach((rec) => {
    const range = getRecordAllocationRange(rec);
    if (!range) return;
    const begin = new Date(range.begin);
    begin.setHours(0, 0, 0, 0);
    if (!earliestBegin || begin.getTime() < earliestBegin.getTime()) {
      earliestBegin = begin;
    }
  });

  if (earliestBegin && calcTotalAllocationOnDate(records, earliestBegin) < 1) {
    return earliestBegin;
  }

  return today;
};

const normalizeDay = (d: Date): Date => {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
};

const getPlanningHorizonEnd = (records: EmployeeAllocationRecord[]): Date => {
  let horizon = computeEndDate(null, null) ?? new Date(2027, 2, 31);
  records.forEach((rec) => {
    const range = getRecordAllocationRange(rec);
    if (range && range.end.getTime() > horizon.getTime()) {
      horizon = range.end;
    }
  });
  return normalizeDay(horizon);
};

/** All dates where combined allocation may change, between rangeStart and rangeEnd. */
const collectBoundaryDatesInRange = (
  records: EmployeeAllocationRecord[],
  rangeStart: Date,
  rangeEnd: Date,
): Date[] => {
  const start = normalizeDay(rangeStart);
  const end = normalizeDay(rangeEnd);
  const boundaryTimes = new Set<number>();
  boundaryTimes.add(start.getTime());
  boundaryTimes.add(end.getTime());

  const addIfInRange = (d: Date) => {
    const n = normalizeDay(d);
    if (n.getTime() >= start.getTime() && n.getTime() <= end.getTime()) {
      boundaryTimes.add(n.getTime());
    }
  };

  records.forEach((rec) => {
    const range = getRecordAllocationRange(rec);
    if (!range) return;

    addIfInRange(range.begin);
    addIfInRange(range.end);

    if (rec.ReleasedOn) {
      addIfInRange(new Date(rec.ReleasedOn));
      const dayAfter = new Date(rec.ReleasedOn);
      dayAfter.setDate(dayAfter.getDate() + 1);
      addIfInRange(dayAfter);
    }

    const dayAfterEnd = new Date(range.end);
    dayAfterEnd.setDate(dayAfterEnd.getDate() + 1);
    addIfInRange(dayAfterEnd);
  });

  const monthTotalsMap: Record<string, number> = {};
  records.forEach((rec) => {
    rec.AllocationJson.forEach((m) => {
      monthTotalsMap[m.month] = (monthTotalsMap[m.month] || 0) + m.value;
    });
  });

  Object.keys(monthTotalsMap).forEach((label) => {
    const monthStart = parseMonthLabel(label);
    addIfInRange(monthStart);
    addIfInRange(endOfMonth(monthStart));
    const dayAfterMonth = new Date(endOfMonth(monthStart));
    dayAfterMonth.setDate(dayAfterMonth.getDate() + 1);
    addIfInRange(dayAfterMonth);
  });

  return Array.from(boundaryTimes)
    .sort((a, b) => a - b)
    .map((t) => new Date(t));
};

const roundCapacityPct = (fraction: number): number =>
  parseFloat((fraction * 100).toFixed(1));

/**
 * Build contiguous periods (from today through planning horizon) showing how
 * much of the employee is already allocated vs. usable for a new project.
 */
export const buildEmployeeAvailabilityWindows = (
  records: EmployeeAllocationRecord[],
  rangeStart: Date,
  rangeEnd: Date,
): EmployeeAvailabilityWindow[] => {
  const start = normalizeDay(rangeStart);
  const end = normalizeDay(rangeEnd);
  if (start.getTime() > end.getTime()) return [];

  if (records.length === 0) {
    return [
      {
        fromDate: start.toISOString(),
        toDate: end.toISOString(),
        allocatedPercent: 0,
        usableCapacityPercent: 1,
      },
    ];
  }

  const boundaries = collectBoundaryDatesInRange(records, start, end);
  const rawWindows: EmployeeAvailabilityWindow[] = [];

  for (let i = 0; i < boundaries.length - 1; i++) {
    const from = normalizeDay(boundaries[i]);
    const segmentEnd = normalizeDay(boundaries[i + 1]);
    segmentEnd.setDate(segmentEnd.getDate() - 1);

    if (from.getTime() > segmentEnd.getTime()) continue;

    const allocated = calcTotalAllocationOnDate(records, from);
    const usable = Math.max(0, 1 - allocated);
    if (usable <= 0) continue;

    rawWindows.push({
      fromDate: from.toISOString(),
      toDate: segmentEnd.toISOString(),
      allocatedPercent: allocated,
      usableCapacityPercent: usable,
    });
  }

  const merged: EmployeeAvailabilityWindow[] = [];
  rawWindows.forEach((window) => {
    const last = merged[merged.length - 1];
    const allocKey = roundCapacityPct(window.allocatedPercent);
    const lastAllocKey = last ? roundCapacityPct(last.allocatedPercent) : null;

    if (last && lastAllocKey === allocKey) {
      last.toDate = window.toDate;
      return;
    }
    merged.push({ ...window });
  });

  return merged;
};

/**
 * Cross-project availability for one employee: current free capacity and
 * the first future date when combined allocation drops below 100%.
 */
export const computeEmployeeAvailabilitySummary = (
  records: EmployeeAllocationRecord[],
): EmployeeAvailabilitySummary => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeProjectKeys = new Set<string>();
  records.forEach((r) => activeProjectKeys.add(getActiveProjectDedupeKey(r)));

  const horizonEnd = getPlanningHorizonEnd(records);

  if (records.length === 0) {
    return {
      totalAllocationToday: 0,
      freePercent: 1,
      isAvailableNow: true,
      availableFrom: today.toISOString(),
      availableAfter: null,
      activeProjectCount: 0,
      availabilityWindows: buildEmployeeAvailabilityWindows(
        records,
        today,
        horizonEnd,
      ),
    };
  }

  const totalAllocationToday = calcTotalAllocationOnDate(records, today);
  const freePercent = Math.max(0, 1 - totalAllocationToday);
  const isAvailableNow = freePercent > 0;

  const availableSinceDate = isAvailableNow
    ? findAvailableSinceDate(records, today)
    : null;
  const availableAfterDate = isAvailableNow
    ? null
    : findNextAvailabilityDate(records, today);

  const windowRangeStart =
    availableSinceDate && availableSinceDate.getTime() > today.getTime()
      ? availableSinceDate
      : today;

  const availabilityWindows = isAvailableNow
    ? buildEmployeeAvailabilityWindows(records, windowRangeStart, horizonEnd)
    : [];

  return {
    totalAllocationToday,
    freePercent,
    isAvailableNow,
    availableFrom: availableSinceDate ? availableSinceDate.toISOString() : null,
    availableAfter: availableAfterDate
      ? availableAfterDate.toISOString()
      : null,
    activeProjectCount: activeProjectKeys.size,
    availabilityWindows,
  };
};

// ─────────────────────────────────────────────
//  FORMATTING HELPERS
// ─────────────────────────────────────────────

export const formatPercent = (val: number): string =>
  `${(val * 100).toFixed(0)}%`;

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const safeParseJson = (
  raw: string | null | undefined,
): AllocationMonth[] => {
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// ─────────────────────────────────────────────
//  EMPLOYEE ALLOCATION UI HELPERS (EmployeeAllocations webpart)
// ─────────────────────────────────────────────

export const normalizeName = (name: string | null | undefined): string =>
  (name || "").trim().toLowerCase();

export const namesMatch = (
  a: string | null | undefined,
  b: string | null | undefined,
): boolean => normalizeName(a) === normalizeName(b);

export const employeeIdsMatch = (
  a: string | null | undefined,
  b: string | null | undefined,
): boolean => {
  const idA = String(a ?? "").trim();
  const idB = String(b ?? "").trim();
  if (!idA || !idB) return false;
  return idA === idB;
};

export const getPersonDisplayName = (person: any): string => {
  if (!person) return "";
  return String(person.text || person.name || person.displayName || "").trim();
};

export const getPersonEmail = (person: any): string => {
  if (!person) return "";
  return String(
    person.secondaryText || person.email || person.mail || "",
  ).trim();
};

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

/** Map InternalRegistry EmpEmail → EmpID (case-insensitive email keys). */
export const buildInternalRegistryEmailToEmpIdMap = (
  items: any[],
): Record<string, string> => {
  const map: Record<string, string> = {};
  (items || []).forEach((item) => {
    const email = String(item?.EmpEmail || "").trim();
    const empId = String(item?.EmpID || "").trim();
    if (!email || !empId) return;
    map[normalizeEmail(email)] = empId;
  });
  return map;
};

export const lookupEmpIdByEmail = (
  registryByEmail: Record<string, string>,
  email: string,
): string => {
  const key = normalizeEmail(email);
  if (!key) return "";
  return registryByEmail[key] || "";
};

export const getPickerDefaultEmails = (people: any[]): string[] => {
  if (!people?.length) return [];
  return people.map((p) => getPersonEmail(p)).filter((e) => e.length > 0);
};

export const toDayStart = (d: Date): number =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export const rangesOverlap = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean => {
  const a0 = toDayStart(startA);
  const a1 = toDayStart(endA);
  const b0 = toDayStart(startB);
  const b1 = toDayStart(endB);
  return a0 <= b1 && b0 <= a1;
};

export const getRowEffectiveRange = (
  row: AllocationRow,
): { start: Date; end: Date } | null => {
  const start = computeBeginDate(row.AllocatedOn ?? null);
  const end = computeEndDate(row.AllocatedOn ?? null, row.ReleasedOn ?? null);
  if (!start || !end) return null;
  return { start, end };
};

export const getRowProjectFullId = (row: AllocationRow): string =>
  (row.ProjectFullID ?? row.ProjectID ?? "").trim();

export const isSameProjectRow = (
  row: AllocationRow,
  currentProjectFullId: string,
): boolean => {
  const current = (currentProjectFullId ?? "").trim();
  if (!current) return false;
  return getRowProjectFullId(row) === current;
};

export const formatAllocationPeriod = (
  allocatedOn: string | null,
  releasedOn: string | null,
): string => {
  const startLabel = formatDate(allocatedOn);
  const endLabel = releasedOn ? formatDate(releasedOn) : "ongoing";
  return `${startLabel} to ${endLabel}`;
};

export const isoToLocalDate = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export const localDateToIso = (
  date: Date | null | undefined,
): string | null => {
  if (!date) return null;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
    0,
  ).toISOString();
};

export const inlineTextFieldStyles: Partial<ITextFieldStyles> = {
  root: { width: "100%", maxWidth: 120 },
  fieldGroup: {
    border: "1px solid #00a99d",
    borderRadius: 6,
    height: 32,
  },
  field: {
    fontSize: 12,
    color: "#000",
  },
};

export const inlineDatePickerStyles: Partial<IDatePickerStyles> = {
  ...DatePickerStyles,
  root: {
    ...(DatePickerStyles.root as Record<string, unknown>),
    maxWidth: 150,
    minWidth: 130,
  },
};

export const stopTableCellEvent = (e: React.SyntheticEvent) => {
  e.stopPropagation();
};

/** SharePoint date field format (same as ProjectsFormPage / CRForm) */
export const formatDateForSp = (
  isoOrDate: string | Date | null | undefined,
): string | null => {
  if (!isoOrDate) return null;
  const d =
    isoOrDate instanceof Date ? isoOrDate : isoToLocalDate(isoOrDate as string);
  return SPServices.GetDateFormat(d);
};

/** Local state so DataTable re-renders do not reset the text field while typing */
export const EmpIdInlineEditor: React.FC<{
  rowId: number;
  initialValue: string;
  onValueChange: (value: string) => void;
  fieldStyles: Partial<ITextFieldStyles>;
}> = ({ rowId, initialValue, onValueChange, fieldStyles }) => {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [rowId]);

  return (
    <TextField
      value={value}
      onChange={(_, v) => {
        const next = v ?? "";
        setValue(next);
        onValueChange(next);
      }}
      styles={fieldStyles}
    />
  );
};

/** Local state keeps DatePicker stable inside scrollable DataTable cells */
export const DateInlineEditor: React.FC<{
  rowId: number;
  initialIso: string | null;
  onDateChange: (date: Date | null | undefined) => void;
  pickerStyles: Partial<IDatePickerStyles>;
}> = ({ rowId, initialIso, onDateChange, pickerStyles }) => {
  const [value, setValue] = React.useState<Date | undefined>(
    isoToLocalDate(initialIso) ?? undefined,
  );

  React.useEffect(() => {
    setValue(isoToLocalDate(initialIso) ?? undefined);
  }, [rowId]);

  return (
    <DatePicker
      value={value}
      allowTextInput
      onSelectDate={(date) => {
        setValue(date ?? undefined);
        onDateChange(date ?? null);
      }}
      styles={pickerStyles}
    />
  );
};

export const recalcDraftFromDates = (draft: AllocationRow): AllocationRow => {
  const begin = computeBeginDate(draft.AllocatedOn ?? null);
  const end = computeEndDate(
    draft.AllocatedOn ?? null,
    draft.ReleasedOn ?? null,
  );
  const json =
    begin && end
      ? buildCalculatedAllocationJson(draft.Loading, begin, end)
      : draft.AllocationJson;
  return {
    ...draft,
    BeginDate: begin ? begin.toISOString() : null,
    EndDate: end ? end.toISOString() : null,
    AllocationJson: json,
  };
};

export const findCrossProjectDateConflicts = (
  records: AllocationRow[],
  employeeId: string,
  allocatedOn: string | null,
  releasedOn: string | null,
  currentProjectFullId: string,
  excludeRowId?: number,
): DateRangeConflict[] => {
  const proposedStart = computeBeginDate(allocatedOn);
  const proposedEnd = computeEndDate(allocatedOn, releasedOn);
  if (!proposedStart || !proposedEnd) return [];

  const conflicts: DateRangeConflict[] = [];

  records.forEach((row) => {
    if (!employeeIdsMatch(row.EmployeeID, employeeId)) return;
    if (excludeRowId != null && row.ID === excludeRowId) return;
    if (isSameProjectRow(row, currentProjectFullId)) return;

    const existing = getRowEffectiveRange(row);
    if (!existing) return;

    if (
      rangesOverlap(proposedStart, proposedEnd, existing.start, existing.end)
    ) {
      conflicts.push({
        projectTitle: row.ProjectTitle || `Project ${row.ProjectID}`,
        allocatedOn: row.AllocatedOn,
        releasedOn: row.ReleasedOn,
      });
    }
  });

  return conflicts;
};

export const buildDateConflictMessage = (
  conflicts: DateRangeConflict[],
  proposedAllocatedOn: string,
  proposedReleasedOn: string | null,
): string => {
  const proposed = formatAllocationPeriod(
    proposedAllocatedOn,
    proposedReleasedOn,
  );
  const conflictDetails = conflicts
    .map(
      (c) =>
        `${c.projectTitle} (${formatAllocationPeriod(c.allocatedOn, c.releasedOn)})`,
    )
    .join("; ");
  return `This employee is already allocated to another project on overlapping dates. Selected period: ${proposed}. Conflicting allocation(s): ${conflictDetails}.`;
};

export const mapSpItemToRow = (
  item: any,
  fallbackProjectFullId: string,
  fallbackTitle: string,
): AllocationRow => {
  const expand = item.Project;
  // EmployeeAllocations list column ProjectID stores the CRM full id (e.g. PRJ-xxx)
  const crmFullId = String(item.ProjectID ?? expand?.ProjectID ?? "").trim();
  const fallbackKey = (fallbackProjectFullId ?? "").trim();

  let projectTitle = "";
  if (expand?.Title) projectTitle = String(expand.Title);
  else if (expand?.ProjectName) projectTitle = String(expand.ProjectName);
  else if (crmFullId && fallbackKey && crmFullId === fallbackKey)
    projectTitle = fallbackTitle;

  return {
    ID: item.ID,
    EmployeeName: item.EmployeeName || "",
    EmployeeID: item.EmployeeID || "",
    ProjectID: crmFullId,
    ProjectTitle: projectTitle || undefined,
    ProjectFullID: crmFullId || undefined,
    Loading: Number(item.Loading) || 0,
    AllocatedOn: item.AllocatedOn || null,
    ReleasedOn: item.ReleasedOn || null,
    BeginDate: item.BeginDate || null,
    EndDate: item.EndDate || null,
    AllocationJson: safeParseJson(item.AllocationJson),
  };
};

export const recalcFormDerivedFields = (
  updated: Partial<AllocationRow>,
): Partial<AllocationRow> => {
  const beginDate = computeBeginDate(updated.AllocatedOn ?? null);
  const endDate = computeEndDate(
    updated.AllocatedOn ?? null,
    updated.ReleasedOn ?? null,
  );

  const allocationJson =
    beginDate && endDate
      ? buildCalculatedAllocationJson(updated.Loading ?? 1, beginDate, endDate)
      : [];

  return {
    ...updated,
    BeginDate: beginDate ? beginDate.toISOString() : null,
    EndDate: endDate ? endDate.toISOString() : null,
    AllocationJson: allocationJson,
  };
};

export const EmployeeAllocationMiniChart: React.FC<{
  history: { month: string; total: number }[];
  css: Pick<
    IEmployeeAllocationDashboardScss,
    "miniChart" | "bar" | "overAllocated"
  >;
}> = ({ history, css }) => {
  const last8 = history.slice(-8);
  const max = Math.max(...last8.map((h) => h.total), 100);
  return (
    <div className={css.miniChart}>
      {last8.map((h) => (
        <div
          key={h.month}
          className={`${css.bar} ${h.total > 100 ? css.overAllocated : ""}`}
          style={{ height: `${Math.max(4, (h.total / max) * 100)}%` }}
          title={`${h.month}: ${h.total.toFixed(0)}%`}
        />
      ))}
    </div>
  );
};

const formatAvailabilityRange = (fromDate: string, toDate: string): string => {
  const from = formatDate(fromDate);
  const to = formatDate(toDate);
  return from === to ? from : `${from} – ${to}`;
};

export const EmployeeAvailabilitySummaryPanel: React.FC<{
  summary: EmployeeAvailabilitySummary;
  css: IEmployeeAvailabilitySummaryScss;
}> = ({ summary, css }) => {
  const allocatedPct = Math.min(
    100,
    parseFloat((summary.totalAllocationToday * 100).toFixed(1)),
  );
  const freePct = parseFloat((summary.freePercent * 100).toFixed(1));
  const overAllocated = summary.totalAllocationToday > 1;

  return (
    <div className={css.availabilitySummary}>
      <div className={css.availabilitySummaryHeader}>
        Combined availability (all projects)
      </div>
      <div className={css.availabilitySummaryGrid}>
        <div className={css.availabilityStat}>
          <div className={css.availabilityStatLabel}>Currently allocated</div>
          <div
            className={css.availabilityStatValue}
            style={overAllocated ? { color: "#aa1f1f" } : undefined}
          >
            {allocatedPct}%{overAllocated ? "+" : ""}
          </div>
          <div className={css.availabilityStatSub}>
            across {summary.activeProjectCount} project
            {summary.activeProjectCount !== 1 ? "s" : ""}
          </div>
        </div>

        <div className={css.availabilityStat}>
          <div className={css.availabilityStatLabel}>Free / available</div>
          <div
            className={css.availabilityStatValue}
            style={{ color: freePct > 0 ? "#0d900d" : "#686766" }}
          >
            {freePct}%
          </div>
          <div className={css.availabilityStatSub}>of full-time capacity</div>
        </div>

        <div className={css.availabilityStat}>
          <div className={css.availabilityStatLabel}>Availability status</div>
          {summary.isAvailableNow ? (
            <>
              <div
                className={`${css.availabilityStatValue} ${css.availabilityAvailableNow}`}
              >
                Available now
              </div>
              <div className={css.availabilityStatSub}>
                {freePct >= 100
                  ? "Not assigned to any active project"
                  : `${freePct}% can be assigned to a new project today`}
              </div>
            </>
          ) : summary.availableAfter ? (
            <>
              <div
                className={`${css.availabilityStatValue} ${css.availabilityFullyBooked}`}
              >
                Fully booked
              </div>
              <div className={css.availabilityStatSub}>
                Available from{" "}
                <strong>{formatDate(summary.availableAfter)}</strong>
              </div>
              <div className={css.availabilityStatSub}>
                Expected to have free capacity from this date onward
              </div>
            </>
          ) : (
            <>
              <div
                className={`${css.availabilityStatValue} ${css.availabilityFullyBooked}`}
              >
                Fully booked
              </div>
              <div className={css.availabilityStatSub}>
                No upcoming release date found in current allocation data
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const EmployeeAllocationDashboard: React.FC<{
  dashboard: DashboardStats;
  css: IEmployeeAllocationDashboardScss;
}> = ({ dashboard, css }) => (
  <div className={css.dashboard}>
    <div className={`${css.statCard} ${css.tealCard}`}>
      <div className={css.statIcon}>📊</div>
      <div className={css.statLabel}>Current Allocation</div>
      <div className={css.statValue}>
        {formatPercent(dashboard.currentAllocation)}
      </div>
      <div className={css.statSub}>this month</div>
      <div className={css.timelineBar}>
        <div
          className={css.fill}
          style={{
            width: `${Math.min(100, dashboard.currentAllocation * 100)}%`,
          }}
        />
      </div>
    </div>

    <div className={`${css.statCard} ${css.sageCard}`}>
      <div className={css.statIcon}>✅</div>
      <div className={css.statLabel}>Free</div>
      <div className={css.statValue}>
        {formatPercent(dashboard.freePercent)}
      </div>
      <div className={css.statSub}>available capacity</div>
    </div>

    <div className={`${css.statCard} ${css.goldCard}`}>
      <div className={css.statIcon}>🪑</div>
      <div className={css.statLabel}>Bench</div>
      <div className={css.statValue}>
        {formatPercent(dashboard.benchPercent)}
      </div>
      <div className={css.statSub}>unallocated</div>
    </div>

    <div className={`${css.statCard} ${css.crimsonCard}`}>
      <div className={css.statLabel}>Allocation History</div>
      <EmployeeAllocationMiniChart
        history={dashboard.allocationHistory}
        css={css}
      />
      <div className={css.statSub} style={{ marginTop: "6px" }}>
        last {Math.min(8, dashboard.allocationHistory.length)} months
      </div>
    </div>

    <div className={`${css.statCard} ${css.projectsCard}`}>
      <div className={css.statIcon}>🗂️</div>
      <div className={css.statLabel}>Active Projects</div>
      <div className={css.statValue} style={{ fontSize: "22px" }}>
        {dashboard.activeProjects.length}
      </div>
      <div className={css.projectList}>
        {dashboard.activeProjects.slice(0, 1).map((p) => (
          <div title={p} key={p} className={css.projectTag}>
            {p}
          </div>
        ))}
        {dashboard.activeProjects.length > 1 && (
          <div
            title={dashboard.activeProjects.slice(1).join(", ")}
            className={css.projectTag}
            style={{ color: "#686766" }}
          >
            +{dashboard.activeProjects.length - 1} more
          </div>
        )}
      </div>
    </div>
  </div>
);

export const EmployeeAllocationNewFormPanel: React.FC<
  IEmployeeAllocationNewFormPanelProps
> = ({
  css,
  formData,
  formPickerKey,
  webAbsoluteUrl,
  context,
  defaultSelectedEmails,
  onPeopleChange,
  onLoadingPctChange,
  onAllocatedOnIsoChange,
  onReleasedOnIsoChange,
  onCancel,
  onSave,
}) => (
  <div className={css.formPanel}>
    <div className={css.formGrid}>
      <div className={css.formField}>
        <label>Employee Name *</label>
        {context && (
          <div className={css.peoplePicker}>
            <PeoplePicker
              key={`form-${formPickerKey}`}
              ensureUser
              placeholder="Select employee"
              personSelectionLimit={1}
              context={context}
              webAbsoluteUrl={webAbsoluteUrl}
              defaultSelectedUsers={defaultSelectedEmails}
              resolveDelay={100}
              onChange={onPeopleChange}
              styles={peoplePickerStyles}
            />
          </div>
        )}
      </div>

      <div className={css.formField}>
        <label>Employee ID</label>
        <InputText
          placeholder="Auto-generated"
          value={formData.EmployeeID || ""}
          readOnly
        />
      </div>

      <div className={css.formField}>
        <label>Loading % *</label>
        <input
          type="number"
          style={{ border: "1px solid #e5d9d9" }}
          max={100}
          min={0}
          value={
            formData.Loading !== undefined
              ? Math.round(formData.Loading * 100)
              : ""
          }
          onChange={(e) => onLoadingPctChange(Number(e.target.value) / 100)}
        />
      </div>

      <div className={css.formField}>
        <label>Allocated On *</label>
        <DatePicker
          value={isoToLocalDate(formData.AllocatedOn) ?? undefined}
          onSelectDate={(date) =>
            onAllocatedOnIsoChange(localDateToIso(date ?? null))
          }
          styles={DatePickerStyles}
        />
      </div>

      <div className={css.formField}>
        <label>Released On</label>
        <DatePicker
          value={isoToLocalDate(formData.ReleasedOn) ?? undefined}
          onSelectDate={(date) =>
            onReleasedOnIsoChange(localDateToIso(date ?? null))
          }
          styles={DatePickerStyles}
        />
      </div>

      <div className={css.formField}>
        <label>Begin Date (auto)</label>
        <div className={css.readonlyField}>
          {formatDate(formData.BeginDate)}
        </div>
      </div>

      <div className={css.formField}>
        <label>End Date (auto)</label>
        <div className={css.readonlyField}>{formatDate(formData.EndDate)}</div>
      </div>

      <div className={css.formField}>
        <label>Months Generated</label>
        <div className={css.readonlyField}>
          {formData.AllocationJson?.length ?? 0} months
        </div>
      </div>
    </div>

    {formData.AllocationJson && formData.AllocationJson.length > 0 && (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          marginBottom: "18px",
        }}
      >
        {formData.AllocationJson.map((m) => (
          <span
            key={m.month}
            className={
              m.value >= 1
                ? `${css.monthChip} ${css.over}`
                : m.value >= 0.5
                  ? `${css.monthChip} ${css.high}`
                  : m.value > 0
                    ? `${css.monthChip} ${css.medium}`
                    : css.monthChip
            }
            title={`${m.month}: ${(m.value * 100).toFixed(1)}%`}
          >
            {m.month}
            <span style={{ marginLeft: "4px", opacity: 0.7 }}>
              {(m.value * 100).toFixed(0)}%
            </span>
          </span>
        ))}
      </div>
    )}

    <div className={css.formActions}>
      <button className={css.btnSecondary} onClick={onCancel}>
        Cancel
      </button>
      <button className={css.btnPrimary} onClick={onSave}>
        ✓ Save Allocation
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────
//  SHAREPOINT SEARCH HELPER
// ─────────────────────────────────────────────

/**
 * Filter employees whose names start with the query string (case-insensitive).
 * Used for the People Picker autocomplete.
 */
export const filterEmployeesByName = (
  allRecords: EmployeeAllocationRecord[],
  query: string,
): string[] => {
  const q = query.toLowerCase();
  const seen = new Set<string>();
  const names: string[] = [];
  allRecords.forEach((r) => {
    const name = r.EmployeeName || "";
    if (name.toLowerCase().includes(q) && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  });
  return names;
};
