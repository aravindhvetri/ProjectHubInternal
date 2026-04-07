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
import { useEffect, useState } from "react";
import SPServices from "../../../../External/CommonServices/SPServices";
import {
  Config,
  RefreshButton,
} from "../../../../External/CommonServices/Config";
import styles from "../MainComponenet.module.scss";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { PrimaryButton } from "@fluentui/react";
import { Label } from "@fluentui/react";
import Loading from "../../../../External/Loader/Loading";

// ─── MonthPicker (unchanged) ──────────────────────────────────────────────────

interface MonthPickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  enabledKeys: string[];
  minKey?: string;
  maxKey?: string;
}

const MonthPicker: React.FC<MonthPickerProps> = ({
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

// ─── BenchReport ──────────────────────────────────────────────────────────────

const BenchReport = () => {
  const ImportUploadImage: string = require("../../../../External/Images/fileupload.png");
  const FilterImage: string = require("../../../../External/Images/filter.png");
  const FilterNoneImage: string = require("../../../../External/Images/filternone.png");
  const ScreenWidth: number = window.innerWidth;

  const [employeePartialAllocationData, setEmployeePartialAllocationData] =
    React.useState<any[]>([]);
  const [
    masterEmployeePartialAllocationData,
    setMasterEmployeePartialAllocationData,
  ] = React.useState<any[]>([]);
  const [monthColumns, setMonthColumns] = React.useState<string[]>([]);
  const [searchVal, setSearchVal] = React.useState<string>("");
  const [loader, setLoader] = React.useState<boolean>(false);
  const [filterVisible, setFilterVisible] = useState<boolean>(false);

  // ── Temp filter states ────────────────────────────────────────────────────
  const [tempEmpFilter, setTempEmpFilter] = useState<string>("");
  const [tempEmpTags, setTempEmpTags] = useState<string[]>([]);
  const [tempFrom, setTempFrom] = useState<string>("");
  const [tempTo, setTempTo] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");
  // InternalRegistry filter temps
  const [tempDesignation, setTempDesignation] = useState<string>("");
  const [tempFunction, setTempFunction] = useState<string>("");
  const [tempReportingManager, setTempReportingManager] = useState<string>("");
  const [tempTechnology, setTempTechnology] = useState<string>("");

  // ── Applied filter states ─────────────────────────────────────────────────
  const [appliedEmpTags, setAppliedEmpTags] = useState<string[]>([]);
  const [appliedFrom, setAppliedFrom] = useState<string>("");
  const [appliedTo, setAppliedTo] = useState<string>("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  // InternalRegistry applied filters
  const [appliedDesignation, setAppliedDesignation] = useState<string>("");
  const [appliedFunction, setAppliedFunction] = useState<string>("");
  const [appliedReportingManager, setAppliedReportingManager] =
    useState<string>("");
  const [appliedTechnology, setAppliedTechnology] = useState<string>("");

  // ── Open modal ────────────────────────────────────────────────────────────
  const openFilterModal = () => {
    setTempEmpFilter("");
    setTempEmpTags([...appliedEmpTags]);
    setTempFrom(appliedFrom);
    setTempTo(appliedTo);
    setDateError("");
    setTempDesignation(appliedDesignation);
    setTempFunction(appliedFunction);
    setTempReportingManager(appliedReportingManager);
    setTempTechnology(appliedTechnology);
    setFilterVisible(true);
  };

  // ── Date change handlers (unchanged) ─────────────────────────────────────
  const handleTempFromChange = (val: string) => {
    setTempFrom(val);
    if (
      val &&
      tempTo &&
      Config.colKeyToDate(tempTo) < Config.colKeyToDate(val)
    ) {
      setDateError("'To' month cannot be earlier than 'From' month.");
    } else {
      setDateError("");
    }
  };

  const handleTempToChange = (val: string) => {
    setTempTo(val);
    if (
      tempFrom &&
      val &&
      Config.colKeyToDate(val) < Config.colKeyToDate(tempFrom)
    ) {
      setDateError("'To' month cannot be earlier than 'From' month.");
    } else {
      setDateError("");
    }
  };

  // ── Tag input: add on Enter (unchanged) ───────────────────────────────────
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = tempEmpFilter.trim();
      if (val && !tempEmpTags.includes(val)) {
        setTempEmpTags((prev) => [...prev, val]);
      }
      setTempEmpFilter("");
    }
  };

  const removeTag = (tag: string) => {
    setTempEmpTags((prev) => prev.filter((t) => t !== tag));
  };

  // ── Apply filters ─────────────────────────────────────────────────────────
  const applyFilters = (
    data: any[],
    empTags: string[],
    from: string,
    to: string,
    allCols: string[],
    designation: string = "",
    func: string = "",
    reportingManager: string = "",
    technology: string = "",
  ) => {
    let filtered = data;

    // Employee tag filter (unchanged)
    if (empTags.length > 0) {
      filtered = data.filter((item) =>
        empTags.some(
          (tag) =>
            item.EmployeeID?.toLowerCase().includes(tag.toLowerCase()) ||
            item.EmployeeName?.toLowerCase().includes(tag.toLowerCase()),
        ),
      );
    }

    // InternalRegistry — Designation
    if (designation.trim()) {
      filtered = filtered.filter((item) =>
        item.Designation?.toLowerCase().includes(
          designation.trim().toLowerCase(),
        ),
      );
    }

    // InternalRegistry — Function
    if (func.trim()) {
      filtered = filtered.filter((item) =>
        item.Function?.toLowerCase().includes(func.trim().toLowerCase()),
      );
    }

    // InternalRegistry — ReportingManager
    if (reportingManager.trim()) {
      filtered = filtered.filter((item) =>
        item.ReportingManager?.toLowerCase().includes(
          reportingManager.trim().toLowerCase(),
        ),
      );
    }

    // InternalRegistry — Technology
    if (technology.trim()) {
      filtered = filtered.filter((item) =>
        item.Technology?.toLowerCase().includes(
          technology.trim().toLowerCase(),
        ),
      );
    }

    setEmployeePartialAllocationData([...filtered]);

    // Column-slicing logic (unchanged)
    if (from && to) {
      const fromD = Config.colKeyToDate(from).getTime();
      const toD = Config.colKeyToDate(to).getTime();
      setVisibleColumns(
        allCols.filter((c) => {
          const d = Config.colKeyToDate(c).getTime();
          return d >= fromD && d <= toD;
        }),
      );
    } else {
      setVisibleColumns(allCols);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (dateError) return;
    const finalTags =
      tempEmpFilter.trim() && !tempEmpTags.includes(tempEmpFilter.trim())
        ? [...tempEmpTags, tempEmpFilter.trim()]
        : [...tempEmpTags];
    setAppliedEmpTags(finalTags);
    setAppliedFrom(tempFrom);
    setAppliedTo(tempTo);
    setAppliedDesignation(tempDesignation);
    setAppliedFunction(tempFunction);
    setAppliedReportingManager(tempReportingManager);
    setAppliedTechnology(tempTechnology);
    applyFilters(
      masterEmployeePartialAllocationData,
      finalTags,
      tempFrom,
      tempTo,
      monthColumns,
      tempDesignation,
      tempFunction,
      tempReportingManager,
      tempTechnology,
    );
    setFilterVisible(false);
  };

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancel = () => {
    const { from, to } = Config.getDefaultFromTo(monthColumns);
    setAppliedEmpTags([]);
    setAppliedFrom(from);
    setAppliedTo(to);
    setAppliedDesignation("");
    setAppliedFunction("");
    setAppliedReportingManager("");
    setAppliedTechnology("");
    applyFilters(
      masterEmployeePartialAllocationData,
      [],
      from,
      to,
      monthColumns,
    );
    setFilterVisible(false);
  };

  // ── Global search ─────────────────────────────────────────────────────────
  const searchPartialAllocationDetails = (val: string) => {
    setSearchVal(val);
    setEmployeePartialAllocationData(
      masterEmployeePartialAllocationData.filter(
        (item) =>
          item.EmployeeID?.toLowerCase().includes(val.toLowerCase()) ||
          item.EmployeeName?.toLowerCase().includes(val.toLowerCase()) ||
          item.Designation?.toLowerCase().includes(val.toLowerCase()) ||
          item.Function?.toLowerCase().includes(val.toLowerCase()) ||
          item.ReportingManager?.toLowerCase().includes(val.toLowerCase()) ||
          item.Technology?.toLowerCase().includes(val.toLowerCase()),
      ),
    );
  };

  // ── Initial load (unchanged) ───────────────────────────────────────────────
  useEffect(() => {
    setLoader(true);
    getEmployeePartialAllocationDatas();
  }, []);

  // ── getEmployeePartialAllocationDatas ─────────────────────────────────────
  const getEmployeePartialAllocationDatas = () => {
    // Step 1: fetch CRMProjects (data-fetching logic unchanged as requested)
    SPServices.SPReadItems({
      Listname: Config.ListNames.CRMProjects,
      Select:
        "*,ProjectManager/Id,ProjectManager/EMail,ProjectManager/Title,DeliveryHead/Id,DeliveryHead/EMail,DeliveryHead/Title",
      Expand: "ProjectManager,DeliveryHead",
      Orderby: "Modified",
      Orderbydecorasc: true,
      Filter: [
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
    })
      .then((crmRes: any) => {
        // Build CRM lookup map (unchanged — kept for existing data-fetching logic)
        const crmMap: Record<string, any> = {};
        crmRes?.forEach((crmItem: any) => {
          const pid: string = crmItem?.ProjectID || "";
          if (!pid) return;
          crmMap[pid] = crmItem;
        });

        // Step 2: fetch InternalRegistry
        SPServices.SPReadItems({
          Listname: Config.ListNames.InternalRegistry,
          Select: "*",
          Orderby: "Modified",
          Orderbydecorasc: true,
          Filter: [],
        })
          .then((registryRes: any) => {
            // Build InternalRegistry lookup map keyed by EmpID
            const registryMap: Record<
              string,
              {
                Designation: string;
                Function: string;
                ReportingManager: string;
                Technology: string;
              }
            > = {};

            registryRes?.forEach((regItem: any) => {
              const empId: string = regItem?.EmpID || "";
              if (!empId) return;
              registryMap[empId] = {
                Designation: regItem?.Designation || "",
                Function: regItem?.Function || "",
                ReportingManager: regItem?.ReportingManager || "",
                Technology: regItem?.Technology || "",
              };
            });

            // Step 3: original EmployeePartialAllocation query (unchanged)
            SPServices.SPReadItems({
              Listname: Config.ListNames.EmployeePartialAllocation,
              Select: "*",
              Orderby: "Modified",
              Orderbydecorasc: true,
              Filter: [
                {
                  FilterKey: "ProjectID",
                  Operator: "eq",
                  FilterValue: Config.benchProject,
                },
              ],
            })
              .then((res: any) => {
                let allocationData: any[] = [];
                res.forEach((items: any) => {
                  const monthValues = [
                    items?.April2025,
                    items?.Maymonth2025,
                    items?.June2025,
                    items?.July2025,
                    items?.August2025,
                    items?.September2025,
                    items?.Octobar2025,
                    items?.November2025,
                    items?.December2025,
                    items?.January2026,
                    items?.February2026,
                    items?.March2026,
                    items?.April2026,
                    items?.Maymonth2026,
                    items?.June2026,
                  ];
                  // check if any value is non-zero (unchanged)
                  const hasAllocation = monthValues.some(
                    (val) => Number(val) !== 0,
                  );
                  if (!hasAllocation) return;

                  // Look up InternalRegistry data by EmployeeID === EmpID
                  const regData = registryMap[items?.EmployeeID] || {
                    Designation: "",
                    Function: "",
                    ReportingManager: "",
                    Technology: "",
                  };

                  allocationData.push({
                    // Existing fields (unchanged)
                    ID: items?.ID,
                    EmployeeID: items?.EmployeeID || "",
                    EmployeeName: items?.EmployeeName || "",
                    ProjectID: items?.ProjectID || "",
                    APR2025: (items?.April2025 || 0) * 100,
                    MAY2025: (items?.Maymonth2025 || 0) * 100,
                    JUN2025: (items?.June2025 || 0) * 100,
                    JUL2025: (items?.July2025 || 0) * 100,
                    AUG2025: (items?.August2025 || 0) * 100,
                    SEP2025: (items?.September2025 || 0) * 100,
                    OCT2025: (items?.Octobar2025 || 0) * 100,
                    NOV2025: (items?.November2025 || 0) * 100,
                    DEC2025: (items?.December2025 || 0) * 100,
                    JAN2026: (items?.January2026 || 0) * 100,
                    FEB2026: (items?.February2026 || 0) * 100,
                    MAR2026: (items?.March2026 || 0) * 100,
                    APR2026: (items?.April2026 || 0) * 100,
                    MAY2026: (items?.Maymonth2026 || 0) * 100,
                    JUN2026: (items?.June2026 || 0) * 100,
                    // InternalRegistry enriched fields
                    Designation: regData.Designation,
                    Function: regData.Function,
                    ReportingManager: regData.ReportingManager,
                    Technology: regData.Technology,
                  });
                });

                // Column-key extraction — InternalRegistry fields added to exclusion list
                let cols: string[] = [];
                if (allocationData.length > 0) {
                  cols = Object.keys(allocationData[0]).filter(
                    (key) =>
                      ![
                        "ID",
                        "EmployeeID",
                        "EmployeeName",
                        "ProjectID",
                        "Designation",
                        "Function",
                        "ReportingManager",
                        "Technology",
                      ].includes(key),
                  );
                  setMonthColumns(cols);
                }

                setMasterEmployeePartialAllocationData([...allocationData]);

                // Default From/To logic (unchanged)
                const { from, to } = Config.getDefaultFromTo(cols);
                setAppliedFrom(from);
                setAppliedTo(to);
                setTempFrom(from);
                setTempTo(to);
                applyFilters(allocationData, [], from, to, cols);
                setLoader(false);
              })
              .catch((err) => {
                console.log(
                  "Get Employee partial allocation datas err in BenchReport.tsx",
                  err,
                );
                setLoader(false);
              });
          })
          .catch((err) => {
            console.log(
              "Get InternalRegistry data err in BenchReport.tsx",
              err,
            );
            setLoader(false);
          });
      })
      .catch((err) => {
        console.log("Get CRMProjects data err in BenchReport.tsx", err);
        setLoader(false);
      });
  };

  // ── isFilterActive ────────────────────────────────────────────────────────
  const isFilterActive = (): boolean => {
    const { from, to } = Config.getDefaultFromTo(monthColumns);
    return (
      appliedEmpTags.length > 0 ||
      appliedFrom !== from ||
      appliedTo !== to ||
      !!appliedDesignation ||
      !!appliedFunction ||
      !!appliedReportingManager ||
      !!appliedTechnology
    );
  };

  // ── Modal footer (unchanged) ───────────────────────────────────────────────
  const modalFooter = (
    <div className={styles.modalFooter}>
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={handleCancel}
        className="p-button-outlined p-button-secondary"
      />
      <Button
        label="Save"
        icon="pi pi-check"
        onClick={handleSave}
        disabled={!!dateError}
        className={styles.modalSaveBtn}
      />
    </div>
  );

  return (
    <>
      {loader ? (
        <Loading />
      ) : (
        <div className={styles.lcaBody}>
          {/* ── Header bar (unchanged) ── */}
          <div
            className={`${styles.filterBarAndTableBorder} ${
              ScreenWidth >= 1536
                ? styles.filterBar_1536
                : styles.filterBar_1396
            }`}
          >
            <div className={styles.filterBar}>
              <h2>Bench Report ({Config.benchProject})</h2>
            </div>
            <div className={styles.filterBtns}>
              <div className="all_search">
                <IconField iconPosition="left">
                  <InputIcon className="pi pi-search" />
                  <InputText
                    value={searchVal}
                    onChange={(e) =>
                      searchPartialAllocationDetails(e.target.value)
                    }
                    placeholder="Search"
                  />
                </IconField>
              </div>

              <div className={styles.btnAndText}>
                <div
                  className={styles.btnBackGround}
                  style={{
                    cursor: employeePartialAllocationData.length
                      ? "pointer"
                      : "not-allowed",
                  }}
                  onClick={() => {
                    if (employeePartialAllocationData.length)
                      Config.generateExcel(
                        employeePartialAllocationData,
                        visibleColumns.length ? visibleColumns : monthColumns,
                        "Bench Report",
                      );
                  }}
                >
                  <img src={ImportUploadImage} alt="export" />
                  Export
                </div>
              </div>

              <div className={styles.btnAndText}>
                <div
                  className={`${styles.btnBackGround} ${styles.filterBtnWrapper}`}
                  onClick={openFilterModal}
                >
                  <img
                    src={isFilterActive() ? FilterNoneImage : FilterImage}
                    alt="filter"
                  />
                  Filter
                  {isFilterActive() && (
                    <span className={styles.filterActiveDot} />
                  )}
                </div>
              </div>

              <div>
                <PrimaryButton
                  styles={RefreshButton}
                  style={{
                    width: "25px",
                    minWidth: "0px",
                    height: "30px",
                    minHeight: "0px",
                  }}
                  iconProps={{ iconName: "refresh" }}
                  className={styles.refresh}
                  onClick={() => {
                    setSearchVal("");
                    setLoader(true);
                    handleCancel();
                    getEmployeePartialAllocationDatas();
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Data Table ── */}
          <div
            className={`${styles.tableData} ${
              ScreenWidth >= 1536 ? "data_table_1536" : "data_table_1396"
            }`}
          >
            <DataTable
              tableStyle={{ minWidth: "50rem" }}
              scrollable
              value={employeePartialAllocationData}
              paginator={employeePartialAllocationData?.length > 8}
              rows={8}
              emptyMessage={<p className={styles.noData}>No data !!!</p>}
            >
              {/* Employee columns */}
              <Column
                sortable
                field="EmployeeID"
                header="Employee id"
                style={{ minWidth: "130px" }}
              />
              <Column
                sortable
                field="EmployeeName"
                header="Employee name"
                style={{ minWidth: "146px" }}
              />
              {/* InternalRegistry columns */}
              <Column
                sortable
                field="Designation"
                header="Designation"
                style={{ minWidth: "150px" }}
              />
              <Column
                sortable
                field="Function"
                header="Function"
                style={{ minWidth: "140px" }}
              />
              <Column
                sortable
                field="ReportingManager"
                header="Reporting manager"
                style={{ minWidth: "170px" }}
              />
              <Column
                sortable
                field="Technology"
                header="Technology"
                style={{ minWidth: "140px" }}
              />
              {/* Month columns */}
              {(visibleColumns.length ? visibleColumns : monthColumns).map(
                (month: string) => (
                  <Column
                    key={month}
                    sortable
                    field={month}
                    header={Config.formatColLabel(month)}
                    style={{ minWidth: "120px" }}
                  />
                ),
              )}
            </DataTable>
          </div>

          {/* ── Filter Modal ── */}
          <Dialog
            header={<span className={styles.modalHeader}>Filter Options</span>}
            visible={filterVisible}
            style={{ width: "560px" }}
            onHide={() => setFilterVisible(false)}
            footer={modalFooter}
            draggable={false}
            resizable={false}
            maskStyle={{ backdropFilter: "blur(2px)" }}
          >
            <div className={styles.modalBody}>
              {/* Employee Name / ID — multi-tag input (unchanged) */}
              <div className={styles.filterField}>
                <Label className={styles.filterFieldLabel}>
                  Employee Name / ID
                </Label>
                <div className={styles.tagInputWrapper}>
                  <InputText
                    value={tempEmpFilter}
                    onChange={(e) => setTempEmpFilter(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={
                      tempEmpTags.length === 0
                        ? "Type and press Enter to add"
                        : "Add more..."
                    }
                    className={styles.filterFieldInput}
                  />
                  <span className={styles.tagHint}>Press Enter ↵ to add</span>
                </div>
                {tempEmpTags.length > 0 && (
                  <div className={styles.tagList}>
                    {tempEmpTags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                        <button
                          className={styles.tagRemoveBtn}
                          onClick={() => removeTag(tag)}
                          title="Remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.modalDivider} />

              {/* InternalRegistry filters */}
              <div className={styles.filterFieldRow}>
                <div className={styles.filterFieldHalf}>
                  <Label className={styles.filterFieldLabel}>Designation</Label>
                  <InputText
                    value={tempDesignation}
                    onChange={(e) => setTempDesignation(e.target.value)}
                    placeholder="Enter designation"
                    className={styles.filterFieldInput}
                  />
                </div>
                <div className={styles.filterFieldHalf}>
                  <Label className={styles.filterFieldLabel}>Function</Label>
                  <InputText
                    value={tempFunction}
                    onChange={(e) => setTempFunction(e.target.value)}
                    placeholder="Enter function"
                    className={styles.filterFieldInput}
                  />
                </div>
              </div>

              <div className={styles.filterFieldRow}>
                <div className={styles.filterFieldHalf}>
                  <Label className={styles.filterFieldLabel}>
                    Reporting manager
                  </Label>
                  <InputText
                    value={tempReportingManager}
                    onChange={(e) => setTempReportingManager(e.target.value)}
                    placeholder="Enter reporting manager"
                    className={styles.filterFieldInput}
                  />
                </div>
                <div className={styles.filterFieldHalf}>
                  <Label className={styles.filterFieldLabel}>Technology</Label>
                  <InputText
                    value={tempTechnology}
                    onChange={(e) => setTempTechnology(e.target.value)}
                    placeholder="Enter technology"
                    className={styles.filterFieldInput}
                  />
                </div>
              </div>

              <div className={styles.modalDivider} />

              {/* Month pickers (unchanged) */}
              <div className={styles.datePickerRow}>
                <div className={styles.datePickerCol}>
                  <MonthPicker
                    label="From"
                    value={tempFrom || monthColumns[0] || ""}
                    onChange={handleTempFromChange}
                    enabledKeys={monthColumns}
                    maxKey={tempTo || undefined}
                  />
                </div>
                <span className={styles.dateArrow}>→</span>
                <div className={styles.datePickerCol}>
                  <MonthPicker
                    label="To"
                    value={
                      tempTo || monthColumns[monthColumns.length - 1] || ""
                    }
                    onChange={handleTempToChange}
                    enabledKeys={monthColumns}
                    minKey={tempFrom || undefined}
                  />
                </div>
              </div>

              {/* Date error (unchanged) */}
              {dateError && (
                <span className={styles.dateError}>{dateError}</span>
              )}
            </div>
          </Dialog>
        </div>
      )}
    </>
  );
};

export default BenchReport;
