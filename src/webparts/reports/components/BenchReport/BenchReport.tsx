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
import { IPeoplePickerDetails } from "../../../../External/CommonServices/interface"; // NEW

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

  // ── Existing temp states (unchanged) ──────────────────────────────────────
  const [tempEmpFilter, setTempEmpFilter] = useState<string>("");
  const [tempEmpTags, setTempEmpTags] = useState<string[]>([]);
  const [tempFrom, setTempFrom] = useState<string>("");
  const [tempTo, setTempTo] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");
  // NEW — CRM filter temps
  const [tempClientName, setTempClientName] = useState<string>("");
  const [tempProjectName, setTempProjectName] = useState<string>("");
  const [tempCustomerDisplayName, setTempCustomerDisplayName] =
    useState<string>("");
  const [tempProjectManager, setTempProjectManager] = useState<string>("");
  const [tempDeliveryHead, setTempDeliveryHead] = useState<string>("");

  // ── Existing applied states (unchanged) ───────────────────────────────────
  const [appliedEmpTags, setAppliedEmpTags] = useState<string[]>([]);
  const [appliedFrom, setAppliedFrom] = useState<string>("");
  const [appliedTo, setAppliedTo] = useState<string>("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  // NEW — CRM applied filters
  const [appliedClientName, setAppliedClientName] = useState<string>("");
  const [appliedProjectName, setAppliedProjectName] = useState<string>("");
  const [appliedCustomerDisplayName, setAppliedCustomerDisplayName] =
    useState<string>("");
  const [appliedProjectManager, setAppliedProjectManager] =
    useState<string>("");
  const [appliedDeliveryHead, setAppliedDeliveryHead] = useState<string>("");

  // ── Open modal (NEW CRM temps seeded alongside existing ones) ─────────────
  const openFilterModal = () => {
    setTempEmpFilter("");
    setTempEmpTags([...appliedEmpTags]);
    setTempFrom(appliedFrom);
    setTempTo(appliedTo);
    setDateError("");
    // NEW
    setTempClientName(appliedClientName);
    setTempProjectName(appliedProjectName);
    setTempCustomerDisplayName(appliedCustomerDisplayName);
    setTempProjectManager(appliedProjectManager);
    setTempDeliveryHead(appliedDeliveryHead);
    setFilterVisible(true);
  };

  // ── Date change handlers (unchanged) ──────────────────────────────────────
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

  // ── Apply filters (NEW CRM params appended; existing logic word-for-word) ──
  const applyFilters = (
    data: any[],
    empTags: string[],
    from: string,
    to: string,
    allCols: string[],
    // NEW params — all default to "" so existing call-sites stay valid
    clientName: string = "",
    projectName: string = "",
    customerDisplayName: string = "",
    projectManager: string = "",
    deliveryHead: string = "",
  ) => {
    let filtered = data;

    // Existing employee tag filter (unchanged)
    if (empTags.length > 0) {
      filtered = data.filter((item) =>
        empTags.some(
          (tag) =>
            item.EmployeeID?.toLowerCase().includes(tag.toLowerCase()) ||
            item.EmployeeName?.toLowerCase().includes(tag.toLowerCase()),
        ),
      );
    }

    // NEW — ClientName (Account name)
    if (clientName.trim()) {
      filtered = filtered.filter((item) =>
        item.ClientName?.toLowerCase().includes(
          clientName.trim().toLowerCase(),
        ),
      );
    }

    // NEW — ProjectName
    if (projectName.trim()) {
      filtered = filtered.filter((item) =>
        item.ProjectName?.toLowerCase().includes(
          projectName.trim().toLowerCase(),
        ),
      );
    }

    // NEW — CustomerDisplayName (Client name)
    if (customerDisplayName.trim()) {
      filtered = filtered.filter((item) =>
        item.CustomerDisplayName?.toLowerCase().includes(
          customerDisplayName.trim().toLowerCase(),
        ),
      );
    }

    // NEW — ProjectManager (match by Title of any PM in the people array)
    if (projectManager.trim()) {
      filtered = filtered.filter((item) =>
        item.ProjectManager?.some((pm: IPeoplePickerDetails) =>
          pm.name?.toLowerCase().includes(projectManager.trim().toLowerCase()),
        ),
      );
    }

    // NEW — DeliveryHead (match by Title of any DH in the people array)
    if (deliveryHead.trim()) {
      filtered = filtered.filter((item) =>
        item.DeliveryHead?.some((dh: IPeoplePickerDetails) =>
          dh.name?.toLowerCase().includes(deliveryHead.trim().toLowerCase()),
        ),
      );
    }

    setEmployeePartialAllocationData([...filtered]);

    // Existing column-slicing logic (unchanged)
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

  // ── Save (NEW CRM fields committed alongside existing ones) ───────────────
  const handleSave = () => {
    if (dateError) return;
    const finalTags =
      tempEmpFilter.trim() && !tempEmpTags.includes(tempEmpFilter.trim())
        ? [...tempEmpTags, tempEmpFilter.trim()]
        : [...tempEmpTags];
    setAppliedEmpTags(finalTags);
    setAppliedFrom(tempFrom);
    setAppliedTo(tempTo);
    // NEW
    setAppliedClientName(tempClientName);
    setAppliedProjectName(tempProjectName);
    setAppliedCustomerDisplayName(tempCustomerDisplayName);
    setAppliedProjectManager(tempProjectManager);
    setAppliedDeliveryHead(tempDeliveryHead);
    applyFilters(
      masterEmployeePartialAllocationData,
      finalTags,
      tempFrom,
      tempTo,
      monthColumns,
      tempClientName,
      tempProjectName,
      tempCustomerDisplayName,
      tempProjectManager,
      tempDeliveryHead,
    );
    setFilterVisible(false);
  };

  // ── Cancel (NEW CRM fields reset to "" alongside existing reset) ──────────
  const handleCancel = () => {
    const { from, to } = Config.getDefaultFromTo(monthColumns);
    setAppliedEmpTags([]);
    setAppliedFrom(from);
    setAppliedTo(to);
    // NEW
    setAppliedClientName("");
    setAppliedProjectName("");
    setAppliedCustomerDisplayName("");
    setAppliedProjectManager("");
    setAppliedDeliveryHead("");
    applyFilters(
      masterEmployeePartialAllocationData,
      [],
      from,
      to,
      monthColumns,
    );
    setFilterVisible(false);
  };

  // ── Global search (NEW fields included) ───────────────────────────────────
  const searchPartialAllocationDetails = (val: string) => {
    setSearchVal(val);
    setEmployeePartialAllocationData(
      masterEmployeePartialAllocationData.filter(
        (item) =>
          item.EmployeeID?.toLowerCase().includes(val.toLowerCase()) ||
          item.EmployeeName?.toLowerCase().includes(val.toLowerCase()) ||
          // NEW
          item.ProjectName?.toLowerCase().includes(val.toLowerCase()) ||
          item.ClientName?.toLowerCase().includes(val.toLowerCase()) ||
          item.CustomerDisplayName?.toLowerCase().includes(val.toLowerCase()) ||
          item.ProjectManager?.some((pm: IPeoplePickerDetails) =>
            pm.name?.toLowerCase().includes(val.toLowerCase()),
          ) ||
          item.DeliveryHead?.some((dh: IPeoplePickerDetails) =>
            dh.name?.toLowerCase().includes(val.toLowerCase()),
          ),
      ),
    );
  };

  // ── Initial load (unchanged) ───────────────────────────────────────────────
  useEffect(() => {
    setLoader(true);
    getEmployeePartialAllocationDatas();
  }, []);

  // ── getEmployeePartialAllocationDatas
  const getEmployeePartialAllocationDatas = () => {
    // Step 1: fetch CRMProjects with expanded ProjectManager and DeliveryHead
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
        // Build a lookup map keyed by ProjectID string
        const crmMap: Record<
          string,
          {
            ClientName: string;
            CustomerDisplayName: string;
            ProjectName: string;
            ProjectManager: IPeoplePickerDetails[];
            DeliveryHead: IPeoplePickerDetails[];
          }
        > = {};

        crmRes?.forEach((crmItem: any) => {
          const pid: string = crmItem?.ProjectID || "";
          if (!pid) return;

          // Build ProjectManager array — same pattern as Projects.tsx
          const _ProjectManager: IPeoplePickerDetails[] = [];
          if (crmItem?.ProjectManager) {
            crmItem.ProjectManager.forEach((user: any) => {
              _ProjectManager.push({
                id: user?.Id,
                name: user?.Title,
                email: user?.EMail,
              });
            });
          }

          // Build DeliveryHead array — same pattern as Projects.tsx
          const _DeliveryHead: IPeoplePickerDetails[] = [];
          if (crmItem?.DeliveryHead) {
            crmItem.DeliveryHead.forEach((user: any) => {
              _DeliveryHead.push({
                id: user?.Id,
                name: user?.Title,
                email: user?.EMail,
              });
            });
          }

          crmMap[pid] = {
            ClientName: crmItem?.ClientName || "",
            CustomerDisplayName: crmItem?.CustomerDisplayName || "",
            ProjectName: crmItem?.ProjectName || "",
            ProjectManager: _ProjectManager,
            DeliveryHead: _DeliveryHead,
          };
        });

        // Step 2: original EmployeePartialAllocation query (unchanged)
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
              // check if any value is non-zero
              const hasAllocation = monthValues.some(
                (val) => Number(val) !== 0,
              );
              if (!hasAllocation) return; // skip record

              // Look up CRM data for this record's ProjectID
              const crmData = crmMap[items?.ProjectID] || {
                ClientName: "",
                CustomerDisplayName: "",
                ProjectName: "",
                ProjectManager: [],
                DeliveryHead: [],
              };

              allocationData.push({
                // Existing fields (unchanged — exact same property names & values)
                ID: items?.ID,
                EmployeeID: items?.EmployeeID || "",
                EmployeeName: items?.EmployeeName || "",
                ProjectID: items?.ProjectID || "",
                APR2025: items?.April2025 || 0,
                MAY2025: items?.Maymonth2025 || 0,
                JUN2025: items?.June2025 || 0,
                JUL2025: items?.July2025 || 0,
                AUG2025: items?.August2025 || 0,
                SEP2025: items?.September2025 || 0,
                OCT2025: items?.Octobar2025 || 0,
                NOV2025: items?.November2025 || 0,
                DEC2025: items?.December2025 || 0,
                JAN2026: items?.January2026 || 0,
                FEB2026: items?.February2026 || 0,
                MAR2026: items?.March2026 || 0,
                APR2026: items?.April2026 || 0,
                MAY2026: items?.Maymonth2026 || 0,
                JUN2026: items?.June2026 || 0,
                // NEW — CRMProjects enriched fields
                ClientName: crmData.ClientName,
                CustomerDisplayName: crmData.CustomerDisplayName,
                ProjectName: crmData.ProjectName,
                ProjectManager: crmData.ProjectManager,
                DeliveryHead: crmData.DeliveryHead,
              });
            });

            // Existing column-key extraction — NEW fields added to exclusion list
            let cols: string[] = [];
            if (allocationData.length > 0) {
              cols = Object.keys(allocationData[0]).filter(
                (key) =>
                  ![
                    "ID",
                    "EmployeeID",
                    "EmployeeName",
                    "ProjectID",
                    // NEW exclusions so these don't become month columns
                    "ClientName",
                    "CustomerDisplayName",
                    "ProjectName",
                    "ProjectManager",
                    "DeliveryHead",
                  ].includes(key),
              );
              setMonthColumns(cols);
            }

            setMasterEmployeePartialAllocationData([...allocationData]);

            // Existing default From/To logic (unchanged)
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
        console.log("Get CRMProjects data err in BenchReport.tsx", err);
        setLoader(false);
      });
  };

  // ── isFilterActive (NEW CRM fields included in check) ────────────────────
  const isFilterActive = (): boolean => {
    const { from, to } = Config.getDefaultFromTo(monthColumns);
    return (
      appliedEmpTags.length > 0 ||
      appliedFrom !== from ||
      appliedTo !== to ||
      // NEW
      !!appliedClientName ||
      !!appliedProjectName ||
      !!appliedCustomerDisplayName ||
      !!appliedProjectManager ||
      !!appliedDeliveryHead
    );
  };

  // NEW — People column renderer
  const renderPeopleNames = (people: IPeoplePickerDetails[]): string => {
    if (!people?.length) return "-";
    return people
      .map((p) => p.name)
      .filter(Boolean)
      .join(", ");
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
              <h2>Bench Report</h2>
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

          {/* ── Table — NEW CRM columns inserted after Project id ── */}
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
              {/* Existing column (unchanged) */}
              <Column
                sortable
                field="ProjectID"
                header="Project id"
                style={{ minWidth: "120px" }}
              />
              {/* NEW CRM columns */}
              <Column
                sortable
                field="ProjectName"
                header="Project name"
                style={{ minWidth: "150px" }}
              />
              <Column
                sortable
                field="ClientName"
                header="Account name"
                style={{ minWidth: "140px" }}
              />
              <Column
                sortable
                field="CustomerDisplayName"
                header="Client name"
                style={{ minWidth: "140px" }}
              />
              <Column
                sortable
                field="ProjectManager"
                header="Project manager"
                style={{ minWidth: "150px" }}
                body={(rowData) => renderPeopleNames(rowData.ProjectManager)}
              />
              <Column
                sortable
                field="DeliveryHead"
                header="Delivery head"
                style={{ minWidth: "150px" }}
                body={(rowData) => renderPeopleNames(rowData.DeliveryHead)}
              />
              {/* Existing columns (unchanged) */}
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

              {/* NEW — CRMProjects filters, two per row */}
              <div className={styles.filterFieldRow}>
                <div className={styles.filterFieldHalf}>
                  <Label className={styles.filterFieldLabel}>
                    Project name
                  </Label>
                  <InputText
                    value={tempProjectName}
                    onChange={(e) => setTempProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className={styles.filterFieldInput}
                  />
                </div>
                <div className={styles.filterFieldHalf}>
                  <Label className={styles.filterFieldLabel}>
                    Account name
                  </Label>
                  <InputText
                    value={tempClientName}
                    onChange={(e) => setTempClientName(e.target.value)}
                    placeholder="Enter account name"
                    className={styles.filterFieldInput}
                  />
                </div>
                <div className={styles.filterFieldHalf}>
                  <Label className={styles.filterFieldLabel}>Client name</Label>
                  <InputText
                    value={tempCustomerDisplayName}
                    onChange={(e) => setTempCustomerDisplayName(e.target.value)}
                    placeholder="Enter client name"
                    className={styles.filterFieldInput}
                  />
                </div>
              </div>

              <div className={styles.filterFieldRow}>
                <div className={styles.filterFieldHalf}>
                  <Label className={styles.filterFieldLabel}>
                    Project manager
                  </Label>
                  <InputText
                    value={tempProjectManager}
                    onChange={(e) => setTempProjectManager(e.target.value)}
                    placeholder="Enter manager name"
                    className={styles.filterFieldInput}
                  />
                </div>
                <div className={styles.filterFieldHalf}>
                  <Label className={styles.filterFieldLabel}>
                    Delivery head
                  </Label>
                  <InputText
                    value={tempDeliveryHead}
                    onChange={(e) => setTempDeliveryHead(e.target.value)}
                    placeholder="Enter delivery head name"
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
