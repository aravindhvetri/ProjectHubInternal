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
import styles from "../UpComingMilestonesReports/MilestonesReports.module.scss";
import "../../../../External/CSS/Style.css";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  IBasicDropDown,
  IPeoplePickerDetails,
} from "../../../../External/CommonServices/interface";
import {
  multiPeoplePickerTemplate,
  peoplePickerTemplate,
} from "../../../../External/CommonServices/CommonTemplate";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import * as moment from "moment";
import * as FileSaver from "file-saver";
import * as Excel from "exceljs";
import { PrimaryButton } from "@fluentui/react";
import {
  Config,
  RefreshButton,
} from "../../../../External/CommonServices/Config";
import { Dropdown } from "primereact/dropdown";
import SPServices from "../../../../External/CommonServices/SPServices";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface ICRDropDown {
  ApprovalStatus: IBasicDropDown[];
  ImplementationStatus: IBasicDropDown[];
  BillingImpact: IBasicDropDown[];
  Severity: IBasicDropDown[];
}

interface ICRFilterValues {
  ProjectID: string;
  ProjectName: string;
  ProjectManager: string;
  DeliveryHead: string;
  ApprovalStatus: string;
  ImplementationStatus: string;
  BillingImpact: string;
  Severity: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const CRReport = (props: any) => {
  // Local variables:
  const ScreenWidth: number = window.innerWidth;
  const FilterImage: string = require("../../../../External/Images/filter.png");
  const FilterNoneImage: string = require("../../../../External/Images/filternone.png");
  const ImportUploadImage: string = require("../../../../External/Images/fileupload.png");

  // Local States:
  const [filteredData, setFilteredData] = React.useState<any[]>([]);
  const [masterReportData, setMasterReportData] = React.useState<any[]>([]);
  const [filterBar, setFilterBar] = React.useState<boolean>(true);
  const [filterValues, setFilterValues] = React.useState<ICRFilterValues>({
    ProjectID: "",
    ProjectName: "",
    ProjectManager: "",
    DeliveryHead: "",
    ApprovalStatus: "",
    ImplementationStatus: "",
    BillingImpact: "",
    Severity: "",
  });
  const [searchVal, setSearchVal] = React.useState<string>("");
  const [dropdownChoices, setDropdownChoices] = React.useState<ICRDropDown>({
    ApprovalStatus: [],
    ImplementationStatus: [],
    BillingImpact: [],
    Severity: [],
  });

  // ─── Initial Render ──────────────────────────────────────────────────────

  React.useEffect(() => {
    getCRsAndProjectDetails();
  }, []);

  // ─── Data Fetching ───────────────────────────────────────────────────────

  const getCRsAndProjectDetails = async () => {
    try {
      // Fetch CRMProjects
      const projectRes: any = await SPServices.SPReadItems({
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
      });

      // Fetch CRMProjectCRs with AssignedTo person field expanded
      const crsRes: any = await SPServices.SPReadItems({
        Listname: Config.ListNames.CRMProjectCRs,
        Select: "*,Project/Id,AssignedTo/Id,AssignedTo/EMail,AssignedTo/Title",
        Expand: "Project,AssignedTo",
        Orderby: "Modified",
        Orderbydecorasc: true,
        Filter: [
          {
            FilterKey: "IsDelete",
            Operator: "eq",
            FilterValue: "false",
          },
        ],
      });

      // Build a quick lookup map: project SharePoint ID → project data
      const projectMap: Record<number, any> = {};
      projectRes.forEach((project: any) => {
        // Parse ProjectManager
        let _ProjectManager: IPeoplePickerDetails[] = [];
        if (project?.ProjectManager) {
          project.ProjectManager.forEach((user: any) => {
            _ProjectManager.push({
              id: user?.Id,
              name: user?.Title,
              email: user?.EMail,
            });
          });
        }

        // Parse DeliveryHead
        let _DeliveryHead: IPeoplePickerDetails[] = [];
        if (project?.DeliveryHead) {
          project.DeliveryHead.forEach((user: any) => {
            _DeliveryHead.push({
              id: user?.Id,
              name: user?.Title,
              email: user?.EMail,
            });
          });
        }

        projectMap[project.ID] = {
          ProjectID: project.ProjectID,
          ProjectName: project.ProjectName,
          ClientName: project.ClientName,
          CustomerDisplayName: project.CustomerDisplayName,
          ProjectManager: _ProjectManager,
          DeliveryHead: _DeliveryHead,
        };
      });

      // Combine CRs with their project details
      let combinedData: any[] = [];

      crsRes.forEach((cr: any) => {
        const projectId: number = cr?.ProjectId ?? cr?.Project?.Id;
        const projectDetails = projectMap[projectId];

        // Parse AssignedTo (Person or Group field — may be single or multi)
        let _AssignedTo: IPeoplePickerDetails[] = [];
        if (cr?.AssignedTo) {
          const assignedToArr = Array.isArray(cr.AssignedTo)
            ? cr.AssignedTo
            : [cr.AssignedTo];
          assignedToArr.forEach((user: any) => {
            _AssignedTo.push({
              id: user?.Id,
              name: user?.Title,
              email: user?.EMail,
            });
          });
        }

        combinedData.push({
          // CR fields
          CRID: cr.CRID || "",
          CRTitle: cr.CRTitle || "",
          AssignedTo: _AssignedTo,
          ApprovalStatus: cr.ApprovalStatus || "",
          ImplementationStatus: cr.ImplementationStatus || "",
          BillingImpact: cr.BillingImpact || "",
          RequestedBySLT: cr.RequestedBySLT || "",
          CRDescription: cr.CRDescription || "",
          RequestDate: cr?.RequestDate || null,
          Severity: cr.Severity || "",
          EffortEstimate: cr.EffortEstimate || "",
          // Project fields (fallback to empty strings if no matching project)
          ProjectID: projectDetails?.ProjectID || "",
          ProjectName: projectDetails?.ProjectName || "",
          ClientName: projectDetails?.ClientName || "",
          CustomerDisplayName: projectDetails?.CustomerDisplayName || "",
          ProjectManager: projectDetails?.ProjectManager || [],
          DeliveryHead: projectDetails?.DeliveryHead || [],
        });
      });

      setFilteredData([...combinedData]);
      setMasterReportData([...combinedData]);

      // Fetch choice columns after data load
      getAllChoices();
    } catch (error) {
      console.error("Error fetching data in CRReport component:", error);
    }
  };

  // ─── Get Choice Columns ──────────────────────────────────────────────────

  const getAllChoices = () => {
    const choiceFields = [
      "ApprovalStatus",
      "ImplementationStatus",
      "BillingImpact",
      "Severity",
    ];

    choiceFields.forEach((fieldName) => {
      SPServices.SPGetChoices({
        Listname: Config.ListNames.CRMProjectCRs,
        FieldName: fieldName,
      })
        .then((res: any) => {
          let tempChoices: IBasicDropDown[] = [];
          if (res?.Choices?.length) {
            res.Choices.forEach((val: any) => {
              tempChoices.push({ name: val });
            });
          }
          setDropdownChoices((prev: ICRDropDown) => ({
            ...prev,
            [fieldName]: tempChoices,
          }));
        })
        .catch((err: any) => {
          console.log(err, `Get choice error for field: ${fieldName}`);
        });
    });
  };

  // ─── Column Templates ────────────────────────────────────────────────────

  // People picker renderer (ProjectManager / DeliveryHead / AssignedTo)
  const renderPeopleColumn = (people: IPeoplePickerDetails[]) => {
    if (!people || people.length === 0) return <div>-</div>;
    return (
      <div>
        {people.length > 1
          ? multiPeoplePickerTemplate(people)
          : peoplePickerTemplate(people[0])}
      </div>
    );
  };

  const renderProjectManagerColumn = (rowData: any) =>
    renderPeopleColumn(rowData?.ProjectManager);

  const renderDeliveryHeadColumn = (rowData: any) =>
    renderPeopleColumn(rowData?.DeliveryHead);

  const renderAssignedToColumn = (rowData: any) =>
    renderPeopleColumn(rowData?.AssignedTo);

  // CR Description multiline template
  const crDescriptionTemplate = (rowData: any) => (
    <div className="MultilinedisplayText" title={rowData?.CRDescription}>
      {rowData?.CRDescription || "-"}
    </div>
  );

  // Generic badge/chip template for choice fields
  const choiceBadgeTemplate = (value: string) => <div>{value || "-"}</div>;

  const approvalStatusTemplate = (rowData: any) =>
    choiceBadgeTemplate(rowData?.ApprovalStatus);

  const implementationStatusTemplate = (rowData: any) =>
    choiceBadgeTemplate(rowData?.ImplementationStatus);

  const billingImpactTemplate = (rowData: any) =>
    choiceBadgeTemplate(rowData?.BillingImpact);

  const severityTemplate = (rowData: any) =>
    choiceBadgeTemplate(rowData?.Severity);

  // ─── Filter Handling ─────────────────────────────────────────────────────

  const handleFilterChange = (field: string, value: string) => {
    setFilterValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyFilters = () => {
    const filtered = masterReportData.filter((item: any) => {
      const managerNames =
        item?.ProjectManager?.map((pm: IPeoplePickerDetails) =>
          pm.name?.toLowerCase(),
        ).join(" ") || "";

      const deliveryHeadNames =
        item?.DeliveryHead?.map((dh: IPeoplePickerDetails) =>
          dh.name?.toLowerCase(),
        ).join(" ") || "";

      const matchProjectID = item?.ProjectID?.toLowerCase().includes(
        filterValues.ProjectID.toLowerCase(),
      );

      const matchProjectName = item?.ProjectName?.toLowerCase().includes(
        filterValues.ProjectName.toLowerCase(),
      );

      const matchProjectManager = filterValues.ProjectManager
        ? managerNames.includes(filterValues.ProjectManager.toLowerCase())
        : true;

      const matchDeliveryHead = filterValues.DeliveryHead
        ? deliveryHeadNames.includes(filterValues.DeliveryHead.toLowerCase())
        : true;

      const matchApprovalStatus = filterValues.ApprovalStatus
        ? item?.ApprovalStatus === filterValues.ApprovalStatus
        : true;

      const matchImplementationStatus = filterValues.ImplementationStatus
        ? item?.ImplementationStatus === filterValues.ImplementationStatus
        : true;

      const matchBillingImpact = filterValues.BillingImpact
        ? item?.BillingImpact === filterValues.BillingImpact
        : true;

      const matchSeverity = filterValues.Severity
        ? item?.Severity === filterValues.Severity
        : true;

      return (
        matchProjectID &&
        matchProjectName &&
        matchProjectManager &&
        matchDeliveryHead &&
        matchApprovalStatus &&
        matchImplementationStatus &&
        matchBillingImpact &&
        matchSeverity
      );
    });

    // Maintain search chain
    if (searchVal) {
      const filteredSearch = filtered.filter((item) =>
        globalSearchMatch(item, searchVal),
      );
      setFilteredData(filteredSearch);
    } else {
      setFilteredData(filtered);
    }
  };

  React.useEffect(() => {
    applyFilters();
  }, [filterValues, searchVal]);

  // ─── Global Search ───────────────────────────────────────────────────────

  const globalSearchMatch = (item: any, val: string): boolean => {
    const v = val.toLowerCase();
    const managerNames =
      item?.ProjectManager?.map((pm: IPeoplePickerDetails) =>
        pm.name?.toLowerCase(),
      ).join(" ") || "";
    const deliveryHeadNames =
      item?.DeliveryHead?.map((dh: IPeoplePickerDetails) =>
        dh.name?.toLowerCase(),
      ).join(" ") || "";
    const assignedToNames =
      item?.AssignedTo?.map((at: IPeoplePickerDetails) =>
        at.name?.toLowerCase(),
      ).join(" ") || "";

    return (
      item.ProjectID?.toLowerCase().includes(v) ||
      item.ProjectName?.toLowerCase().includes(v) ||
      item.ClientName?.toLowerCase().includes(v) ||
      item.CustomerDisplayName?.toLowerCase().includes(v) ||
      item.CRID?.toLowerCase().includes(v) ||
      item.CRTitle?.toLowerCase().includes(v) ||
      item.ApprovalStatus?.toLowerCase().includes(v) ||
      item.ImplementationStatus?.toLowerCase().includes(v) ||
      item.BillingImpact?.toLowerCase().includes(v) ||
      item.Severity?.toLowerCase().includes(v) ||
      item.CRDescription?.toLowerCase().includes(v) ||
      item.EffortEstimate?.toString().toLowerCase().includes(v) ||
      managerNames.includes(v) ||
      deliveryHeadNames.includes(v) ||
      assignedToNames.includes(v)
    );
  };

  const searchCRDetails = (val: string) => {
    setSearchVal(val);

    const sourceData = masterReportData;

    if (!val) {
      applyFilters();
      return;
    }

    const filtered = sourceData.filter((item) => globalSearchMatch(item, val));
    setFilteredData(filtered);
  };

  // ─── Excel Export ────────────────────────────────────────────────────────

  const generateExcel = async (items: any[]) => {
    const workbook: any = new Excel.Workbook();
    const worksheet: any = workbook.addWorksheet("CR Report");

    worksheet.columns = [
      { header: "CR ID", key: "CRID", width: 15 },
      { header: "CR Title", key: "CRTitle", width: 30 },
      { header: "Project ID", key: "ProjectID", width: 15 },
      { header: "Project Name", key: "ProjectName", width: 30 },
      { header: "Client Name", key: "ClientName", width: 25 },
      { header: "Project Manager", key: "ProjectManager", width: 30 },
      { header: "Delivery Head", key: "DeliveryHead", width: 30 },
      { header: "Assigned To", key: "AssignedTo", width: 30 },
      { header: "Approval Status", key: "ApprovalStatus", width: 20 },
      {
        header: "Implementation Status",
        key: "ImplementationStatus",
        width: 25,
      },
      { header: "Billing Impact", key: "BillingImpact", width: 20 },
      { header: "Requested By", key: "RequestedBySLT", width: 20 },
      { header: "Severity", key: "Severity", width: 15 },
      { header: "Effort Estimate", key: "EffortEstimate", width: 20 },
      { header: "Request Date", key: "RequestDate", width: 20 },
      { header: "CR Description", key: "CRDescription", width: 40 },
    ];

    items.forEach((item) => {
      const projectManagers =
        item?.ProjectManager?.map((pm: any) => pm?.name).join(", ") || "-";
      const deliveryHeads =
        item?.DeliveryHead?.map((dh: any) => dh?.name).join(", ") || "-";
      const assignedTo =
        item?.AssignedTo?.map((at: any) => at?.name).join(", ") || "-";

      const row = worksheet.addRow({
        CRID: item.CRID || "-",
        CRTitle: item.CRTitle || "-",
        ProjectID: item.ProjectID || "-",
        ProjectName: item.ProjectName || "-",
        ClientName: item.ClientName || "-",
        ProjectManager: projectManagers,
        DeliveryHead: deliveryHeads,
        AssignedTo: assignedTo,
        ApprovalStatus: item.ApprovalStatus || "-",
        ImplementationStatus: item.ImplementationStatus || "-",
        BillingImpact: item.BillingImpact || "-",
        RequestedBySLT: item.RequestedBySLT || "-",
        Severity: item.Severity || "-",
        EffortEstimate: item.EffortEstimate || "-",
        RequestDate: item.RequestDate
          ? moment(item.RequestDate).format("DD/MM/YYYY")
          : "-",
        CRDescription: item.CRDescription || "-",
      });

      row.eachCell((cell: any) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "left" };
      });
    });

    // Header style
    worksheet.getRow(1).eachCell((cell: any) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "00a99d" },
      };
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    const now = new Date();
    const fileName = `CR_Report_${moment(now).format("DD_MM_YYYY_HH:mm")}.xlsx`;

