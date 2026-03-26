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

interface IRisksDropDown {
  RiskCategory: IBasicDropDown[];
  Impact: IBasicDropDown[];
  RiskOccurred: IBasicDropDown[];
  CurrentStatus: IBasicDropDown[];
}

interface IRisksFilterValues {
  ProjectID: string;
  ProjectName: string;
  ProjectManager: string;
  DeliveryHead: string;
  RiskCategory: string;
  Impact: string;
  RiskOccurred: string;
  CurrentStatus: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const RisksReport = (props: any) => {
  // Local variables:
  const ScreenWidth: number = window.innerWidth;
  const FilterImage: string = require("../../../../External/Images/filter.png");
  const FilterNoneImage: string = require("../../../../External/Images/filternone.png");
  const ImportUploadImage: string = require("../../../../External/Images/fileupload.png");

  // Local States:
  const [filteredData, setFilteredData] = React.useState<any[]>([]);
  const [masterReportData, setMasterReportData] = React.useState<any[]>([]);
  const [filterBar, setFilterBar] = React.useState<boolean>(true);
  const [filterValues, setFilterValues] = React.useState<IRisksFilterValues>({
    ProjectID: "",
    ProjectName: "",
    ProjectManager: "",
    DeliveryHead: "",
    RiskCategory: "",
    Impact: "",
    RiskOccurred: "",
    CurrentStatus: "",
  });
  const [searchVal, setSearchVal] = React.useState<string>("");
  const [dropdownChoices, setDropdownChoices] = React.useState<IRisksDropDown>({
    RiskCategory: [],
    Impact: [],
    RiskOccurred: [],
    CurrentStatus: [],
  });

  // ─── Initial Render ──────────────────────────────────────────────────────

  React.useEffect(() => {
    getRisksAndProjectDetails();
  }, []);

  // ─── Data Fetching ───────────────────────────────────────────────────────

  const getRisksAndProjectDetails = async () => {
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

      // Fetch CRMProjectRisks with AssignedTo person field expanded
      const risksRes: any = await SPServices.SPReadItems({
        Listname: Config.ListNames.CRMProjectRisks,
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

      // Combine risks with their project details
      let combinedData: any[] = [];

      risksRes.forEach((risk: any) => {
        const projectId: number = risk?.ProjectId ?? risk?.Project?.Id;
        const projectDetails = projectMap[projectId];

        // Parse AssignedTo (Person or Group field — may be single or multi)
        let _AssignedTo: IPeoplePickerDetails[] = [];
        if (risk?.AssignedTo) {
          // SPServices may return an array or a single object depending on field config
          const assignedToArr = Array.isArray(risk.AssignedTo)
            ? risk.AssignedTo
            : [risk.AssignedTo];
          assignedToArr.forEach((user: any) => {
            _AssignedTo.push({
              id: user?.Id,
              name: user?.Title,
              email: user?.EMail,
            });
          });
        }

        combinedData.push({
          // Risk fields
          RiskID: risk.RiskID || "",
          AssignedTo: _AssignedTo,
          CurrentStatus: risk.CurrentStatus || "",
          RiskOccurred: risk.RiskOccurred || "",
          Impact: risk.Impact || "",
          RiskDescription: risk.RiskDescription || "",
          TargetResolutionDate: risk?.TargetResolutionDate || null,
          RiskCategory: risk.RiskCategory || "",
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
      console.error("Error fetching data in RisksReport component:", error);
    }
  };

  // ─── Get Choice Columns ──────────────────────────────────────────────────

  const getAllChoices = () => {
    const choiceFields = [
      "RiskCategory",
      "Impact",
      "RiskOccurred",
      "CurrentStatus",
    ];

    choiceFields.forEach((fieldName) => {
      SPServices.SPGetChoices({
        Listname: Config.ListNames.CRMProjectRisks,
        FieldName: fieldName,
      })
        .then((res: any) => {
          let tempChoices: IBasicDropDown[] = [];
          if (res?.Choices?.length) {
            res.Choices.forEach((val: any) => {
              tempChoices.push({ name: val });
            });
          }
          setDropdownChoices((prev: IRisksDropDown) => ({
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

  // People picker renderer (ProjectManager / DeliveryHead)
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

  // Risk Description multiline template
  const riskDescriptionTemplate = (rowData: any) => (
    <div className="MultilinedisplayText" title={rowData?.RiskDescription}>
      {rowData?.RiskDescription || "-"}
    </div>
  );

  // Generic badge/chip template for choice fields
  const choiceBadgeTemplate = (value: string) => <div>{value || "-"}</div>;

  const riskCategoryTemplate = (rowData: any) =>
    choiceBadgeTemplate(rowData?.RiskCategory);

  const impactTemplate = (rowData: any) => choiceBadgeTemplate(rowData?.Impact);

  const riskOccurredTemplate = (rowData: any) =>
    choiceBadgeTemplate(rowData?.RiskOccurred);

  const currentStatusTemplate = (rowData: any) =>
    choiceBadgeTemplate(rowData?.CurrentStatus);

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

      const matchRiskCategory = filterValues.RiskCategory
        ? item?.RiskCategory === filterValues.RiskCategory
        : true;

      const matchImpact = filterValues.Impact
        ? item?.Impact === filterValues.Impact
        : true;

      const matchRiskOccurred = filterValues.RiskOccurred
        ? item?.RiskOccurred === filterValues.RiskOccurred
        : true;

      const matchCurrentStatus = filterValues.CurrentStatus
        ? item?.CurrentStatus === filterValues.CurrentStatus
        : true;

      return (
        matchProjectID &&
        matchProjectName &&
        matchProjectManager &&
        matchDeliveryHead &&
        matchRiskCategory &&
        matchImpact &&
        matchRiskOccurred &&
        matchCurrentStatus
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
      item.RiskID?.toLowerCase().includes(v) ||
      item.RiskCategory?.toLowerCase().includes(v) ||
      item.Impact?.toLowerCase().includes(v) ||
      item.RiskOccurred?.toLowerCase().includes(v) ||
      item.CurrentStatus?.toLowerCase().includes(v) ||
      item.RiskDescription?.toLowerCase().includes(v) ||
      managerNames.includes(v) ||
      deliveryHeadNames.includes(v) ||
      assignedToNames.includes(v)
    );
  };

  const searchRisksDetails = (val: string) => {
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
    const worksheet: any = workbook.addWorksheet("Risk Report");

    worksheet.columns = [
      { header: "Risk ID", key: "RiskID", width: 15 },
      { header: "Project ID", key: "ProjectID", width: 15 },
      { header: "Project Name", key: "ProjectName", width: 30 },
      { header: "Client Name", key: "ClientName", width: 25 },
      { header: "Project Manager", key: "ProjectManager", width: 30 },
      { header: "Delivery Head", key: "DeliveryHead", width: 30 },
      { header: "Assigned To", key: "AssignedTo", width: 30 },
      // { header: "Risk Category", key: "RiskCategory", width: 20 },
      { header: "Impact", key: "Impact", width: 15 },
      { header: "Risk Occurred", key: "RiskOccurred", width: 20 },
      { header: "Current Status", key: "CurrentStatus", width: 20 },
      { header: "Risk Description", key: "RiskDescription", width: 40 },
    ];

    items.forEach((item) => {
      const projectManagers =
        item?.ProjectManager?.map((pm: any) => pm?.name).join(", ") || "-";
      const deliveryHeads =
        item?.DeliveryHead?.map((dh: any) => dh?.name).join(", ") || "-";
      const assignedTo =
        item?.AssignedTo?.map((at: any) => at?.name).join(", ") || "-";

      const row = worksheet.addRow({
        RiskID: item.RiskID || "-",
        ProjectID: item.ProjectID || "-",
        ProjectName: item.ProjectName || "-",
        ClientName: item.ClientName || "-",
        ProjectManager: projectManagers,
        DeliveryHead: deliveryHeads,
        AssignedTo: assignedTo,
        // RiskCategory: item.RiskCategory || "-",
        Impact: item.Impact || "-",
        RiskOccurred: item.RiskOccurred || "-",
        CurrentStatus: item.CurrentStatus || "-",
        RiskDescription: item.RiskDescription || "-",
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
    const fileName = `Risk_Report_${moment(now).format(
      "DD_MM_YYYY_HH:mm",
    )}.xlsx`;

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
          <h2>Risk Report</h2>
        </div>
        <div className={styles.filterBtns}>
          {/* Global Search */}
          <div className="all_search">
            <IconField iconPosition="left">
              <InputIcon className="pi pi-search" />
              <InputText
                value={searchVal}
                onChange={(e) => searchRisksDetails(e.target.value)}
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

          {/* Risk Category Dropdown */}
          {/* <div className={`${styles.filterField} dropdown`}>
            <label>Risk Category</label>
            <Dropdown
              options={dropdownChoices.RiskCategory}
              optionLabel="name"
              placeholder="Select category"
              value={dropdownChoices.RiskCategory.find(
                (item) => item.name === filterValues.RiskCategory,
              )}
              onChange={(e) =>
                handleFilterChange("RiskCategory", e.value?.name)
              }
            />
          </div> */}

          {/* Impact Dropdown */}
          <div className={`${styles.filterField} dropdown`}>
            <label>Impact</label>
            <Dropdown
              options={dropdownChoices.Impact}
              optionLabel="name"
              placeholder="Select impact"
              value={dropdownChoices.Impact.find(
                (item) => item.name === filterValues.Impact,
              )}
              onChange={(e) => handleFilterChange("Impact", e.value?.name)}
            />
          </div>

          {/* Risk Occurred Dropdown */}
          <div className={`${styles.filterField} dropdown`}>
            <label>Risk Occurred</label>
            <Dropdown
              options={dropdownChoices.RiskOccurred}
              optionLabel="name"
              placeholder="Select"
              value={dropdownChoices.RiskOccurred.find(
                (item) => item.name === filterValues.RiskOccurred,
              )}
              onChange={(e) =>
                handleFilterChange("RiskOccurred", e.value?.name)
              }
            />
          </div>

          {/* Current Status Dropdown */}
          <div className={`${styles.filterField} dropdown`}>
            <label>Current Status</label>
            <Dropdown
              options={dropdownChoices.CurrentStatus}
              optionLabel="name"
              placeholder="Select status"
              value={dropdownChoices.CurrentStatus.find(
                (item) => item.name === filterValues.CurrentStatus,
              )}
              onChange={(e) =>
                handleFilterChange("CurrentStatus", e.value?.name)
              }
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
                  RiskCategory: "",
                  Impact: "",
                  RiskOccurred: "",
                  CurrentStatus: "",
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
          tableStyle={{ minWidth: "118rem" }}
          value={filteredData}
          paginator
          rows={10}
        >
          <Column
            style={{ width: "7rem" }}
            sortable
            field="RiskID"
            header="Risk ID"
          />
          <Column
            style={{ width: "7rem" }}
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
            field="RiskDescription"
            header="Risk Description"
            body={riskDescriptionTemplate}
          />
          <Column
            style={{ width: "10rem" }}
            sortable
            field="CurrentStatus"
            header="Current Status"
            body={currentStatusTemplate}
          />
          <Column
            style={{ width: "10rem" }}
            sortable
            field="TargetResolutionDate"
            header="Target date"
            body={(rowData) => {
              const today = moment().startOf("day");
              const targetDate = rowData?.TargetResolutionDate
                ? moment(rowData.TargetResolutionDate).startOf("day")
                : null;

              const isPast = targetDate && targetDate.isBefore(today);

              return (
                <div style={{ color: isPast ? "red" : "blue" }}>
                  {targetDate ? targetDate.format("DD/MM/YYYY") : ""}
                </div>
              );
            }}
          ></Column>
          <Column
            style={{ width: "10rem" }}
            sortable
            field="AssignedTo"
            header="Owner"
            body={renderAssignedToColumn}
          />
          <Column
            style={{ width: "10rem" }}
            sortable
            field="RiskOccurred"
            header="Risk Occurred"
            body={riskOccurredTemplate}
          />
          <Column
            style={{ width: "10rem" }}
            sortable
            field="ClientName"
            header="Client Name"
          />
          <Column
            style={{ width: "10rem" }}
            sortable
            field="ProjectManager"
            header="Project Manager"
            body={renderProjectManagerColumn}
          />
          <Column
            style={{ width: "10rem" }}
            sortable
            field="DeliveryHead"
            header="Delivery Head"
            body={renderDeliveryHeadColumn}
          />
          {/* <Column
            style={{ width: "10rem" }}
            sortable
            field="RiskCategory"
            header="Risk Category"
            body={riskCategoryTemplate}
          /> */}
          <Column
            style={{ width: "6rem" }}
            sortable
            field="Impact"
            header="Impact"
            body={impactTemplate}
          />
        </DataTable>
      </div>
    </div>
  );
};

export default RisksReport;
