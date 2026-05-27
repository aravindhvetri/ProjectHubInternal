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
  DateInlineEditor,
  EmployeeAllocationDashboard,
  EmployeeAllocationNewFormPanel,
  EmployeeAvailabilitySummaryPanel,
  EmpIdInlineEditor,
  findCrossProjectDateConflicts,
  formatDate,
  formatDateForSp,
  getPersonDisplayName,
  getPickerDefaultEmails,
  inlineDatePickerStyles,
  inlineTextFieldStyles,
  localDateToIso,
  mapSpItemToRow,
  namesMatch,
  parseMonthLabel,
  recalcDraftFromDates,
  recalcFormDerivedFields,
  stopTableCellEvent,
} from "../../../../External/CommonServices/CommonTemplate";

//  COMPONENT
const EmployeeAllocations = (props: any) => {
  // ── State ────────────────────────────────────────────────────
  const [allRows, setAllRows] = useState<AllocationRow[]>([]);
  const [globalRows, setGlobalRows] = useState<AllocationRow[]>([]);
  const [loading, setLoading] = useState(true);

  // People Picker (search + form)
  const [searchPickerPeople, setSearchPickerPeople] = useState<any[]>([]);
  const [formPickerPeople, setFormPickerPeople] = useState<any[]>([]);
  const [formPickerKey, setFormPickerKey] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [isNewEmployee, setIsNewEmployee] = useState(false);
  const [isAlreadyOnProject, setIsAlreadyOnProject] = useState(false);

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
    SPServices.SPReadItems({
      Listname: Config.ListNames.EmployeeAllocations,
      Select:
        "*,Project/Id,Project/Title,Project/ProjectID,Project/ProjectName",
      Expand: "Project",
      Orderby: "EmployeeName",
      Orderbydecorasc: true,
    })
      .then((res: any[]) => {
        const rows: AllocationRow[] = (res || []).map((item: any) =>
          mapSpItemToRow(item, projectFullId, projectTitle),
        );
        setGlobalRows(rows);
      })
      .catch((err: any) => {
        console.error("Global fetch error:", err);
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
      Orderby: "EmployeeName",
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

  const refreshData = useCallback(() => {
    fetchAllocations();
    fetchGlobalAllocations();
  }, [fetchAllocations, fetchGlobalAllocations]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const clearEmployeeSearch = () => {
    setSearchPickerPeople([]);
    setSelectedEmployee(null);
    setIsNewEmployee(false);
    setIsAlreadyOnProject(false);
    setDashboard(null);
  };

  useEffect(() => {
    clearEmployeeSearch();
    editDraftRef.current = null;
    setEditingRowId(null);
    setEditDraft(null);
  }, [projectFullId]);

  const isEmployeeOnProject = useCallback(
    (employeeName: string) =>
      allRows.some((r) => namesMatch(r.EmployeeName, employeeName)),
    [allRows],
  );

  // Recompute dashboard when data or selection changes (cross-project stats)
  useEffect(() => {
    if (!selectedEmployee) return;

    const employeeRows = globalRows.filter((r) =>
      namesMatch(r.EmployeeName, selectedEmployee),
    );
    const projectRows = allRows.filter((r) =>
      namesMatch(r.EmployeeName, selectedEmployee),
    );

    setIsAlreadyOnProject(projectRows.length > 0);
    setIsNewEmployee(employeeRows.length === 0);
    setDashboard(
      employeeRows.length > 0 ? computeDashboardStats(employeeRows) : null,
    );
  }, [globalRows, allRows, selectedEmployee]);

  // Month columns follow whichever rows are shown in the table
  useEffect(() => {
    const rowsForMonths = selectedEmployee
      ? globalRows.filter((r) => namesMatch(r.EmployeeName, selectedEmployee))
      : allRows;
    refreshMonthColumns(rowsForMonths);
  }, [selectedEmployee, globalRows, allRows]);

  const availabilitySummary = useMemo(() => {
    if (!selectedEmployee) return null;
    const employeeRows = globalRows.filter((r) =>
      namesMatch(r.EmployeeName, selectedEmployee),
    );
    return computeEmployeeAvailabilitySummary(employeeRows);
  }, [selectedEmployee, globalRows]);

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

    const name = getPersonDisplayName(items[0]);
    if (!name) {
      clearEmployeeSearch();
      return;
    }

    setSearchPickerPeople(items);
    setSelectedEmployee(name);
  };

  const handleFormPickerChange = (items: any[]) => {
    setFormPickerPeople(items);
    const name = items?.length ? getPersonDisplayName(items[0]) : "";
    setFormData((prev) => ({ ...prev, EmployeeName: name }));
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

    const prefillName = selectedEmployee || "";
    if (prefillName && isEmployeeOnProject(prefillName)) {
      props.Notify?.(
        "warn",
        "Warning",
        "This employee is already assigned to this project. Each person can only be added once per project.",
      );
      return;
    }

    const initialForm: Partial<AllocationRow> = {
      EmployeeName: prefillName,
      EmployeeID: "",
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

    if (!employeeName) {
      props.Notify?.("warn", "Validation", "Employee Name is required.");
      return;
    }
    if (isEmployeeOnProject(employeeName)) {
      props.Notify?.(
        "warn",
        "Validation",
        "This employee is already assigned to this project. Each person can only be added once per project.",
      );
      return;
    }
    if (!formData.AllocatedOn) {
      props.Notify?.("warn", "Validation", "Allocated On date is required.");
      return;
    }

    const dateConflicts = findCrossProjectDateConflicts(
      globalRows,
      employeeName,
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

    SPServices.SPAddItem({
      Listname: Config.ListNames.EmployeeAllocations,
      RequestJSON: payload,
    })
      .then(() => {
        setShowForm(false);
        setFormData({});
        setFormPickerPeople([]);
        setFormPickerKey((k) => k + 1);
        refreshData();
      })
      .catch((err: any) => {
        console.error(err);
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

    const dateConflicts = findCrossProjectDateConflicts(
      globalRows,
      draft.EmployeeName,
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

  const handleEditEmployeeIdChange = (value: string) => {
    updateEditDraft((prev) => ({ ...prev, EmployeeID: value }));
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
    if (draft && editingRowId === row.ID) {
      return (
        <div
          className={styles.inlineEditorCell}
          onMouseDown={stopTableCellEvent}
          onClick={stopTableCellEvent}
        >
          <EmpIdInlineEditor
            rowId={row.ID}
            initialValue={draft.EmployeeID || ""}
            onValueChange={handleEditEmployeeIdChange}
            fieldStyles={inlineTextFieldStyles}
          />
        </div>
      );
    }
    return (
      <span
        style={{
          fontSize: "12px",
          color: "#686766",
        }}
      >
        {row.EmployeeID || "-"}
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

  const actionBody = (row: AllocationRow) => {
    if (selectedEmployee) {
      return (
        <span style={{ fontSize: "11px", color: "#afafaf" }} title="View only">
          —
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
    if (selectedEmployee) return null;
    const total = allRows.reduce((sum, row) => {
      const found = row.AllocationJson.find((m) => m.month === month);
      return sum + (found ? found.value : 0);
    }, 0);
    const pct = Math.round(total * 100);
    return <span className={styles.totalChip}>{pct}%</span>;
  };

  const displayRows = useMemo(() => {
    if (!selectedEmployee) return allRows;

    const employeeRows = globalRows.filter((r) =>
      namesMatch(r.EmployeeName, selectedEmployee),
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
  }, [selectedEmployee, globalRows, allRows]);

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
            <span
              style={{
                fontSize: "14px",
                color: "#686766",
                fontWeight: 400,
                marginLeft: "12px",
              }}
            >
              - {projectTitle}
            </span>
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
            <button
              className={styles.btnAdd}
              onClick={handleAddClick}
              disabled={!!(selectedEmployee && isAlreadyOnProject)}
              title={
                selectedEmployee && isAlreadyOnProject
                  ? "Employee is already assigned to this project"
                  : undefined
              }
            >
              <i className="pi pi-plus" style={{ fontSize: "13px" }}></i> Add
              Resource
            </button>
          </div>

          {isAlreadyOnProject && selectedEmployee && (
            <div className={styles.benchBadge} style={{ marginTop: 12 }}>
              <div className={styles.dot} style={{ background: "#aa1f1f" }} />
              <strong>{selectedEmployee}</strong> is already assigned to this
              project. Edit the existing allocation or set a release date
              instead of adding again.
            </div>
          )}

          {isNewEmployee && selectedEmployee && !isAlreadyOnProject && (
            <div className={styles.benchBadge}>
              <div className={styles.dot} />
              This is a new employee and currently{" "}
              <strong>100% available on bench</strong>.
            </div>
          )}
        </div>

        {dashboard && selectedEmployee && (
          <>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                Employee Dashboard - {selectedEmployee}
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
              onEmployeeIdChange={(value) =>
                handleFormChange("EmployeeID", value)
              }
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
            {selectedEmployee
              ? `All allocations for ${selectedEmployee}`
              : "Resource Allocations"}
          </div>
          <span style={{ fontSize: "12px", color: "#686766" }}>
            {displayRows.length} record{displayRows.length !== 1 ? "s" : ""}
            {selectedEmployee ? " across all projects" : ""}
          </span>
        </div>

        <div className={styles.tableWrapper}>
          {loading ? (
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
                    {selectedEmployee
                      ? `No allocation records found for ${selectedEmployee}.`
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
              {selectedEmployee && (
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

          {selectedEmployee && availabilitySummary && (
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