    workbook.xlsx
      .writeBuffer()
      .then((buffer: any) => {
        FileSaver.saveAs(new Blob([buffer]), fileName);
      })
      .catch((err: any) => {
        console.log("Error writing excel export", err);
      });
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className={styles.lcaBody}>
      {/* Header + Action Buttons */}
      <div
        className={`${styles.filterBarAndTableBorder}
          ${ScreenWidth >= 1536 ? styles.filterBar_1536 : styles.filterBar_1396}`}
      >
        <div className={styles.filterBar}>
          <h2>Change Request Report</h2>
        </div>
        <div className={styles.filterBtns}>
          {/* Global Search */}
          <div className="all_search">
            <IconField iconPosition="left">
              <InputIcon className="pi pi-search" />
              <InputText
                value={searchVal}
                onChange={(e) => searchCRDetails(e.target.value)}
                placeholder="Search"
              />
            </IconField>
          </div>

          {/* Export Button */}
          <div className={styles.btnAndText}>
            <div
              className={styles.btnBackGround}
              style={{
                cursor: filteredData.length ? "pointer" : "not-allowed",
              }}
              onClick={() => {
                if (filteredData.length) generateExcel(filteredData);
              }}
            >
              <img src={ImportUploadImage} alt="export" />
              Export
            </div>
          </div>

