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
import { InputNumber } from "primereact/inputnumber";
import { PeoplePicker } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import SPServices from "../../../../External/CommonServices/SPServices";
import {
  Config,
  peoplePickerStyles,
} from "../../../../External/CommonServices/Config";
import styles from "./EmployeeAllocations.module.scss";

import type {
  AllocationRow,
  DashboardStats,
} from "../../../../External/CommonServices/interface";

import {
  buildCalculatedAllocationJson,
  buildDateConflictMessage,
  computeBeginDate,
  computeDashboardStats,
  computeEmployeeAvailabilitySummary,
  computeEndDate,
  buildInternalRegistryEmailToEmpIdMap,
  DateInlineEditor,
  EmployeeAllocationDashboard,
  EmployeeAllocationNewFormPanel,
  EmployeeAvailabilitySummaryPanel,
  findCrossProjectDateConflicts,
  formatDate,
  formatDateForSp,
  getPersonDisplayName,
  getPersonEmail,
  getPickerDefaultEmails,
  lookupEmpIdByEmail,
  inlineDatePickerStyles,
  localDateToIso,
  mapSpItemToRow,
  employeeIdsMatch,
  parseMonthLabel,
  recalcDraftFromDates,
  recalcFormDerivedFields,
  stopTableCellEvent,
} from "../../../../External/CommonServices/CommonTemplate";

const PENDING_APPROVAL_MESSAGE =
  "This employee is currently locked because an allocation request is already under the approval process. A new allocation can only be added after the current request has been approved.";

const getRequestedByFromProjectManagers = (projectManagers: any[]): string => {
  if (!Array.isArray(projectManagers) || projectManagers.length === 0) {
    return "";
  }
  return projectManagers
    .map((pm) => String(pm?.name || pm?.text || "").trim())
    .filter(Boolean)
    .join(", ");
};

