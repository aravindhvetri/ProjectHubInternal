/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @rushstack/no-new-null */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { PeoplePicker } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import SPServices from "../../../../External/CommonServices/SPServices";
import {
  Config,
  peoplePickerStyles,
} from "../../../../External/CommonServices/Config";
import styles from "./EmployeeAllocations.module.scss";

import type {
  AllocationRow,
  ConsolidatedAllocationRow,
  DashboardStats,
  IBasicDropDown,
  IEmployeeAllocationDialogScss,
} from "../../../../External/CommonServices/interface";

import {
  buildLoadingCapacityBreachMessage,
  computeBeginDate,
  computeDashboardStats,
  computeEmployeeAvailabilitySummary,
  computeEndDate,
  buildInternalRegistryEmailToEmpIdMap,
  consolidateAllocationsByEmployeeProject,
  EmployeeAllocationDashboard,
  EmployeeAllocationEditDialog,
  EmployeeAllocationNewFormPanel,
  EmployeeAllocationTransactionsDialog,
  EmployeeAvailabilitySummaryPanel,
  findCrossProjectLoadingCapacityBreach,
  formatDate,
  formatDateForSp,
  getActiveProjectAllocation,
  getAllocationProjectDisplayLabel,
  getPersonDisplayName,
  getPersonEmail,
  getPickerDefaultEmails,
  getRowProjectFullId,
  isBenchAllocationRecord,
  isDisplayableAllocationRecord,
  isMeaningfulAllocationRecord,
  lookupEmpIdByEmail,
  mapSpItemToRow,
  employeeIdsMatch,
  parseMonthLabel,
  recalcDraftFromDates,
  recalcFormDerivedFields,
  reconcileEmployeeBenchAllocations,
  sortEmployeeAllocationSearchRows,
} from "../../../../External/CommonServices/CommonTemplate";

const PENDING_APPROVAL_MESSAGE =
  "This employee is currently locked because an allocation request is already under the approval process. A new allocation can only be added after the current request has been approved.";

const isSpYesValue = (value: unknown): boolean => {
  if (value === true || value === 1) return true;
  return (
    String(value ?? "")
      .trim()
      .toLowerCase() === "yes"
  );
};

const isAllocationJsonColumnEmpty = (row: AllocationRow): boolean => {
  const json = row.AllocationJson;
  return !Array.isArray(json) || json.length === 0;
};

const startOfLocalDay = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const hasReleaseDatePassed = (
  releasedOn: string | null | undefined,
): boolean => {
  const releaseDay = startOfLocalDay(releasedOn);
  if (!releaseDay) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime() > releaseDay.getTime();
};

const isAllocatedOnAfterReleaseDate = (
  allocatedOn: string | null | undefined,
  releasedOn: string | null | undefined,
): boolean => {
  const allocDay = startOfLocalDay(allocatedOn);
  const releaseDay = startOfLocalDay(releasedOn);
  if (!allocDay || !releaseDay) return false;
  return allocDay.getTime() > releaseDay.getTime();
};

const isAllocatedOnBeforeMinDate = (
  allocatedOn: string | null | undefined,
  minAllocatedOn: string | null | undefined,
): boolean => {
  const allocDay = startOfLocalDay(allocatedOn);
  const minDay = startOfLocalDay(minAllocatedOn);
  if (!allocDay || !minDay) return false;
  return allocDay.getTime() < minDay.getTime();
};

const findExistingEmployeeFlaggedRow = (
  rows: AllocationRow[],
  employeeId: string,
): AllocationRow | undefined =>
  rows.find(
    (r) =>
      employeeIdsMatch(r.EmployeeID, employeeId) &&
      isSpYesValue(r.ExistingEmployee),
  );

const findNewEmployeeFlaggedRow = (
  rows: AllocationRow[],
  employeeId: string,
): AllocationRow | undefined =>
  rows.find(
    (r) =>
      employeeIdsMatch(r.EmployeeID, employeeId) &&
      isSpYesValue(r.NewEmployee) &&
      isAllocationJsonColumnEmpty(r),
  );

const allocationDialogCss = styles as typeof styles &
  IEmployeeAllocationDialogScss;

const getRequestedByFromProjectManagers = (projectManagers: any[]): string => {
  if (!Array.isArray(projectManagers) || projectManagers.length === 0) {
    return "";
  }
  const names: string[] = [];
  const seen = new Set<string>();
  projectManagers.forEach((pm) => {
    const name = String(pm?.name || pm?.text || "").trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) return;
    seen.add(key);
    names.push(name);
  });
  return names.join(", ");
};