          {/* Filter Toggle Button */}
          <div className={styles.btnAndText}>
            <div
              className={styles.btnBackGround}
              onClick={() => setFilterBar(!filterBar)}
            >
              <img
                src={filterBar ? FilterNoneImage : FilterImage}
                alt="filter"
              />
              Filter
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      {filterBar && (
        <div className={styles.filterFields}>
          {/* Project ID */}
          <div className={styles.filterField}>
            <label>Project ID</label>
            <InputText
              value={filterValues.ProjectID}
              onChange={(e) => handleFilterChange("ProjectID", e.target.value)}
              placeholder="Enter here"
            />
          </div>

          {/* Project Name */}
          <div className={styles.filterField}>
            <label>Project Name</label>
            <InputText
              value={filterValues.ProjectName}
              onChange={(e) =>
                handleFilterChange("ProjectName", e.target.value)
              }
              placeholder="Enter here"
            />
          </div>

          {/* Project Manager */}
          <div className={styles.filterField}>
            <label>Project Manager</label>
            <InputText
              value={filterValues.ProjectManager}
              onChange={(e) =>
                handleFilterChange("ProjectManager", e.target.value)
              }
              placeholder="Enter manager name"
            />
          </div>

          {/* Delivery Head */}
          <div className={styles.filterField}>
            <label>Delivery Head</label>
            <InputText
              value={filterValues.DeliveryHead}
              onChange={(e) =>
                handleFilterChange("DeliveryHead", e.target.value)
              }
              placeholder="Enter delivery head name"
            />
          </div>

          {/* Approval Status Dropdown */}
          <div className={`${styles.filterField} dropdown`}>
            <label>Approval Status</label>
            <Dropdown
              options={dropdownChoices.ApprovalStatus}
              optionLabel="name"
              placeholder="Select status"
              value={dropdownChoices.ApprovalStatus.find(
                (item) => item.name === filterValues.ApprovalStatus,
              )}
              onChange={(e) =>
                handleFilterChange("ApprovalStatus", e.value?.name)
              }
            />
          </div>

          {/* Implementation Status Dropdown */}
          <div className={`${styles.filterField} dropdown`}>
            <label>Status</label>
            <Dropdown
              options={dropdownChoices.ImplementationStatus}
              optionLabel="name"
              placeholder="Select status"
              value={dropdownChoices.ImplementationStatus.find(
                (item) => item.name === filterValues.ImplementationStatus,
              )}
              onChange={(e) =>
                handleFilterChange("ImplementationStatus", e.value?.name)
              }
            />
          </div>

          {/* Billing Impact Dropdown */}
          <div className={`${styles.filterField} dropdown`}>
            <label>Billing Impact</label>
            <Dropdown
              options={dropdownChoices.BillingImpact}
              optionLabel="name"
              placeholder="Select"
              value={dropdownChoices.BillingImpact.find(
                (item) => item.name === filterValues.BillingImpact,
              )}
              onChange={(e) =>
                handleFilterChange("BillingImpact", e.value?.name)
              }
            />
          </div>

          {/* Severity Dropdown */}
          <div className={`${styles.filterField} dropdown`}>
            <label>Severity</label>
            <Dropdown
              options={dropdownChoices.Severity}
              optionLabel="name"
              placeholder="Select severity"
              value={dropdownChoices.Severity.find(
                (item) => item.name === filterValues.Severity,
              )}
              onChange={(e) => handleFilterChange("Severity", e.value?.name)}
            />
          </div>

          {/* Reset Button */}
          <div className={styles.filterField} style={{ width: "3%" }}>
            <PrimaryButton
              styles={RefreshButton}
              iconProps={{ iconName: "refresh" }}
              className={styles.refresh}
              onClick={() => {
                setSearchVal("");
                setFilterValues({
                  ProjectID: "",
                  ProjectName: "",
                  ProjectManager: "",
                  DeliveryHead: "",
                  ApprovalStatus: "",
                  ImplementationStatus: "",
                  BillingImpact: "",
                  Severity: "",
                });
              }}
            />
          </div>
        </div>
      )}