//  COMPONENT
const EmployeeAllocations = (props: any) => {
  console.log("EmployeeAllocations props", props);
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

  // Inline edit — ref mirrors state so Save always reads the latest draft
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<AllocationRow | null>(null);
  const editDraftRef = useRef<AllocationRow | null>(null);

  // Dynamic month columns for the DataTable
  const [monthColumns, setMonthColumns] = useState<string[]>([]);

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
      Listname: Config.ListNames.InternalRegistry,
      Select: "EmpID,EmpEmail",
    })
      .then((res: any[]) => {
        setRegistryByEmail(buildInternalRegistryEmailToEmpIdMap(res || []));
      })
      .catch((err: any) => {
        console.error("InternalRegistry fetch error:", err);
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
    editDraftRef.current = null;
    setEditingRowId(null);
    setEditDraft(null);
  }, [projectFullId]);

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
    const totals = buildEmployeeMonthlyTotals(employeeId, excludeRowId);
    candidateMonths.forEach((month) => {
      totals.set(
        month.month,
        (totals.get(month.month) ?? 0) + (month.value ?? 0),
      );
    });
    return Array.from(totals.entries())
      .filter(([, value]) => value > 1 + 0.00001)
      .map(([month]) => month)
      .sort(
        (a, b) => parseMonthLabel(a).getTime() - parseMonthLabel(b).getTime(),
      );
  };

  const isLatestAllocationRowForEmployee = useCallback(
    (row: AllocationRow): boolean => {
      const employeeRows = globalRows.filter((r) =>
        employeeIdsMatch(r.EmployeeID, row.EmployeeID),
      );
      if (employeeRows.length === 0) return false;

      const sorted = [...employeeRows].sort((a, b) => {
        const aTime = a.AllocatedOn ? new Date(a.AllocatedOn).getTime() : 0;
        const bTime = b.AllocatedOn ? new Date(b.AllocatedOn).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        return (b.ID ?? 0) - (a.ID ?? 0);
      });

      return sorted[0]?.ID === row.ID;
    },
    [globalRows],
  );

  // Recompute dashboard when data or selection changes (cross-project stats)
  useEffect(() => {
    if (!selectedEmployeeId) return;

    const employeeRows = globalRows.filter((r) =>
      employeeIdsMatch(r.EmployeeID, selectedEmployeeId),
    );
    const projectRows = allRows.filter((r) =>
      employeeIdsMatch(r.EmployeeID, selectedEmployeeId),
    );

    setIsAlreadyOnProject(projectRows.length > 0);
    setIsNewEmployee(employeeRows.length === 0);
    setDashboard(
      employeeRows.length > 0 ? computeDashboardStats(employeeRows) : null,
    );
  }, [globalRows, allRows, selectedEmployeeId]);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setIsPendingApproval(false);
      return;
    }

    setIsPendingApproval(employeeHasOpenApprovalRequest(selectedEmployeeId));
  }, [selectedEmployeeId, employeeHasOpenApprovalRequest]);

  // Month columns follow whichever rows are shown in the table
  useEffect(() => {
    const rowsForMonths = selectedEmployeeId
      ? globalRows.filter((r) =>
          employeeIdsMatch(r.EmployeeID, selectedEmployeeId),
        )
      : allRows;
    refreshMonthColumns(rowsForMonths);
  }, [selectedEmployeeId, globalRows, allRows]);

  const availabilitySummary = useMemo(() => {
    if (!selectedEmployeeId) return null;
    const employeeRows = globalRows.filter((r) =>
      employeeIdsMatch(r.EmployeeID, selectedEmployeeId),
    );
    return computeEmployeeAvailabilitySummary(employeeRows);
  }, [selectedEmployeeId, globalRows]);

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
    setFormData((prev) => ({ ...prev, EmployeeName: name, EmployeeID: empId }));
  };

  //  ADD NEW ROW (form-based)
  const handleAddClick = () => {
    if (isAnyRowEditing()) {
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

    const initialForm: Partial<AllocationRow> = {
      EmployeeName: prefillName,
      EmployeeID: prefillEmpId,
      ProjectID: projectFullId,
      ProjectFullID: projectFullId,
      Loading: 1,
      AllocatedOn: null,
      ReleasedOn: null,
      BeginDate: null,
      EndDate: null,
      AllocationJson: [],
    };
    setFormPickerPeople(prefillName ? [...searchPickerPeople] : []);
    setFormPickerKey((k) => k + 1);
    setFormData(initialForm);
    setShowForm(true);
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

    const dateConflicts = findCrossProjectDateConflicts(
      globalRows,
      employeeId,
      formData.AllocatedOn,
      formData.ReleasedOn ?? null,
      projectFullId,
    );
    if (dateConflicts.length > 0) {
      props.Notify?.(
        "warn",
        "Date conflict",
        buildDateConflictMessage(
          dateConflicts,
          formData.AllocatedOn,
          formData.ReleasedOn ?? null,
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
      .then(() => {
        setShowForm(false);
        setFormData({});
        setFormPickerPeople([]);
        setFormPickerKey((k) => k + 1);
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
    setFormPickerPeople([]);
    setFormPickerKey((k) => k + 1);
  };

  //  INLINE TABLE EDITING
  const isAnyRowEditing = () =>
    editingRowId !== null || allRows.some((r) => r.isNewRow);

  const getRowDraft = (row: AllocationRow): AllocationRow | null => {
    if (editingRowId === row.ID && editDraft) return editDraft;
    return null;
  };

  const updateEditDraft = (updater: (prev: AllocationRow) => AllocationRow) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      editDraftRef.current = updated;
      return updated;
    });
  };

  const handleEditRow = (rowData: AllocationRow) => {
    if (!isCurrentProjectRow(rowData)) {
      props.Notify?.(
        "info",
        "Read only",
        "Allocations on other projects can only be viewed here. Open that project to edit.",
      );
      return;
    }
    if (isAnyRowEditing()) {
      props.Notify?.(
        "warn",
        "Warning",
        "Save or cancel the current edit first.",
      );
      return;
    }
    if (!isLatestAllocationRowForEmployee(rowData)) {
      props.Notify?.(
        "info",
        "Read only",
        "Only the employee's current allocation can be edited. Earlier allocations are view only.",
      );
      return;
    }
    const draftCopy = { ...rowData };
    editDraftRef.current = draftCopy;
    setEditingRowId(rowData.ID);
    setEditDraft(draftCopy);
    setAllRows((prev) =>
      prev.map((r) => (r.ID === rowData.ID ? { ...r, isEditing: true } : r)),
    );
  };

  const handleCancelRow = (rowData: AllocationRow) => {
    const id = rowData.ID;
    editDraftRef.current = null;
    setEditingRowId(null);
    setEditDraft(null);
    setAllRows((prev) =>
      prev.map((r) => (r.ID === id ? { ...r, isEditing: false } : r)),
    );
  };

  const handleSaveRow = (rowData: AllocationRow) => {
    const draft = editingRowId === rowData.ID ? editDraftRef.current : null;
    if (!draft) return;

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
        rowData.ID,
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
      rowData.ID,
    );
    if (overAllocatedMonths.length > 0) {
      props.Notify?.(
        "warn",
        "Validation",
        `Total allocation across projects cannot exceed 100% for ${draft.EmployeeName}. Over-allocated month(s): ${overAllocatedMonths.slice(0, 3).join(", ")}${overAllocatedMonths.length > 3 ? "..." : ""}.`,
      );
      return;
    }

    const dateConflicts = findCrossProjectDateConflicts(
      globalRows,
      draft.EmployeeID,
      draft.AllocatedOn,
      draft.ReleasedOn ?? null,
      projectFullId,
      rowData.ID,
    );
    if (dateConflicts.length > 0) {
      props.Notify?.(
        "warn",
        "Date conflict",
        buildDateConflictMessage(
          dateConflicts,
          draft.AllocatedOn,
          draft.ReleasedOn ?? null,
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
    };

    SPServices.SPUpdateItem({
      Listname: Config.ListNames.EmployeeAllocations,
      RequestJSON: payload,
      ID: rowData.ID,
    })
      .then(() => {
        editDraftRef.current = null;
        setEditingRowId(null);
        setEditDraft(null);
        setAllRows((prev) =>
          prev.map((r) =>
            r.ID === rowData.ID ? { ...r, isEditing: false } : r,
          ),
        );
        props.Notify?.(
          "success",
          "Success",
          "Allocation updated successfully.",
        );
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

  const handleInlineMonthChange = (month: string, value: number | null) => {
    const frac = value ?? 0;
    updateEditDraft((prev) => {
      const hasMonth = prev.AllocationJson.some((m) => m.month === month);
      const AllocationJson = hasMonth
        ? prev.AllocationJson.map((m) =>
            m.month === month ? { ...m, value: frac } : m,
          )
        : [...prev.AllocationJson, { month, value: frac }].sort(
            (a, b) =>
              parseMonthLabel(a.month).getTime() -
              parseMonthLabel(b.month).getTime(),
          );
      return { ...prev, AllocationJson };
    });
  };

  const handleInlineLoadingChange = (loading: number | null) => {
    updateEditDraft((prev) => {
      const newLoading = loading ?? 0;
      const begin = prev.BeginDate ? new Date(prev.BeginDate) : null;
      const end = prev.EndDate ? new Date(prev.EndDate) : null;
      if (!begin || !end) return { ...prev, Loading: newLoading };
      const newJson = buildCalculatedAllocationJson(newLoading, begin, end);
      return { ...prev, Loading: newLoading, AllocationJson: newJson };
    });
  };

  const handleEditAllocatedOnChange = (date: Date | null | undefined) => {
    updateEditDraft((prev) =>
      recalcDraftFromDates({
        ...prev,
        AllocatedOn: localDateToIso(date ?? null),
      }),
    );
  };

  const handleEditReleasedOnChange = (date: Date | null | undefined) => {
    updateEditDraft((prev) =>
      recalcDraftFromDates({
        ...prev,
        ReleasedOn: localDateToIso(date ?? null),
      }),
    );
  };

  //  COLUMN RENDERERS
  const projectBody = (row: AllocationRow) => {
    const title =
      row.ProjectTitle?.trim() ||
      row.ProjectFullID?.trim() ||
      row.ProjectID ||
      "-";
    const onThisProject = isCurrentProjectRow(row);
    return (
      <div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: onThisProject ? 600 : 400,
            color: onThisProject ? "#0b6e4f" : "#686766",
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

  const employeeIdBody = (row: AllocationRow) => {
    const draft = getRowDraft(row);
    const employeeId =
      draft && editingRowId === row.ID ? draft.EmployeeID : row.EmployeeID;
    return (
      <span
        style={{
          fontSize: "12px",
          color: "#686766",
        }}
      >
        {employeeId || "-"}
      </span>
    );
  };

  const loadingBody = (row: AllocationRow) => {
    const draft = getRowDraft(row);
    if (draft) {
      return (
        <InputNumber
          key={`loading-${row.ID}`}
          value={(draft.Loading ?? 0) * 100}
          onValueChange={(e) => handleInlineLoadingChange((e.value ?? 0) / 100)}
          suffix="%"
          min={0}
          max={100}
          minFractionDigits={0}
          maxFractionDigits={0}
          style={{ width: "80px" }}
        />
      );
    }
    const pct = Math.round((row.Loading ?? 0) * 100);
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

  const dateBody =
    (field: "AllocatedOn" | "ReleasedOn" | "BeginDate" | "EndDate") =>
    (row: AllocationRow) => {
      const draft = getRowDraft(row);
      if (draft && editingRowId === row.ID && field === "AllocatedOn") {
        return (
          <div
            className={styles.inlineEditorCell}
            onMouseDown={stopTableCellEvent}
            onClick={stopTableCellEvent}
          >
            <DateInlineEditor
              rowId={row.ID}
              initialIso={draft.AllocatedOn}
              onDateChange={handleEditAllocatedOnChange}
              pickerStyles={inlineDatePickerStyles}
            />
          </div>
        );
      }
      if (draft && editingRowId === row.ID && field === "ReleasedOn") {
        return (
          <div
            className={styles.inlineEditorCell}
            onMouseDown={stopTableCellEvent}
            onClick={stopTableCellEvent}
          >
            <DateInlineEditor
              rowId={row.ID}
              initialIso={draft.ReleasedOn}
              onDateChange={handleEditReleasedOnChange}
              pickerStyles={inlineDatePickerStyles}
            />
          </div>
        );
      }
      return (
        <span style={{ fontSize: "12px", color: "#686766" }}>
          {formatDate(row[field] as string)}
        </span>
      );
    };

  const monthBody = (month: string) => (row: AllocationRow) => {
    const draft = getRowDraft(row);
    if (draft) {
      const found = draft.AllocationJson.find((m) => m.month === month);
      return (
        <InputNumber
          key={`month-${row.ID}-${month}`}
          value={found ? parseFloat((found.value * 100).toFixed(1)) : 0}
          onValueChange={(e) =>
            handleInlineMonthChange(month, (e.value ?? 0) / 100)
          }
          suffix="%"
          min={0}
          max={100}
          minFractionDigits={0}
          maxFractionDigits={1}
          style={{ width: "72px" }}
        />
      );
    }

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

  const getStatusDisplayValue = (row: AllocationRow): string => {
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

  const statusBody = (row: AllocationRow) => {
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

  const actionBody = (row: AllocationRow) => {
    if (selectedEmployeeId) {
      return (
        <span style={{ fontSize: "11px", color: "#afafaf" }} title="View only">
          -
        </span>
      );
    }
    if (row.isEditing) {
      return (
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            className={`${styles.btnIcon} ${styles.save}`}
            title="Save"
            onClick={() => handleSaveRow(row)}
          >
            ✓
          </button>
          <button
            className={`${styles.btnIcon} ${styles.cancel}`}
            title="Cancel"
            onClick={() => handleCancelRow(row)}
          >
            ✕
          </button>
        </div>
      );
    }
    if (!isCurrentProjectRow(row)) {
      return (
        <span style={{ fontSize: "11px", color: "#afafaf" }} title="View only">
          -
        </span>
      );
    }
    if (!isLatestAllocationRowForEmployee(row)) {
      return (
        <span
          style={{ fontSize: "11px", color: "#afafaf" }}
          title="Only the employee's current allocation is editable"
        >
          view only
        </span>
      );
    }
    return (
      <button
        className={`${styles.btnIcon} ${styles.edit}`}
        title="Edit"
        onClick={() => handleEditRow(row)}
      >
        ✎
      </button>
    );
  };

  const monthFooter = (month: string) => () => {
    if (selectedEmployeeId) return null;
    const total = allRows.reduce((sum, row) => {
      const found = row.AllocationJson.find((m) => m.month === month);
      return sum + (found ? found.value : 0);
    }, 0);
    const pct = Math.round(total * 100);
    return <span className={styles.totalChip}>{pct}%</span>;
  };

  const displayRows = useMemo(() => {
    if (!selectedEmployeeId) return allRows;

    const employeeRows = globalRows.filter((r) =>
      employeeIdsMatch(r.EmployeeID, selectedEmployeeId),
    );
    return [...employeeRows].sort((a, b) => {
      const byProject = (a.ProjectTitle || a.ProjectFullID || "").localeCompare(
        b.ProjectTitle || b.ProjectFullID || "",
      );
      if (byProject !== 0) return byProject;
      const aTime = a.AllocatedOn ? new Date(a.AllocatedOn).getTime() : 0;
      const bTime = b.AllocatedOn ? new Date(b.AllocatedOn).getTime() : 0;
      return bTime - aTime;
    });
  }, [selectedEmployeeId, globalRows, allRows]);

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
                {displayRows.length} record{displayRows.length !== 1 ? "s" : ""}
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
                {displayRows.length} record{displayRows.length !== 1 ? "s" : ""}
              </span>
            </div>
            <EmployeeAllocationNewFormPanel
              css={styles}
              formData={formData}
              formPickerKey={formPickerKey}
              webAbsoluteUrl={webAbsoluteUrl}
              context={props?.spfxContext}
              defaultSelectedEmails={getPickerDefaultEmails(formPickerPeople)}
              onPeopleChange={handleFormPickerChange}
              onLoadingPctChange={(fraction) =>
                handleFormChange("Loading", fraction)
              }
              onAllocatedOnIsoChange={(iso) =>
                handleFormChange("AllocatedOn", iso)
              }
              onReleasedOnIsoChange={(iso) =>
                handleFormChange("ReleasedOn", iso)
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
          <span style={{ fontSize: "12px", color: "#686766" }}>
            {displayRows.length} record{displayRows.length !== 1 ? "s" : ""}
            {selectedEmployeeId ? " across all projects" : ""}
          </span>
        </div>

        <div className={styles.tableWrapper}>
          {loading || globalLoading ? (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner} />
              Loading allocations…
            </div>
          ) : (
            <DataTable
              value={displayRows}
              dataKey="ID"
              className="EmployeeAllocationsDataTable"
              paginator={displayRows.length > 8}
              rows={8}
              scrollable
              scrollHeight="600px"
              rowClassName={(row: AllocationRow) =>
                row.isEditing ? styles.editingRow : ""
              }
              emptyMessage={
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📋</div>
                  <p>
                    {selectedEmployeeId
                      ? `No allocation records found for ${selectedEmployeeDisplayName}.`
                      : "No allocations found for this project."}
                  </p>
                </div>
              }
            >
              <Column
                header="Actions"
                body={actionBody}
                style={{ minWidth: "80px", width: "80px" }}
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
                field="Loading"
                header="Loading %"
                body={loadingBody}
                style={{ minWidth: "100px" }}
              />
              <Column
                field="AllocatedOn"
                header="Allocated On"
                body={dateBody("AllocatedOn")}
                style={{ minWidth: "142px" }}
              />
              <Column
                field="ReleasedOn"
                header="Released On"
                body={dateBody("ReleasedOn")}
                style={{ minWidth: "142px" }}
              />
              <Column
                field="BeginDate"
                header="Begin Date"
                body={dateBody("BeginDate")}
                style={{ minWidth: "120px" }}
              />
              <Column
                field="EndDate"
                header="End Date"
                body={dateBody("EndDate")}
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
      </div>
    </div>
  );
};

export default EmployeeAllocations;