//  COMPONENT
const EmployeeAllocations = (props: any) => {
  // ── State ────────────────────────────────────────────────────
  const [allRows, setAllRows] = useState<AllocationRow[]>([]);
  const [globalRows, setGlobalRows] = useState<AllocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(true);

  // People Picker (search + form)
  const [searchPickerPeople, setSearchPickerPeople] = useState<any[]>([]);
  const [formPickerPeople, setFormPickerPeople] = useState<any[]>([]);
  const [formPickerKey, setFormPickerKey] = useState(0);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const [isNewEmployee, setIsNewEmployee] = useState(false);
  const [isAlreadyOnProject, setIsAlreadyOnProject] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [approvalStatusByEmployeeProject, setApprovalStatusByEmployeeProject] =
    useState<Record<string, string>>({});

  // Dashboard
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);

  // New row form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<AllocationRow>>({});
  const [newEmployeeMinAllocatedOn, setNewEmployeeMinAllocatedOn] = useState<
    string | null
  >(null);
  const [deploymentOptions, setDeploymentOptions] = useState<IBasicDropDown[]>(
    [],
  );

  // View / edit dialogs for consolidated rows
  const [viewConsolidatedRow, setViewConsolidatedRow] =
    useState<ConsolidatedAllocationRow | null>(null);
  const [editConsolidatedRow, setEditConsolidatedRow] =
    useState<ConsolidatedAllocationRow | null>(null);
  const [editTransactionDraft, setEditTransactionDraft] =
    useState<AllocationRow | null>(null);
  const editTransactionDraftRef = useRef<AllocationRow | null>(null);
  const [benchProjectLookupId, setBenchProjectLookupId] = useState(0);

  // Dynamic month columns for the DataTable
  const [monthColumns, setMonthColumns] = useState<string[]>([]);
  const [tableSearchTerm, setTableSearchTerm] = useState("");

  // InternalRegistry EmpEmail → EmpID lookup for People Picker selections
  const [registryByEmail, setRegistryByEmail] = useState<
    Record<string, string>
  >({});

  // ── Derived project identifiers ───────────────────────────────
  const projectFullId: string = (props?.selectedData?.ProjectID ?? "").trim();
  const projectLookupId: number = props?.selectedData?.ID ?? 0;
  const projectTitle: string =
    props?.selectedData?.Title || props?.selectedData?.ProjectName || "";

  const isCurrentProjectRow = useCallback(
    (row: AllocationRow) => {
      if (!projectFullId) return false;
      const rowFullId = (row.ProjectFullID ?? row.ProjectID ?? "").trim();
      return rowFullId === projectFullId;
    },
    [projectFullId],
  );

  const isViewingBenchProject = projectFullId === Config.benchProject;

  const displayableGlobalRows = useMemo(
    () =>
      globalRows.filter((row) =>
        isDisplayableAllocationRecord(row, globalRows),
      ),
    [globalRows],
  );

  const displayableProjectRows = useMemo(
    () =>
      allRows.filter((row) => isDisplayableAllocationRecord(row, globalRows)),
    [allRows, globalRows],
  );

  const countsAsOnCurrentProject = useCallback(
    (row: AllocationRow) => {
      if (
        !isDisplayableAllocationRecord(row, globalRows) ||
        !isCurrentProjectRow(row)
      ) {
        return false;
      }
      if (isBenchAllocationRecord(row) && !isViewingBenchProject) {
        return false;
      }
      return true;
    },
    [globalRows, isCurrentProjectRow, isViewingBenchProject],
  );

  //  DATA FETCHING
  const fetchGlobalAllocations = useCallback(() => {
    setGlobalLoading(true);
    SPServices.SPReadItems({
      Listname: Config.ListNames.EmployeeAllocations,
      Select:
        "*,Project/Id,Project/Title,Project/ProjectID,Project/ProjectName",
      Expand: "Project",
      Orderby: "EmployeeID",
      Orderbydecorasc: true,
    })
      .then((res: any[]) => {
        const rows: AllocationRow[] = (res || []).map((item: any) =>
          mapSpItemToRow(item, projectFullId, projectTitle),
        );
        setGlobalRows(rows);
        setGlobalLoading(false);
      })
      .catch((err: any) => {
        console.error("Global fetch error:", err);
        setGlobalLoading(false);
      });
  }, [projectFullId, projectTitle]);

  const fetchAllocations = useCallback(() => {
    if (!projectFullId) {
      setAllRows([]);
      refreshMonthColumns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    SPServices.SPReadItems({
      Listname: Config.ListNames.EmployeeAllocations,
      Select:
        "*,Project/Id,Project/Title,Project/ProjectID,Project/ProjectName",
      Expand: "Project",
      Filter: [
        {
          FilterKey: "ProjectID",
          Operator: "eq",
          FilterValue: projectFullId,
        },
      ],
      Orderby: "EmployeeID",
      Orderbydecorasc: true,
    })
      .then((res: any[]) => {
        const rows: AllocationRow[] = (res || []).map((item: any) =>
          mapSpItemToRow(item, projectFullId, projectTitle),
        );

        setAllRows(rows);
        refreshMonthColumns(rows);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, [projectFullId, projectTitle]);

  const fetchPendingApprovals = useCallback(() => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.AllocationsApproval,
      Select: "ID,EmployeeID,EmployeeName,ProjectID,Status",
      Orderby: "ID",
      Orderbydecorasc: false,
    })
      .then((res: any[]) => {
        const approvals = res || [];
        const openApprovals = approvals.filter(
          (item: any) =>
            String(item?.Status ?? "")
              .trim()
              .toLowerCase() === "open",
        );
        setPendingApprovals(openApprovals);

        const latestStatusByKey: Record<
          string,
          { id: number; status: string }
        > = {};
        approvals.forEach((item: any) => {
          const employeeId = String(item?.EmployeeID ?? "").trim();
          const projectId = String(item?.ProjectID ?? "").trim();
          const status = String(item?.Status ?? "").trim();
          const id = Number(item?.ID ?? 0);
          if (!employeeId || !projectId || !status) return;
          const key = `${employeeId}::${projectId}`;
          const existing = latestStatusByKey[key];
          if (!existing || id > existing.id) {
            latestStatusByKey[key] = { id, status };
          }
        });

        const statusMap: Record<string, string> = {};
        Object.keys(latestStatusByKey).forEach((key) => {
          statusMap[key] = latestStatusByKey[key].status;
        });
        setApprovalStatusByEmployeeProject(statusMap);
      })
      .catch((err: any) => {
        console.error("AllocationsApproval fetch error:", err);
      });
  }, []);

  const refreshData = useCallback(() => {
    setGlobalLoading(true);
    fetchAllocations();
    fetchGlobalAllocations();
    fetchPendingApprovals();
  }, [fetchAllocations, fetchGlobalAllocations, fetchPendingApprovals]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.Employees,
      Select: "EmpID,EmpEmail",
    })
      .then((res: any[]) => {
        setRegistryByEmail(buildInternalRegistryEmailToEmpIdMap(res || []));
      })
      .catch((err: any) => {
        console.error("InternalRegistry fetch error:", err);
      });
  }, []);

  // Get Deployment choice values from EmployeeAllocations list
  useEffect(() => {
    SPServices.SPGetChoices({
      Listname: Config.ListNames.EmployeeAllocations,
      FieldName: "Deployment",
    })
      .then((res: any) => {
        const tempDeployment: IBasicDropDown[] = [];
        if (res?.Choices?.length) {
          res.Choices.forEach((val: string) => {
            tempDeployment.push({ name: val });
          });
        }
        setDeploymentOptions(tempDeployment);
      })
      .catch((err: any) => {
        console.log(err, "Get choice error from EmployeeAllocations list");
      });
  }, []);

  const resolveEmpIdFromPerson = useCallback(
    (person: any): string => {
      const email = getPersonEmail(person);
      if (!email) return "";
      return lookupEmpIdByEmail(registryByEmail, email);
    },
    [registryByEmail],
  );

  const employeeHasOpenApprovalRequest = useCallback(
    (employeeId: string): boolean => {
      const normalizedId = (employeeId ?? "").trim();
      if (!normalizedId) return false;
      return pendingApprovals.some((item) => {
        const itemId = String(item?.EmployeeID ?? "").trim();
        return normalizedId === itemId;
      });
    },
    [pendingApprovals],
  );

  const selectedEmployeeDisplayName = useMemo(() => {
    if (searchPickerPeople.length) {
      return getPersonDisplayName(searchPickerPeople[0]);
    }
    if (selectedEmployeeId) {
      const row = globalRows.find((r) =>
        employeeIdsMatch(r.EmployeeID, selectedEmployeeId),
      );
      return row?.EmployeeName || selectedEmployeeId;
    }
    return "";
  }, [searchPickerPeople, selectedEmployeeId, globalRows]);

  const clearEmployeeSearch = () => {
    setSearchPickerPeople([]);
    setSelectedEmployeeId(null);
    setIsNewEmployee(false);
    setIsAlreadyOnProject(false);
    setIsPendingApproval(false);
    setDashboard(null);
  };

  useEffect(() => {
    clearEmployeeSearch();
    setTableSearchTerm("");
    setViewConsolidatedRow(null);
    setEditConsolidatedRow(null);
    editTransactionDraftRef.current = null;
    setEditTransactionDraft(null);
  }, [projectFullId]);

  useEffect(() => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.CRMProjects,
      Select: "ID,ProjectID",
      Filter: [
        {
          FilterKey: "ProjectID",
          Operator: "eq",
          FilterValue: Config.benchProject,
        },
      ],
    })
      .then((res: any[]) => {
        const id = Number(res?.[0]?.ID ?? 0);
        if (id) setBenchProjectLookupId(id);
      })
      .catch((err: any) => {
        console.error("Bench project lookup fetch error:", err);
      });
  }, []);

  const hasReleasedOnBeforeAllocatedOn = (
    allocatedOn: string | null | undefined,
    releasedOn: string | null | undefined,
  ): boolean => {
    if (!allocatedOn || !releasedOn) return false;
    return new Date(releasedOn).getTime() <= new Date(allocatedOn).getTime();
  };

  const rangesOverlapInclusive = (
    startA: Date,
    endA: Date,
    startB: Date,
    endB: Date,
  ): boolean =>
    startA.getTime() <= endB.getTime() && startB.getTime() <= endA.getTime();

  const hasSameProjectDateOverlap = (
    employeeId: string,
    allocatedOn: string | null | undefined,
    releasedOn: string | null | undefined,
    excludeRowId?: number,
  ): boolean => {
    const proposedStart = computeBeginDate(allocatedOn ?? null);
    const proposedEnd = computeEndDate(allocatedOn ?? null, releasedOn ?? null);
    if (!proposedStart || !proposedEnd) return false;

    return allRows.some((row) => {
      if (!isMeaningfulAllocationRecord(row)) return false;
      if (!employeeIdsMatch(row.EmployeeID, employeeId)) return false;
      if (excludeRowId != null && row.ID === excludeRowId) return false;
      if (!isCurrentProjectRow(row)) return false;

      const rowStart = computeBeginDate(row.AllocatedOn ?? null);
      const rowEnd = computeEndDate(
        row.AllocatedOn ?? null,
        row.ReleasedOn ?? null,
      );
      if (!rowStart || !rowEnd) return false;

      return rangesOverlapInclusive(
        proposedStart,
        proposedEnd,
        rowStart,
        rowEnd,
      );
    });
  };

  const buildEmployeeMonthlyTotals = (
    employeeId: string,
    excludeRowId?: number,
  ): Map<string, number> => {
    const totals = new Map<string, number>();
    globalRows.forEach((row) => {
      if (!isMeaningfulAllocationRecord(row)) return;
      if (isBenchAllocationRecord(row)) return;
      if (!employeeIdsMatch(row.EmployeeID, employeeId)) return;
      if (excludeRowId != null && row.ID === excludeRowId) return;
      row.AllocationJson.forEach((month) => {
        totals.set(
          month.month,
          (totals.get(month.month) ?? 0) + (month.value ?? 0),
        );
      });
    });
    return totals;
  };

  const getEmployeeOverAllocatedMonths = (
    employeeId: string,
    candidateMonths: { month: string; value: number }[],
    excludeRowId?: number,
  ): string[] => {
    if (!candidateMonths.length) return [];

    const totals = buildEmployeeMonthlyTotals(employeeId, excludeRowId);
    const proposedMonthKeys = new Set(
      candidateMonths.map((month) => month.month),
    );

    candidateMonths.forEach((month) => {
      totals.set(
        month.month,
        (totals.get(month.month) ?? 0) + (month.value ?? 0),
      );
    });

    return Array.from(totals.entries())
      .filter(
        ([month, value]) => proposedMonthKeys.has(month) && value > 1 + 0.00001,
      )
      .map(([month]) => month)
      .sort(
        (a, b) => parseMonthLabel(a).getTime() - parseMonthLabel(b).getTime(),
      );
  };

  const syncBenchForEmployee = useCallback(
    async (employeeId: string, employeeName: string) => {
      if (!benchProjectLookupId || isViewingBenchProject) return;
      try {
        const res: any[] = await SPServices.SPReadItems({
          Listname: Config.ListNames.EmployeeAllocations,
          Select:
            "*,Project/Id,Project/Title,Project/ProjectID,Project/ProjectName",
          Expand: "Project",
          Orderby: "EmployeeID",
          Orderbydecorasc: true,
        });
        const rows: AllocationRow[] = (res || []).map((item: any) =>
          mapSpItemToRow(item, projectFullId, projectTitle),
        );
        await reconcileEmployeeBenchAllocations(
          employeeId,
          employeeName,
          rows,
          benchProjectLookupId,
        );
      } catch (err) {
        console.error("Bench sync error:", err);
      }
    },
    [benchProjectLookupId, isViewingBenchProject, projectFullId, projectTitle],
  );

  // Recompute dashboard when data or selection changes (cross-project stats)
  useEffect(() => {
    if (!selectedEmployeeId) return;

    const employeeRows = displayableGlobalRows.filter((r) =>
      employeeIdsMatch(r.EmployeeID, selectedEmployeeId),
    );
    const projectRows = displayableProjectRows.filter((r) =>
      employeeIdsMatch(r.EmployeeID, selectedEmployeeId),
    );
    const onCurrentProjectRows = projectRows.filter(countsAsOnCurrentProject);

    setIsAlreadyOnProject(onCurrentProjectRows.length > 0);
    setIsNewEmployee(employeeRows.length === 0);
    setDashboard(
      employeeRows.length > 0 ? computeDashboardStats(employeeRows) : null,
    );
  }, [
    displayableGlobalRows,
    displayableProjectRows,
    selectedEmployeeId,
    countsAsOnCurrentProject,
  ]);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setIsPendingApproval(false);
      return;
    }

    setIsPendingApproval(employeeHasOpenApprovalRequest(selectedEmployeeId));
  }, [selectedEmployeeId, employeeHasOpenApprovalRequest]);

  const consolidatedDisplayRows = useMemo(() => {
    const sourceRows = selectedEmployeeId
      ? displayableGlobalRows.filter((r) =>
          employeeIdsMatch(r.EmployeeID, selectedEmployeeId),
        )
      : displayableProjectRows;

    const consolidated = consolidateAllocationsByEmployeeProject(
      sourceRows,
      projectFullId,
    );

    if (!selectedEmployeeId) return consolidated;

    return sortEmployeeAllocationSearchRows(
      consolidated,
      projectFullId,
    ) as ConsolidatedAllocationRow[];
  }, [
    selectedEmployeeId,
    displayableGlobalRows,
    displayableProjectRows,
    projectFullId,
  ]);

  // Month columns follow consolidated rows shown in the table
  useEffect(() => {
    refreshMonthColumns(consolidatedDisplayRows);
  }, [consolidatedDisplayRows]);

  const availabilitySummary = useMemo(() => {
    if (!selectedEmployeeId) return null;
    const employeeRows = displayableGlobalRows.filter((r) =>
      employeeIdsMatch(r.EmployeeID, selectedEmployeeId),
    );
    return computeEmployeeAvailabilitySummary(employeeRows);
  }, [selectedEmployeeId, displayableGlobalRows]);

  // ─── Recompute month columns whenever rows change ─────────────
  const refreshMonthColumns = (rows: AllocationRow[]) => {
    const monthSet = new Set<string>();
    rows.forEach((r) => r.AllocationJson.forEach((m) => monthSet.add(m.month)));
    const sorted = Array.from(monthSet).sort(
      (a, b) => parseMonthLabel(a).getTime() - parseMonthLabel(b).getTime(),
    );
    setMonthColumns(sorted);
  };

  //  PEOPLE PICKER LOGIC
  const handleSearchPickerChange = (items: any[]) => {
    if (!items?.length) {
      clearEmployeeSearch();
      return;
    }

    const empId = resolveEmpIdFromPerson(items[0]);
    if (!empId) {
      props.Notify?.(
        "warn",
        "Validation",
        "Employee ID could not be resolved for the selected user. Please ensure the employee exists in Internal Registry.",
      );
      clearEmployeeSearch();
      return;
    }

    setSearchPickerPeople(items);
    setSelectedEmployeeId(empId);
  };

  const handleFormPickerChange = (items: any[]) => {
    setFormPickerPeople(items);
    const name = items?.length ? getPersonDisplayName(items[0]) : "";
    const empId = items?.length ? resolveEmpIdFromPerson(items[0]) : "";

    let minAllocatedOn: string | null = null;
    let allocatedOn: string | null = null;
    if (empId) {
      const newEmployeeRow = findNewEmployeeFlaggedRow(globalRows, empId);
      if (newEmployeeRow?.AllocatedOn) {
        minAllocatedOn = newEmployeeRow.AllocatedOn;
        allocatedOn = newEmployeeRow.AllocatedOn;
      }
    }
    setNewEmployeeMinAllocatedOn(minAllocatedOn);

    setFormData((prev) => {
      const updated: Partial<AllocationRow> = {
        ...prev,
        EmployeeName: name,
        EmployeeID: empId,
      };
      if (allocatedOn) {
        updated.AllocatedOn = allocatedOn;
        return recalcFormDerivedFields(updated);
      }
      return updated;
    });
  };

  //  ADD NEW ROW (form-based)
  const handleAddClick = () => {
    if (editConsolidatedRow) {
      props.Notify?.(
        "warn",
        "Warning",
        "Save or cancel the current edit first.",
      );
      return;
    }

    const prefillEmpId = searchPickerPeople.length
      ? resolveEmpIdFromPerson(searchPickerPeople[0])
      : selectedEmployeeId || "";
    const prefillName = searchPickerPeople.length
      ? getPersonDisplayName(searchPickerPeople[0])
      : selectedEmployeeDisplayName;
    if (prefillEmpId && employeeHasOpenApprovalRequest(prefillEmpId)) {
      props.Notify?.("warn", "Validation", PENDING_APPROVAL_MESSAGE);
      return;
    }

    let prefilledAllocatedOn: string | null = null;
    let minAllocatedOn: string | null = null;

    if (prefillEmpId) {
      const existingEmployeeRow = findExistingEmployeeFlaggedRow(
        globalRows,
        prefillEmpId,
      );
      if (
        existingEmployeeRow?.ReleasedOn &&
        hasReleaseDatePassed(existingEmployeeRow.ReleasedOn)
      ) {
        props.Notify?.(
          "warn",
          "Validation",
          `This employee was available for allocation only until ${formatDate(existingEmployeeRow.ReleasedOn)} and cannot be allocated after the release date.`,
        );
        return;
      }

      const newEmployeeRow = findNewEmployeeFlaggedRow(
        globalRows,
        prefillEmpId,
      );
      if (newEmployeeRow) {
        const benchFromDate = formatDate(newEmployeeRow.AllocatedOn);
        props.Notify?.(
          "info",
          "New Employee",
          benchFromDate
            ? `This is a new employee who has been 100% on the bench from ${benchFromDate}.`
            : "This is a new employee who has been 100% on the bench.",
        );
        if (newEmployeeRow.AllocatedOn) {
          prefilledAllocatedOn = newEmployeeRow.AllocatedOn;
          minAllocatedOn = newEmployeeRow.AllocatedOn;
        }
      }
    }

    const initialForm: Partial<AllocationRow> = {
      EmployeeName: prefillName,
      EmployeeID: prefillEmpId,
      ProjectID: projectFullId,
      ProjectFullID: projectFullId,
      Loading: 1,
      AllocatedOn: prefilledAllocatedOn,
      ReleasedOn: null,
      BeginDate: null,
      EndDate: null,
      AllocationJson: [],
      Deployment: "",
    };
    setFormPickerPeople(prefillName ? [...searchPickerPeople] : []);
    setFormPickerKey((k) => k + 1);
    setNewEmployeeMinAllocatedOn(minAllocatedOn);
    setFormData(
      prefilledAllocatedOn ? recalcFormDerivedFields(initialForm) : initialForm,
    );
    setShowForm(true);
  };

  const handleAllocatedOnChange = (iso: string | null) => {
    if (
      newEmployeeMinAllocatedOn &&
      isAllocatedOnBeforeMinDate(iso, newEmployeeMinAllocatedOn)
    ) {
      props.Notify?.(
        "warn",
        "Validation",
        `Allocated On cannot be earlier than ${formatDate(newEmployeeMinAllocatedOn)}.`,
      );
      return;
    }
    handleFormChange("AllocatedOn", iso);
  };

  const handleFormChange = (field: keyof AllocationRow, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (
        field === "AllocatedOn" ||
        field === "ReleasedOn" ||
        field === "Loading"
      ) {
        return recalcFormDerivedFields(updated);
      }
      return updated;
    });
  };

  const handleFormSave = () => {
    const employeeName = formPickerPeople.length
      ? getPersonDisplayName(formPickerPeople[0])
      : (formData.EmployeeName || "").trim();
    const employeeId = (formData.EmployeeID || "").trim();

    if (!employeeId) {
      props.Notify?.("warn", "Validation", "Employee ID is required.");
      return;
    }
    if (!employeeName) {
      props.Notify?.("warn", "Validation", "Employee Name is required.");
      return;
    }
    if (employeeHasOpenApprovalRequest(employeeId)) {
      props.Notify?.("warn", "Validation", PENDING_APPROVAL_MESSAGE);
      return;
    }

    if (
      newEmployeeMinAllocatedOn &&
      isAllocatedOnBeforeMinDate(
        formData.AllocatedOn,
        newEmployeeMinAllocatedOn,
      )
    ) {
      props.Notify?.(
        "warn",
        "Validation",
        `Allocated On cannot be earlier than ${formatDate(newEmployeeMinAllocatedOn)}.`,
      );
      return;
    }

    const existingEmployeeRow = findExistingEmployeeFlaggedRow(
      globalRows,
      employeeId,
    );
    if (existingEmployeeRow?.ReleasedOn) {
      if (hasReleaseDatePassed(existingEmployeeRow.ReleasedOn)) {
        props.Notify?.(
          "warn",
          "Validation",
          `This employee was available for allocation only until ${formatDate(existingEmployeeRow.ReleasedOn)} and cannot be allocated after the release date.`,
        );
        return;
      }
      if (
        isAllocatedOnAfterReleaseDate(
          formData.AllocatedOn,
          existingEmployeeRow.ReleasedOn,
        )
      ) {
        props.Notify?.(
          "warn",
          "Validation",
          `This employee can only be allocated until ${formatDate(existingEmployeeRow.ReleasedOn)}. Please choose an Allocated On date on or before the release date.`,
        );
        return;
      }
    }

    if (!formData.AllocatedOn) {
      props.Notify?.("warn", "Validation", "Allocated On date is required.");
      return;
    }
    if (
      hasReleasedOnBeforeAllocatedOn(formData.AllocatedOn, formData.ReleasedOn)
    ) {
      props.Notify?.(
        "warn",
        "Validation",
        "Released On date must be greater than Allocated On date.",
      );
      return;
    }
    if ((formData.Loading ?? 0) > 1) {
      props.Notify?.(
        "warn",
        "Validation",
        "Loading cannot be greater than 100%.",
      );
      return;
    }
    if (
      hasSameProjectDateOverlap(
        employeeId,
        formData.AllocatedOn,
        formData.ReleasedOn,
      )
    ) {
      props.Notify?.(
        "warn",
        "Validation",
        "This employee already has an overlapping allocation on this project. Add a new allocation only after the previous one ends.",
      );
      return;
    }

    const overAllocatedMonths = getEmployeeOverAllocatedMonths(
      employeeId,
      formData.AllocationJson ?? [],
    );
    if (overAllocatedMonths.length > 0) {
      props.Notify?.(
        "warn",
        "Validation",
        `Total allocation across projects cannot exceed 100% for ${employeeName}. Over-allocated month(s): ${overAllocatedMonths.slice(0, 3).join(", ")}${overAllocatedMonths.length > 3 ? "..." : ""}.`,
      );
      return;
    }

    const loadingCapacityBreach = findCrossProjectLoadingCapacityBreach(
      globalRows,
      employeeId,
      formData.AllocatedOn,
      formData.ReleasedOn ?? null,
      formData.Loading ?? 0,
    );
    if (loadingCapacityBreach) {
      props.Notify?.(
        "warn",
        loadingCapacityBreach.alreadyAtMax
          ? "Maximum allocation"
          : "Validation",
        buildLoadingCapacityBreachMessage(
          employeeName,
          loadingCapacityBreach,
          formData.AllocatedOn,
          formData.ReleasedOn ?? null,
          formData.Loading ?? 0,
        ),
      );
      return;
    }

    let DeliveryHeadIds: number[] = JSON.parse(
      JSON.stringify(props?.selectedData?.DeliveryHead),
    )
      .map((user: any) => (user.id ? user?.id : user?.key))
      .sort((a: any, b: any) => a - b);

    const payload = {
      EmployeeName: employeeName,
      EmployeeID: formData.EmployeeID || "",
      ProjectId: projectLookupId,
      ProjectID: projectFullId,
      Loading: formData.Loading?.toString() ?? "1",
      AllocatedOn: formatDateForSp(formData.AllocatedOn),
      ReleasedOn: formatDateForSp(formData.ReleasedOn),
      BeginDate: formatDateForSp(formData.BeginDate),
      EndDate: formatDateForSp(formData.EndDate),
      AllocationJson: JSON.stringify(formData.AllocationJson || []),
      Deployment: formData.Deployment || "",
    };

    const approvalPayload = {
      RequestedBy: getRequestedByFromProjectManagers(
        props?.selectedData?.ProjectManager,
      ),
      EmployeeID: formData.EmployeeID || "",
      EmployeeName: employeeName,
      Loading: formData.Loading?.toString() ?? "1",
      FromDate: formatDateForSp(formData.AllocatedOn),
      ToDate: formatDateForSp(formData.ReleasedOn),
      ProjectName: projectTitle,
      ProjectID: projectFullId,
      DeliveryHeadId: { results: DeliveryHeadIds },
      Status: "Open",
      ProjectId: projectLookupId,
    };

    Promise.all([
      SPServices.SPAddItem({
        Listname: Config.ListNames.EmployeeAllocations,
        RequestJSON: payload,
      }),
      SPServices.SPAddItem({
        Listname: Config.ListNames.AllocationsApproval,
        RequestJSON: approvalPayload,
      }),
    ])
      .then(async () => {
        setShowForm(false);
        setFormData({});
        setNewEmployeeMinAllocatedOn(null);
        setFormPickerPeople([]);
        setFormPickerKey((k) => k + 1);
        try {
          const existingRecords: any[] = await SPServices.SPReadItems({
            Listname: Config.ListNames.EmployeeAllocations,
            Select: "ID,EmployeeID,NewEmployee",
            Filter: [
              {
                FilterKey: "EmployeeID",
                Operator: "eq",
                FilterValue: employeeId,
              },
            ],
          });
          const newEmployeeRecord = (existingRecords || []).find((item) =>
            isSpYesValue(item.NewEmployee),
          );
          if (newEmployeeRecord?.ID) {
            await SPServices.SPUpdateItem({
              Listname: Config.ListNames.EmployeeAllocations,
              ID: newEmployeeRecord.ID,
              RequestJSON: { NewEmployee: false },
            });
          }
        } catch (clearErr) {
          console.error("Failed to clear NewEmployee flag:", clearErr);
        }
        await syncBenchForEmployee(employeeId, employeeName);
        refreshData();
      })
      .catch((err: any) => {
        console.error(err);
        props.Notify?.(
          "error",
          "Error",
          "Failed to save allocation. Please try again.",
        );
      });
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setFormData({});
    setNewEmployeeMinAllocatedOn(null);
    setFormPickerPeople([]);
    setFormPickerKey((k) => k + 1);
  };

  const handleViewRow = (row: ConsolidatedAllocationRow) => {
    setViewConsolidatedRow(row);
  };

  const handleEditRow = (row: ConsolidatedAllocationRow) => {
    const rowProjectId = getRowProjectFullId(row);
    if (rowProjectId !== projectFullId) {
      props.Notify?.(
        "info",
        "Read only",
        "Allocations on other projects can only be viewed here. Open that project to edit.",
      );
      return;
    }
    if (editConsolidatedRow) {
      props.Notify?.(
        "warn",
        "Warning",
        "Save or cancel the current edit first.",
      );
      return;
    }
    const active = getActiveProjectAllocation(row.sourceTransactions);
    if (!active) {
      props.Notify?.(
        "warn",
        "Validation",
        "No active allocation found to edit.",
      );
      return;
    }
    const draftCopy = { ...active };
    editTransactionDraftRef.current = draftCopy;
    setEditTransactionDraft(draftCopy);
    setEditConsolidatedRow(row);
  };

  const handleCloseEditDialog = () => {
    editTransactionDraftRef.current = null;
    setEditTransactionDraft(null);
    setEditConsolidatedRow(null);
  };

  const updateEditTransactionDraft = (
    updater: (prev: AllocationRow) => AllocationRow,
  ) => {
    setEditTransactionDraft((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      editTransactionDraftRef.current = updated;
      return updated;
    });
  };

  const handleEditDialogSave = () => {
    const draft = editTransactionDraftRef.current;
    const rowId = draft?.ID;
    if (!draft || rowId == null) return;

    if (!draft.AllocatedOn) {
      props.Notify?.("warn", "Validation", "Allocated On date is required.");
      return;
    }
    if (hasReleasedOnBeforeAllocatedOn(draft.AllocatedOn, draft.ReleasedOn)) {
      props.Notify?.(
        "warn",
        "Validation",
        "Released On date must be greater than Allocated On date.",
      );
      return;
    }
    if ((draft.Loading ?? 0) > 1) {
      props.Notify?.(
        "warn",
        "Validation",
        "Loading cannot be greater than 100%.",
      );
      return;
    }
    if (
      hasSameProjectDateOverlap(
        draft.EmployeeID,
        draft.AllocatedOn,
        draft.ReleasedOn,
        rowId,
      )
    ) {
      props.Notify?.(
        "warn",
        "Validation",
        "This employee already has an overlapping allocation on this project. Keep allocations in the same project non-overlapping.",
      );
      return;
    }

    const overAllocatedMonths = getEmployeeOverAllocatedMonths(
      draft.EmployeeID,
      draft.AllocationJson ?? [],
      rowId,
    );
    if (overAllocatedMonths.length > 0) {
      props.Notify?.(
        "warn",
        "Validation",
        `Total allocation across projects cannot exceed 100% for ${draft.EmployeeName}. Over-allocated month(s): ${overAllocatedMonths.slice(0, 3).join(", ")}${overAllocatedMonths.length > 3 ? "..." : ""}.`,
      );
      return;
    }

    const loadingCapacityBreach = findCrossProjectLoadingCapacityBreach(
      globalRows,
      draft.EmployeeID,
      draft.AllocatedOn,
      draft.ReleasedOn ?? null,
      draft.Loading ?? 0,
      rowId,
    );
    if (loadingCapacityBreach) {
      props.Notify?.(
        "warn",
        loadingCapacityBreach.alreadyAtMax
          ? "Maximum allocation"
          : "Validation",
        buildLoadingCapacityBreachMessage(
          draft.EmployeeName,
          loadingCapacityBreach,
          draft.AllocatedOn,
          draft.ReleasedOn ?? null,
          draft.Loading ?? 0,
        ),
      );
      return;
    }

    const beginDate = computeBeginDate(draft.AllocatedOn);
    const endDate = computeEndDate(draft.AllocatedOn, draft.ReleasedOn);
    const allocationJson = draft.AllocationJson ?? [];

    const payload = {
      EmployeeName: draft.EmployeeName,
      EmployeeID: draft.EmployeeID || "",
      Loading: draft.Loading.toString(),
      AllocatedOn: formatDateForSp(draft.AllocatedOn),
      ReleasedOn: formatDateForSp(draft.ReleasedOn),
      BeginDate: formatDateForSp(beginDate),
      EndDate: formatDateForSp(endDate),
      AllocationJson: JSON.stringify(allocationJson),
      Deployment: draft.Deployment || "",
    };

    SPServices.SPUpdateItem({
      Listname: Config.ListNames.EmployeeAllocations,
      RequestJSON: payload,
      ID: rowId,
    })
      .then(async () => {
        handleCloseEditDialog();
        props.Notify?.(
          "success",
          "Success",
          "Allocation updated successfully.",
        );
        await syncBenchForEmployee(draft.EmployeeID, draft.EmployeeName);
        refreshData();
      })
      .catch((err: any) => {
        console.error(err);
        props.Notify?.(
          "error",
          "Error",
          "Failed to save allocation. Please try again.",
        );
      });
  };

  //  COLUMN RENDERERS
  const projectBody = (row: AllocationRow) => {
    const title = getAllocationProjectDisplayLabel(row);
    const isBenchRow = isBenchAllocationRecord(row);
    const onThisProject = countsAsOnCurrentProject(row);
    return (
      <div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: onThisProject || isBenchRow ? 600 : 400,
            color: isBenchRow
              ? "#0d900d"
              : onThisProject
                ? "#0b6e4f"
                : "#686766",
          }}
        >
          {title}
        </span>
        {onThisProject && (
          <span
            style={{
              display: "block",
              fontSize: "10px",
              color: "#0b6e4f",
              marginTop: "2px",
            }}
          >
            Current project
          </span>
        )}
      </div>
    );
  };

  const employeeBody = (row: AllocationRow) => {
    const name = row.EmployeeName || "-";
    const initials = name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    return (
      <div className={styles.employeeBadge}>
        <div className={styles.avatar}>{initials}</div>
        <span className={styles.name}>{name}</span>
      </div>
    );
  };

  const employeeIdBody = (row: ConsolidatedAllocationRow) => (
    <span style={{ fontSize: "12px", color: "#686766" }}>
      {row.EmployeeID || "-"}
    </span>
  );

  const monthBody = (month: string) => (row: ConsolidatedAllocationRow) => {
    const found = row.AllocationJson.find((m) => m.month === month);
    const val = found ? found.value : 0;
    const pct = Math.round(val * 100);

    if (pct === 0)
      return <span style={{ color: "#afafaf", fontSize: "12px" }}>—</span>;
    return (
      <span
        className={
          pct >= 100
            ? `${styles.monthChip} ${styles.over}`
            : pct >= 50
              ? `${styles.monthChip} ${styles.high}`
              : `${styles.monthChip} ${styles.medium}`
        }
      >
        {pct}%
      </span>
    );
  };

  const getStatusDisplayValue = (row: ConsolidatedAllocationRow): string => {
    const employeeId = String(row.EmployeeID ?? "").trim();
    const projectId = String(row.ProjectFullID ?? row.ProjectID ?? "").trim();

    const keyById = `${employeeId}::${projectId}`;
    const approvalStatus = approvalStatusByEmployeeProject[keyById] ?? "";
    const normalized = approvalStatus.trim().toLowerCase();

    if (normalized === "open") return "Locked";
    if (normalized === "approved") return "Approved";
    if (normalized === "reject") return "Reject";
    return "-";
  };

  const getStatusTagClass = (displayValue: string): string => {
    switch (displayValue) {
      case "Locked":
        return styles.statusLocked;
      case "Approved":
        return styles.statusApproved;
      case "Reject":
        return styles.statusRejected;
      default:
        return "";
    }
  };

  const statusBody = (row: ConsolidatedAllocationRow) => {
    const displayValue = getStatusDisplayValue(row);
    if (displayValue === "-") {
      return <span className={styles.statusEmpty}>-</span>;
    }
    return (
      <span
        className={`${styles.statusTag} ${getStatusTagClass(displayValue)}`}
      >
        {displayValue}
      </span>
    );
  };

  const getRowSearchableText = useCallback(
    (row: ConsolidatedAllocationRow): string => {
      const parts: string[] = [
        row.EmployeeName,
        row.EmployeeID,
        getAllocationProjectDisplayLabel(row),
        getStatusDisplayValue(row),
        formatDate(row.AllocatedOn),
        formatDate(row.ReleasedOn),
      ];

      row.AllocationJson.forEach((month) => {
        const pct = Math.round((month.value ?? 0) * 100);
        parts.push(month.month, `${pct}%`, String(pct));
      });

      if (countsAsOnCurrentProject(row)) {
        parts.push("Current project");
      }

      return parts
        .filter((part) => part && part !== "-")
        .join(" ")
        .toLowerCase();
    },
    [approvalStatusByEmployeeProject, countsAsOnCurrentProject],
  );

  const filteredConsolidatedDisplayRows = useMemo(() => {
    const term = tableSearchTerm.trim().toLowerCase();
    if (!term) return consolidatedDisplayRows;
    return consolidatedDisplayRows.filter((row) =>
      getRowSearchableText(row).includes(term),
    );
  }, [consolidatedDisplayRows, tableSearchTerm, getRowSearchableText]);

  const tableRowCountLabel = useMemo(() => {
    const total = consolidatedDisplayRows.length;
    const visible = filteredConsolidatedDisplayRows.length;
    const noun = visible !== 1 ? "employees" : "employee";
    const scope = selectedEmployeeId ? " across all projects" : "";

    if (tableSearchTerm.trim() && visible !== total) {
      return `${visible} of ${total} ${noun}${scope}`;
    }

    return `${visible} ${noun}${scope}`;
  }, [
    consolidatedDisplayRows.length,
    filteredConsolidatedDisplayRows.length,
    selectedEmployeeId,
    tableSearchTerm,
  ]);

  const allocatedOnBody = (row: ConsolidatedAllocationRow) => (
    <span style={{ fontSize: "12px", color: "#686766" }}>
      {formatDate(row.AllocatedOn)}
    </span>
  );

  const releasedOnBody = (row: ConsolidatedAllocationRow) => (
    <span style={{ fontSize: "12px", color: "#686766" }}>
      {formatDate(row.ReleasedOn)}
    </span>
  );

  const actionBody = (row: ConsolidatedAllocationRow) => {
    const onCurrentProject = countsAsOnCurrentProject(row);
    const canEdit = onCurrentProject && !selectedEmployeeId;

    return (
      <div style={{ display: "flex", gap: "4px" }}>
        <button
          className={`${styles.btnIcon} ${allocationDialogCss.view}`}
          title="View transactions"
          onClick={() => handleViewRow(row)}
        >
          <i className="pi pi-eye" style={{ fontSize: "13px" }}></i>
        </button>
        {canEdit ? (
          <button
            className={`${styles.btnIcon} ${styles.edit}`}
            title="Edit active allocation"
            onClick={() => handleEditRow(row)}
          >
            ✎
          </button>
        ) : null}
      </div>
    );
  };

  const monthFooter = (month: string) => () => {
    if (selectedEmployeeId) return null;
    const total = filteredConsolidatedDisplayRows.reduce((sum, row) => {
      if (isBenchAllocationRecord(row)) return sum;
      const found = row.AllocationJson.find((m) => m.month === month);
      return sum + (found ? found.value : 0);
    }, 0);
    const pct = Math.round(total * 100);
    return <span className={styles.totalChip}>{pct}%</span>;
  };

  const viewDialogMonthColumns = useMemo(() => {
    if (!viewConsolidatedRow) return monthColumns;
    const monthSet = new Set<string>();
    viewConsolidatedRow.sourceTransactions.forEach((row) =>
      row.AllocationJson.forEach((m) => monthSet.add(m.month)),
    );
    return Array.from(monthSet).sort(
      (a, b) => parseMonthLabel(a).getTime() - parseMonthLabel(b).getTime(),
    );
  }, [viewConsolidatedRow, monthColumns]);

  const webAbsoluteUrl =
    props?.spfxContext?._pageContext?._web?.absoluteUrl ?? "";

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.navBar}>
        <div
          className={styles.backBtn}
          onClick={() => {
            props.getTabContent(false);
            props.setActiveTab("");
          }}
        >
          <i className="pi pi-arrow-left" style={{ fontSize: "13px" }}></i>
        </div>
        <h2>
          Employee <span>Allocation</span>
          {projectTitle && (
            <div className={styles.projectMeta}>
              <span className={styles.projectLabel}>Project Name</span>
              <span title={projectTitle} className={styles.projectTitleChip}>
                {projectTitle.substring(0, 26)}
                {projectTitle.length > 26 ? "..." : ""}
              </span>
            </div>
          )}
        </h2>
      </div>

      <div className={styles.container}>
        <div className={styles.pickerCard}>
          <div className={styles.pickerLabel}>Search or select employee</div>
          <div className={styles.pickerInputWrapper}>
            {props?.spfxContext && (
              <div className={styles.peoplePicker}>
                <PeoplePicker
                  key={`search-${projectFullId}`}
                  ensureUser
                  personSelectionLimit={1}
                  context={props.spfxContext}
                  webAbsoluteUrl={webAbsoluteUrl}
                  defaultSelectedUsers={getPickerDefaultEmails(
                    searchPickerPeople,
                  )}
                  resolveDelay={100}
                  onChange={handleSearchPickerChange}
                  styles={peoplePickerStyles}
                />
              </div>
            )}
            <button className={styles.btnAdd} onClick={handleAddClick}>
              <i className="pi pi-plus" style={{ fontSize: "13px" }}></i> Add
              Resource
            </button>
          </div>

          {isPendingApproval && selectedEmployeeId && (
            <div className={styles.benchBadge} style={{ marginTop: 12 }}>
              <div className={styles.dot} style={{ background: "#aa1f1f" }} />
              <strong>{selectedEmployeeDisplayName}</strong>{" "}
              {PENDING_APPROVAL_MESSAGE}
            </div>
          )}

          {isAlreadyOnProject && selectedEmployeeId && !isPendingApproval && (
            <div className={styles.benchBadge} style={{ marginTop: 12 }}>
              <div className={styles.dot} style={{ background: "#aa1f1f" }} />
              <strong>{selectedEmployeeDisplayName}</strong> already has
              allocation record(s) on this project. You can add another
              allocation only for a non-overlapping period.
            </div>
          )}

          {isNewEmployee &&
            selectedEmployeeId &&
            !isAlreadyOnProject &&
            !isPendingApproval && (
              <div className={styles.benchBadge}>
                <div className={styles.dot} />
                This is a new employee and currently{" "}
                <strong>100% available on bench</strong>.
              </div>
            )}
        </div>

        {dashboard && selectedEmployeeId && (
          <>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                Employee Dashboard - {selectedEmployeeDisplayName}
              </div>
              <span style={{ fontSize: "12px", color: "#686766" }}>
                {consolidatedDisplayRows.length} employee
                {consolidatedDisplayRows.length !== 1 ? "s" : ""}
              </span>
            </div>
            <EmployeeAllocationDashboard dashboard={dashboard} css={styles} />
          </>
        )}

        {showForm && (
          <>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>Add resource form</div>
              <span style={{ fontSize: "12px", color: "#686766" }}>
                {consolidatedDisplayRows.length} employee
                {consolidatedDisplayRows.length !== 1 ? "s" : ""}
              </span>
            </div>
            <EmployeeAllocationNewFormPanel
              css={styles}
              formData={formData}
              formPickerKey={formPickerKey}
              webAbsoluteUrl={webAbsoluteUrl}
              context={props?.spfxContext}
              defaultSelectedEmails={getPickerDefaultEmails(formPickerPeople)}
              deploymentOptions={deploymentOptions}
              onPeopleChange={handleFormPickerChange}
              onLoadingPctChange={(fraction) =>
                handleFormChange("Loading", fraction)
              }
              onAllocatedOnIsoChange={handleAllocatedOnChange}
              allocatedOnMinDate={newEmployeeMinAllocatedOn}
              onReleasedOnIsoChange={(iso) =>
                handleFormChange("ReleasedOn", iso)
              }
              onDeploymentChange={(value) =>
                handleFormChange("Deployment", value)
              }
              onCancel={handleFormCancel}
              onSave={handleFormSave}
            />
          </>
        )}

        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            {selectedEmployeeId
              ? `All allocations for ${selectedEmployeeDisplayName}`
              : "Resource Allocations"}
          </div>
          <div className={styles.sectionHeaderActions}>
            <div className={styles.tableSearch}>
              <IconField iconPosition="left">
                <InputIcon className="pi pi-search" />
                <InputText
                  value={tableSearchTerm}
                  onChange={(e) => setTableSearchTerm(e.target.value)}
                  placeholder="Search table..."
                />
              </IconField>
            </div>
            <span style={{ fontSize: "12px", color: "#686766" }}>
              {tableRowCountLabel}
            </span>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {loading || globalLoading ? (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner} />
              Loading allocations…
            </div>
          ) : (
            <DataTable
              value={filteredConsolidatedDisplayRows}
              dataKey="consolidatedKey"
              className="EmployeeAllocationsDataTable"
              paginator={filteredConsolidatedDisplayRows.length > 8}
              rows={8}
              scrollable
              scrollHeight="600px"
              emptyMessage={
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📋</div>
                  <p>
                    {tableSearchTerm.trim()
                      ? "No allocations match your search."
                      : selectedEmployeeId
                        ? `No allocation records found for ${selectedEmployeeDisplayName}.`
                        : "No allocations found for this project."}
                  </p>
                </div>
              }
            >
              <Column
                header="Actions"
                body={actionBody}
                style={{ minWidth: "96px", width: "96px" }}
              />
              {selectedEmployeeId && (
                <Column
                  field="ProjectTitle"
                  header="Project"
                  body={projectBody}
                  style={{ minWidth: "200px" }}
                />
              )}
              <Column
                field="EmployeeName"
                header="Employee"
                body={employeeBody}
                style={{ minWidth: "180px" }}
              />
              <Column
                field="EmployeeID"
                header="Emp ID"
                body={employeeIdBody}
                style={{ minWidth: "90px" }}
              />
              <Column
                header="Status"
                body={statusBody}
                style={{ minWidth: "95px" }}
              />
              <Column
                field="AllocatedOn"
                header="Allocated On"
                body={allocatedOnBody}
                style={{ minWidth: "120px" }}
              />
              <Column
                field="ReleasedOn"
                header="Released On"
                body={releasedOnBody}
                style={{ minWidth: "120px" }}
              />
              {monthColumns.map((month) => (
                <Column
                  key={month}
                  header={month}
                  body={monthBody(month)}
                  footer={monthFooter(month)}
                  style={{ minWidth: "80px", textAlign: "center" }}
                />
              ))}
            </DataTable>
          )}

          {selectedEmployeeId && availabilitySummary && (
            <EmployeeAvailabilitySummaryPanel
              summary={availabilitySummary}
              css={styles}
            />
          )}
        </div>

        <EmployeeAllocationTransactionsDialog
          visible={!!viewConsolidatedRow}
          employeeName={viewConsolidatedRow?.EmployeeName ?? ""}
          projectLabel={
            viewConsolidatedRow
              ? getAllocationProjectDisplayLabel(viewConsolidatedRow)
              : ""
          }
          transactions={viewConsolidatedRow?.sourceTransactions ?? []}
          monthColumns={viewDialogMonthColumns}
          css={allocationDialogCss}
          onHide={() => setViewConsolidatedRow(null)}
        />

        <EmployeeAllocationEditDialog
          visible={!!editConsolidatedRow && !!editTransactionDraft}
          draft={editTransactionDraft}
          css={allocationDialogCss}
          deploymentOptions={deploymentOptions}
          onHide={handleCloseEditDialog}
          onSave={handleEditDialogSave}
          onLoadingChange={(fraction) =>
            updateEditTransactionDraft((prev) =>
              recalcDraftFromDates({ ...prev, Loading: fraction }),
            )
          }
          onAllocatedOnChange={(iso) =>
            updateEditTransactionDraft((prev) =>
              recalcDraftFromDates({ ...prev, AllocatedOn: iso }),
            )
          }
          onReleasedOnChange={(iso) =>
            updateEditTransactionDraft((prev) =>
              recalcDraftFromDates({ ...prev, ReleasedOn: iso }),
            )
          }
          onDeploymentChange={(value) =>
            updateEditTransactionDraft((prev) => ({
              ...prev,
              Deployment: value,
            }))
          }
        />
      </div>
    </div>
  );
};

export default EmployeeAllocations;