      {/* Data Table */}
      <div
        className={`${styles.tableData} tableData reportData
          ${ScreenWidth >= 1536 ? "data_table_1536" : "data_table_1396"}`}
      >
        <DataTable
          tableStyle={{ minWidth: "140rem" }}
          value={filteredData}
          paginator
          rows={10}
        >
          <Column
            style={{ width: "8rem" }}
            sortable
            field="CRID"
            header="CR ID"
          />
          <Column
            style={{ width: "14rem" }}
            sortable
            field="CRTitle"
            header="CR Title"
          />
          <Column
            style={{ width: "8rem" }}
            sortable
            field="ProjectID"
            header="Project ID"
          />
          <Column
            style={{ width: "14rem" }}
            sortable
            field="ProjectName"
            header="Project Name"
          />
          <Column
            style={{ width: "10rem" }}
            sortable
            field="CRDescription"
            header="CR Description"
            body={crDescriptionTemplate}
          />
          <Column
            style={{ width: "12rem" }}
            sortable
            field="ApprovalStatus"
            header="Approval Status"
            body={approvalStatusTemplate}
          />
          <Column
            style={{ width: "15rem" }}
            sortable
            field="ImplementationStatus"
            header="Implementation Status"
            body={implementationStatusTemplate}
          />
          <Column
            style={{ width: "10rem" }}
            sortable
            field="RequestDate"
            header="Request Date"
            body={(rowData) => (
              <div>
                {rowData?.RequestDate
                  ? moment(rowData.RequestDate).format("DD/MM/YYYY")
                  : "-"}
              </div>
            )}
          />
          <Column
            style={{ width: "11rem" }}
            sortable
            field="EffortEstimate"
            header="Effort Estimate"
            body={(rowData) => <div>{rowData?.EffortEstimate || "-"}</div>}
          />
          <Column
            style={{ width: "10rem" }}
            sortable
            field="RequestedBySLT"
            header="Requested By"
            body={(rowData) => <div>{rowData?.RequestedBySLT || "-"}</div>}
          />
          <Column
            style={{ width: "10rem" }}
            sortable
            field="AssignedTo"
            header="Assigned To"
            body={renderAssignedToColumn}
          />
          <Column
            style={{ width: "10rem" }}
            sortable
            field="ClientName"
            header="Client Name"
          />
          <Column
            style={{ width: "12rem" }}
            sortable
            field="ProjectManager"
            header="Project Manager"
            body={renderProjectManagerColumn}
          />
          <Column
            style={{ width: "12rem" }}
            sortable
            field="DeliveryHead"
            header="Delivery Head"
            body={renderDeliveryHeadColumn}
          />
          <Column
            style={{ width: "11rem" }}
            sortable
            field="BillingImpact"
            header="Billing Impact"
            body={billingImpactTemplate}
          />
          <Column
            style={{ width: "8rem" }}
            sortable
            field="Severity"
            header="Severity"
            body={severityTemplate}
          />
        </DataTable>
      </div>
    </div>
  );
};

export default CRReport;
