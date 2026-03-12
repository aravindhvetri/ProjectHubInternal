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
import Loading from "../../../../External/Loader/Loading";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { PrimaryButton } from "@fluentui/react";
import { Label } from "@fluentui/react";
import {
  FixedMonthDisplay,
  MonthPicker,
  multiPeoplePickerTemplate,
  peoplePickerTemplate,
} from "../../../../External/CommonServices/CommonTemplate";
import { IPeoplePickerDetails } from "../../../../External/CommonServices/interface";

const Utilization = (props: any) => {
  const ImportUploadImage: string = require("../../../../External/Images/fileupload.png");
  const FilterImage: string = require("../../../../External/Images/filter.png");
  const FilterNoneImage: string = require("../../../../External/Images/filternone.png");
  const ScreenWidth: number = window.innerWidth;

  // "To" is always the current month — computed once and never changes
  const currentMonthKey = Config.getCurrentMonthKey();

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

  // Temp values inside modal (not yet applied)
  const [tempEmpFilter, setTempEmpFilter] = useState<string>("");
  const [tempEmpTags, setTempEmpTags] = useState<string[]>([]);
  const [tempFrom, setTempFrom] = useState<string>("");
  const [tempClientName, setTempClientName] = useState<string>("");
  const [tempProjectName, setTempProjectName] = useState<string>("");
  const [tempCustomerDisplayName, setTempCustomerDisplayName] =
    useState<string>("");
  const [tempProjectManager, setTempProjectManager] = useState<string>("");
  const [tempDeliveryHead, setTempDeliveryHead] = useState<string>("");

  // Applied values (drive actual filtering)
  const [appliedEmpTags, setAppliedEmpTags] = useState<string[]>([]);
  const [appliedFrom, setAppliedFrom] = useState<string>("");
  const [appliedClientName, setAppliedClientName] = useState<string>("");
  const [appliedProjectName, setAppliedProjectName] = useState<string>("");
  const [appliedCustomerDisplayName, setAppliedCustomerDisplayName] =
    useState<string>("");
  const [appliedProjectManager, setAppliedProjectManager] =
    useState<string>("");
  const [appliedDeliveryHead, setAppliedDeliveryHead] = useState<string>("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  // ── Default From: 4 months before current month ────────────────────────────
  const getDefaultFrom = (cols: string[]): string => {
    if (!cols.length) return "";
    const now = new Date();
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 4, 1);
    const fromKey = `${Config.MONTH_KEYS[fromDate.getMonth()]}${fromDate.getFullYear()}`;

    const colDates = cols.map((c) => Config.colKeyToDate(c).getTime());
    const minAvailable = cols[colDates.indexOf(Math.min(...colDates))];

    const d = Config.colKeyToDate(fromKey).getTime();
    if (d < Config.colKeyToDate(minAvailable).getTime()) return minAvailable;
    if (cols.includes(fromKey)) return fromKey;
    return [...cols].sort(
      (a, b) =>
        Math.abs(Config.colKeyToDate(a).getTime() - d) -
        Math.abs(Config.colKeyToDate(b).getTime() - d),
    )[0];
  };

  // ── Open modal ─────────────────────────────────────────────────────────────
  const openFilterModal = () => {
    setTempEmpFilter("");
    setTempEmpTags([...appliedEmpTags]);
    setTempFrom(appliedFrom);
    setTempClientName(appliedClientName);
    setTempProjectName(appliedProjectName);
    setTempCustomerDisplayName(appliedCustomerDisplayName);
    setTempProjectManager(appliedProjectManager);
    setTempDeliveryHead(appliedDeliveryHead);
    setFilterVisible(true);
  };

  // ── Tag input: add on Enter ────────────────────────────────────────────────
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

  // ── Apply filters ──────────────────────────────────────────────────────────
  const applyFilters = (
    data: any[],
    empTags: string[],
    from: string,
    allCols: string[],
    clientName: string,
    projectName: string,
    customerDisplayName: string,
    projectManager: string,
    deliveryHead: string,
  ) => {
    let filtered = data;

    // Employee Name / ID — OR across all tags
    if (empTags.length > 0) {
      filtered = filtered.filter((item) =>
        empTags.some(
          (tag) =>
            item.EmployeeID?.toLowerCase().includes(tag.toLowerCase()) ||
            item.EmployeeName?.toLowerCase().includes(tag.toLowerCase()),
        ),
      );
    }

    // ClientName (Account name)
    if (clientName.trim()) {
      filtered = filtered.filter((item) =>
        item.ClientName?.toLowerCase().includes(
          clientName.trim().toLowerCase(),
        ),
      );
    }

    // ProjectName
    if (projectName.trim()) {
      filtered = filtered.filter((item) =>
        item.ProjectName?.toLowerCase().includes(
          projectName.trim().toLowerCase(),
        ),
      );
    }

    // CustomerDisplayName (Client name)
    if (customerDisplayName.trim()) {
      filtered = filtered.filter((item) =>
        item.CustomerDisplayName?.toLowerCase().includes(
          customerDisplayName.trim().toLowerCase(),
        ),
      );
    }

    // ProjectManager — match by Title of any PM in the people array
    if (projectManager.trim()) {
      filtered = filtered.filter((item) =>
        item.ProjectManager?.some((pm: IPeoplePickerDetails) =>
          pm.name?.toLowerCase().includes(projectManager.trim().toLowerCase()),
        ),
      );
    }

    // DeliveryHead — match by Title of any DH in the people array
    if (deliveryHead.trim()) {
      filtered = filtered.filter((item) =>
        item.DeliveryHead?.some((dh: IPeoplePickerDetails) =>
          dh.name?.toLowerCase().includes(deliveryHead.trim().toLowerCase()),
        ),
      );
    }

    setEmployeePartialAllocationData([...filtered]);

    // Visible month columns: From → current month (To always fixed)
    if (from) {
      const fromD = Config.colKeyToDate(from).getTime();
      const toD = Config.colKeyToDate(currentMonthKey).getTime();
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

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const finalTags =
      tempEmpFilter.trim() && !tempEmpTags.includes(tempEmpFilter.trim())
        ? [...tempEmpTags, tempEmpFilter.trim()]
        : [...tempEmpTags];

    setAppliedEmpTags(finalTags);
    setAppliedFrom(tempFrom);
    setAppliedClientName(tempClientName);
    setAppliedProjectName(tempProjectName);
    setAppliedCustomerDisplayName(tempCustomerDisplayName);
    setAppliedProjectManager(tempProjectManager);
    setAppliedDeliveryHead(tempDeliveryHead);

    applyFilters(
      masterEmployeePartialAllocationData,
      finalTags,
      tempFrom,
      monthColumns,
      tempClientName,
      tempProjectName,
      tempCustomerDisplayName,
      tempProjectManager,
      tempDeliveryHead,
    );
    setFilterVisible(false);
  };

  // ── Cancel: reset all filters to defaults ─────────────────────────────────
  const handleCancel = () => {
    const defaultFrom = getDefaultFrom(monthColumns);
    setAppliedEmpTags([]);
    setAppliedFrom(defaultFrom);
    setAppliedClientName("");
    setAppliedProjectName("");
    setAppliedCustomerDisplayName("");
    setAppliedProjectManager("");
    setAppliedDeliveryHead("");

    applyFilters(
      masterEmployeePartialAllocationData,
      [],
      defaultFrom,
      monthColumns,
      "",
      "",
      "",
      "",
      "",
    );
    setFilterVisible(false);
  };

  // ── Global search ──────────────────────────────────────────────────────────
  const searchUtilizationReportDetails = (val: string) => {
    setSearchVal(val);
    setEmployeePartialAllocationData(
      masterEmployeePartialAllocationData.filter(
        (item) =>
          item.EmployeeID?.toLowerCase().includes(val.toLowerCase()) ||
          item.EmployeeName?.toLowerCase().includes(val.toLowerCase()) ||
          item.ProjectID?.toLowerCase().includes(val.toLowerCase()) ||
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

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    setLoader(true);
    getEmployeePartialAllocationDatas();
  }, []);

  // ── Fetch allocation data then enrich from CRMProjects ────────────────────
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

        // Step 2: fetch EmployeePartialAllocation
        SPServices.SPReadItems({
          Listname: Config.ListNames.EmployeePartialAllocation,
          Select: "*",
          Orderby: "Modified",
          Orderbydecorasc: true,
        })
          .then((res: any) => {
            let allocationData: any[] = [];
            const now = new Date();

            res.forEach((items: any) => {
              if (items?.ProjectID === Config.benchProject) return;

              // Look up CRM data for this record's ProjectID
              const crmData = crmMap[items?.ProjectID] || {
                ClientName: "",
                CustomerDisplayName: "",
                ProjectName: "",
                ProjectManager: [],
                DeliveryHead: [],
              };

              let baseObj: any = {
                ID: items?.ID,
                EmployeeID: items?.EmployeeID || "",
                EmployeeName: items?.EmployeeName || "",
                ProjectID: items?.ProjectID || "",
                // CRMProjects enriched fields
                ClientName: crmData.ClientName,
                CustomerDisplayName: crmData.CustomerDisplayName,
                ProjectName: crmData.ProjectName,
                ProjectManager: crmData.ProjectManager,
                DeliveryHead: crmData.DeliveryHead,
              };

              Config.monthKeys.forEach((key: any) => {
                const monthPart = key.slice(0, 3);
                const yearPart = parseInt(key.slice(3));
                const monthFull = Config.monthMap[monthPart];
                const value = items[monthFull + yearPart];

                if (value !== undefined) {
                  const itemDate = new Date(
                    yearPart,
                    Config.monthIndexMap[monthPart],
                    1,
                  );
                  // Utilization: current month and past months only
                  if (itemDate <= now) {
                    baseObj[key] = value || 0;
                  }
                }
              });

              allocationData.push(baseObj);
            });

            // Extract month column keys, excluding all non-month fields
            let cols: string[] = [];
            if (allocationData.length > 0) {
              cols = Object.keys(allocationData[0]).filter(
                (key) =>
                  ![
                    "ID",
                    "EmployeeID",
                    "EmployeeName",
                    "ProjectID",
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

            // Apply defaults: From = 4 months back, To = current month (fixed)
            const defaultFrom = getDefaultFrom(cols);
            setAppliedFrom(defaultFrom);
            setTempFrom(defaultFrom);
            applyFilters(
              allocationData,
              [],
              defaultFrom,
              cols,
              "",
              "",
              "",
              "",
              "",
            );
            setLoader(false);
          })
          .catch((err) => {
            console.log(
              "Get Employee partial allocation datas err in Utilization.tsx",
              err,
            );
            setLoader(false);
          });
      })
      .catch((err) => {
        console.log("Get CRMProjects data err in Utilization.tsx", err);
        setLoader(false);
      });
  };

  // ── Filter active check ────────────────────────────────────────────────────
  const isFilterActive = (): boolean => {
    const defaultFrom = getDefaultFrom(monthColumns);
    return (
      appliedEmpTags.length > 0 ||
      appliedFrom !== defaultFrom ||
      !!appliedClientName ||
      !!appliedProjectName ||
      !!appliedCustomerDisplayName ||
      !!appliedProjectManager ||
      !!appliedDeliveryHead
    );
  };

  //Render Manager Column function:
  const renderManagersColumn = (rowData: any) => {
    const projectManagers: IPeoplePickerDetails[] = rowData?.ProjectManager;
    return (
      <div>
        {rowData?.ProjectManager?.length > 1
          ? multiPeoplePickerTemplate(projectManagers)
          : peoplePickerTemplate(projectManagers[0])}
      </div>
    );
  };

  //Render Delivery Heads Column function:
  const renderDeliveryHeadsColumn = (rowData: any) => {
    const deliveryHeads: IPeoplePickerDetails[] = rowData?.DeliveryHead;
    return (
      <div>
        {rowData?.DeliveryHead?.length > 1
          ? multiPeoplePickerTemplate(deliveryHeads)
          : peoplePickerTemplate(deliveryHeads[0])}
      </div>
    );
  };

  // ── Modal footer ───────────────────────────────────────────────────────────
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
          {/* ── Header bar ── */}
          <div
            className={`${styles.filterBarAndTableBorder} ${
              ScreenWidth >= 1536
                ? styles.filterBar_1536
                : styles.filterBar_1396
            }`}
          >
            <div className={styles.filterBar}>
              <h2>Utilization Report</h2>
            </div>
            <div className={styles.filterBtns}>
              <div className="all_search">
                <IconField iconPosition="left">
                  <InputIcon className="pi pi-search" />
                  <InputText
                    value={searchVal}
                    onChange={(e) =>
                      searchUtilizationReportDetails(e.target.value)
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
                        "Utilization Report",
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

          {/* ── Table ── */}
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
              <Column
                sortable
                field="EmployeeID"
                header="Employee ID"
                style={{ minWidth: "130px" }}
              />
              <Column
                sortable
                field="EmployeeName"
                header="Employee name"
                style={{ minWidth: "146px" }}
              />
              <Column
                sortable
                field="ProjectID"
                header="Project ID"
                style={{ minWidth: "120px" }}
              />
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
                body={renderManagersColumn}
              />
              <Column
                sortable
                field="DeliveryHead"
                header="Delivery head"
                style={{ minWidth: "150px" }}
                body={renderDeliveryHeadsColumn}
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
              {/* Employee Name / ID — multi-tag input */}
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

              {/* CRMProjects filters — two per row */}
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

              {/* Date range: From (interactive) → To (fixed to current month) */}
              <div className={styles.datePickerRow}>
                <div className={styles.datePickerCol}>
                  <MonthPicker
                    label="From"
                    value={tempFrom || monthColumns[0] || ""}
                    onChange={setTempFrom}
                    enabledKeys={monthColumns}
                    maxKey={currentMonthKey}
                  />
                </div>
                <span className={styles.dateArrow}>→</span>
                <div className={styles.datePickerCol}>
                  <FixedMonthDisplay
                    label="To (current month)"
                    value={currentMonthKey}
                  />
                </div>
              </div>
            </div>
          </Dialog>
        </div>
      )}
    </>
  );
};

export default Utilization;
