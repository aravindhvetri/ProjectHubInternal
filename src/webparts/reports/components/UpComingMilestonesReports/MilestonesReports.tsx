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
import styles from "./MilestonesReports.module.scss";
import "../../../../External/CSS/Style.css";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  IBasicDropDown,
  ICRMProjectsListDrop,
  IPeoplePickerDetails,
  IProjectData,
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

const MilestonesReports = (props: any) => {
  //Local variables:
  const ScreenWidth: number = window.innerWidth;
  const FilterImage: string = require("../../../../External/Images/filter.png");
  const FilterNoneImage: string = require("../../../../External/Images/filternone.png");
  const ImportUploadImage: string = require("../../../../External/Images/fileupload.png");
  //Local States:
  const [filteredData, setFilteredData] = React.useState<any[]>([]);
  console.log("Filtered Data", filteredData);
  const [masterReportData, setMasterReportData] = React.useState<any[]>([]);
  const [filterBar, setFilterBar] = React.useState<boolean>(true);
  const [filterValues, setFilterValues] = React.useState({
    ProjectID: "",
    AccountName: "",
    ProjectName: "",
    ProjectManager: "",
    BillingModel: "",
    InvoiceTrigger: "",
  });
  const [searchVal, setSearchVal] = React.useState<string>("");
  const [
    initialCRMProejctsListDropContainer,
    setinitialCRMBillingsListDropContainer,
  ] = React.useState<ICRMProjectsListDrop>({
    ...Config.CRMProjectsDropDown,
  });

  //Initial render:
  React.useEffect(() => {
    getProjectAndBillingData();
  }, []);

  //Get Project and Billings data from respective lists:
  const getProjectAndBillingData = async () => {
    try {
      const projectRes: any = await SPServices.SPReadItems({
        Listname: Config.ListNames.CRMProjects,
        Select: "*,ProjectManager/Id,ProjectManager/EMail,ProjectManager/Title",
        Expand: "ProjectManager",
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

      const billingRes: any = await SPServices.SPReadItems({
        Listname: Config.ListNames.CRMBillings,
        Select: "*,Project/Id",
        Expand: "Project",
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
      console.log("billingRes", billingRes);

      // Build combined report data
      let combinedData: any[] = [];
      projectRes.forEach((project: any) => {
        let _ProjectManager: IPeoplePickerDetails[] = [];
        if (project?.ProjectManager) {
          project?.ProjectManager.forEach((user: any) => {
            _ProjectManager.push({
              id: user?.Id,
              name: user?.Title,
              email: user?.EMail,
            });
          });
        }

        const relatedBillings = billingRes.filter(
          (bill: any) => bill.ProjectId == project.ID,
        );

        if (relatedBillings.length > 0) {
          relatedBillings.forEach((billing: any) => {
            combinedData.push({
              ProjectID: project.ProjectID,
              IsDeleted: project.IsDelete,
              ProjectName: project.ProjectName,
              AccountName: project.AccountName,
              ProjectManager: _ProjectManager,
              BillingModel: project.BillingModel,
              StartDate: project.StartDate,
              PlannedEndDate: project.PlannedEndDate,
              Remarks: project.Remarks || "",
              BillingMileStone: billing.MileStoneName || "",
              DueDate: billing.DueDate,
              Amount: billing.Amount,
              InvoiceTrigger: billing.InvoiceTrigger,
              InvoiceID: billing.InvoiceID || "",
              Status: billing.Status,
              Currency: billing.Currency,
              ReminderDaysBeforeDue: billing.ReminderDaysBeforeDue || 7,
            });
          });
        } else {
          // Project without any billings
          combinedData.push({
            ProjectID: project.ProjectID,
            ProjectName: project.ProjectName,
            AccountName: project.AccountName,
            ProjectManager: _ProjectManager,
            BillingModel: project.BillingModel,
            StartDate: project.StartDate,
            PlannedEndDate: project.PlannedEndDate,
            Remarks: project.Remarks || "",
            BillingMileStone: "",
            DueDate: "",
            Amount: "",
            InvoiceTrigger: "",
            InvoiceID: "",
            Status: "",
            Currency: "",
            ReminderDaysBeforeDue: "",
          });
        }
      });
      const filteredStatusData = combinedData.filter(
        (item: any) => item.Status == "0",
      );
      setFilteredData([...filteredStatusData]);
      setMasterReportData([...filteredStatusData]);
      getAllChoices();
    } catch (error) {
      console.error(
        "Error fetching data in reports webpart main component.tsx page:",
        error,
      );
    }
  };

  //Get Choices from CRMProjects List:
  const getAllChoices = () => {
    SPServices.SPGetChoices({
      Listname: Config.ListNames.CRMProjects,
      FieldName: "BillingModel",
    })
      .then((res: any) => {
        let tempBillingModel: IBasicDropDown[] = [];
        if (res?.Choices?.length) {
          res?.Choices?.forEach((val: any) => {
            tempBillingModel.push({
              name: val,
            });
          });
        }
        setinitialCRMBillingsListDropContainer(
          (prev: ICRMProjectsListDrop) => ({
            ...prev,
            BillingModel: tempBillingModel,
          }),
        );
      })
      .catch((err) => {
        console.log(err, "Get choice error from CRMProjects list");
      });
  };

  //Render ProjectManager Column function:
  const renderProjectManagersColumn = (rowData: IProjectData) => {
    const projectManagers: IPeoplePickerDetails[] = rowData?.ProjectManager;
    return (
      <div>
        {rowData?.ProjectManager?.length > 1
          ? multiPeoplePickerTemplate(projectManagers)
          : peoplePickerTemplate(projectManagers[0])}
      </div>
    );
  };

  // Invoice Trigger Column Template
  const InvoiceTriggerTemplate = (rowData: any) => {
    return <div>{rowData?.InvoiceTrigger ? "Yes" : "No"}</div>;
  };

  // Remarks column template
  const remarksTemplate = (rowData: any) => {
    return (
      <div className="MultilinedisplayText" title={rowData?.Remarks}>
        {rowData?.Remarks || "-"}
      </div>
    );
  };

  // Milestone Column Template
  const milestoneTemplate = (rowData: any) => {
    return (
      <div className="MultilinedisplayText" title={rowData?.BillingMileStone}>
        {rowData?.BillingMileStone || "-"}
      </div>
    );
  };

  // Due Date Diff Template
  const dueDateDiffTemplate = (rowData: any) => {
    if (!rowData.DueDate) return "-";

    const today = new Date();
    const dueDate = new Date(rowData.DueDate);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return <div>{diffDays} days</div>;
  };

  //handle all filters:
  const handleFilterChange = (field: string, value: string) => {
    setFilterValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generate Excel function:
  const generateExcel = async (items: any[]) => {
    const workbook: any = new Excel.Workbook();
    const worksheet: any = workbook.addWorksheet("Upcoming Milestones Report");

    // Define columns
    worksheet.columns = [
      { header: "Project ID", key: "ProjectID", width: 15 },
      { header: "Project Name", key: "ProjectName", width: 30 },
      { header: "Account Name", key: "AccountName", width: 30 },
      { header: "Project Manager", key: "ProjectManager", width: 30 },
      { header: "Billing Model", key: "BillingModel", width: 20 },
      { header: "Milestone Name", key: "BillingMileStone", width: 30 },
      { header: "Milestone Due Date", key: "DueDate", width: 20 },
      { header: "Amount", key: "Amount", width: 15 },
      { header: "Days to Due Date", key: "DaysToDueDate", width: 20 },
      { header: "Invoice Raised?", key: "InvoiceTrigger", width: 15 },
      { header: "Remarks", key: "Remarks", width: 30 },
    ];

    const today = new Date();

    items.forEach((item) => {
      const projectManagers =
        item?.ProjectManager?.map((pm: any) => pm?.name).join(", ") || "-";

      let daysToDueDate = "-";
      if (item?.DueDate) {
        const dueDate = new Date(item.DueDate);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysToDueDate = `${diffDays} days`;
      }

      const row = worksheet.addRow({
        ProjectID: item.ProjectID || "-",
        ProjectName: item.ProjectName || "-",
        AccountName: item.AccountName || "-",
        ProjectManager: projectManagers,
        BillingModel: item.BillingModel || "-",
        BillingMileStone: item.BillingMileStone || "-",
        DueDate: item.DueDate ? moment(item.DueDate).format("DD/MM/YYYY") : "-",
        Amount: item.Amount || "-",
        DaysToDueDate: daysToDueDate,
        InvoiceTrigger: item.InvoiceTrigger ? "Yes" : "No",
        Remarks: item.Remarks || "-",
      });

      // Add borders and alignment
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

    // File name with timestamp
    const now = new Date();
    const fileName = `Upcoming_Milestones_Report_${moment(now).format(
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

  //Global Search functionalities:
  const searchProjectAndBillingsDetails = (val: string) => {
    setSearchVal(val);

    const sourceData =
      filteredData.length || Object.values(filterValues).some((v) => v)
        ? filteredData
        : masterReportData;

    if (!val) {
      setFilteredData(sourceData);
      return;
    }

    const filtered = sourceData.filter((item) => {
      const managerNames =
        item?.ProjectManager?.map((pm: IPeoplePickerDetails) =>
          pm.name?.toLowerCase(),
        ).join(" ") || "";
      return (
        item.ProjectID?.toLowerCase().includes(val.toLowerCase()) ||
        item.AccountName?.toLowerCase().includes(val.toLowerCase()) ||
        item.ProjectName?.toLowerCase().includes(val.toLowerCase()) ||
        item.BillingModel?.toLowerCase().includes(val.toLowerCase()) ||
        item?.Remarks?.toLowerCase().includes(val.toLowerCase()) ||
        item?.Amount?.toString().toLowerCase().includes(val.toLowerCase()) ||
        managerNames.includes(val.toLowerCase())
      );
    });

    setFilteredData(filtered);
  };

  //apply filters in purticular columns:
  const applyFilters = () => {
    const filtered = masterReportData.filter((item: any) => {
      const managerNames =
        item?.ProjectManager?.map((pm: IPeoplePickerDetails) =>
          pm.name?.toLowerCase(),
        ).join(" ") || "";

      const matchProjectID = item?.ProjectID?.toLowerCase().includes(
        filterValues.ProjectID.toLowerCase(),
      );
      const matchAccount = item?.AccountName?.toLowerCase().includes(
        filterValues.AccountName.toLowerCase(),
      );
      const matchProjectName = item?.ProjectName?.toLowerCase().includes(
        filterValues.ProjectName.toLowerCase(),
      );
      const matchProjectManager = filterValues.ProjectManager
        ? managerNames.includes(filterValues.ProjectManager.toLowerCase())
        : true;
      const matchInvoiceTrigger =
        filterValues.InvoiceTrigger === "" ||
        filterValues.InvoiceTrigger === null
          ? true
          : String(item?.InvoiceTrigger).toLowerCase() ===
            String(filterValues.InvoiceTrigger).toLowerCase();
      const matchBillingModel = filterValues?.BillingModel
        ? item?.BillingModel === filterValues?.BillingModel
        : true;

      return (
        matchProjectID &&
        matchAccount &&
        matchProjectName &&
        matchProjectManager &&
        matchInvoiceTrigger &&
        matchBillingModel
      );
    });

    setFilteredData(filtered);

    // maintain search chain
    if (searchVal) {
      const filteredSearch = filtered.filter((item) => {
        const managerNames =
          item?.ProjectManager?.map((pm: IPeoplePickerDetails) =>
            pm.name?.toLowerCase(),
          ).join(" ") || "";
        return (
          item.ProjectID?.toLowerCase().includes(searchVal.toLowerCase()) ||
          item.AccountName?.toLowerCase().includes(searchVal.toLowerCase()) ||
          item.ProjectName?.toLowerCase().includes(searchVal.toLowerCase()) ||
          item.BillingModel?.toLowerCase().includes(searchVal.toLowerCase()) ||
          item?.Remarks?.toLowerCase().includes(searchVal.toLowerCase()) ||
          item?.Amount?.toString()
            .toLowerCase()
            .includes(searchVal.toLowerCase()) ||
          managerNames.includes(searchVal.toLowerCase())
        );
      });
      setFilteredData(filteredSearch);
    } else {
      setFilteredData(filtered);
    }
  };

  //Apply filters when filter values change:
  React.useEffect(() => {
    applyFilters();
  }, [filterValues, searchVal]);

  return (
    <div className={styles.lcaBody}>
      <div
        className={`${styles.filterBarAndTableBorder} 
                ${
                  ScreenWidth >= 1536
                    ? styles.filterBar_1536
                    : styles.filterBar_1396
                }
                `}
      >
        <div className={styles.filterBar}>
          <h2>Upcoming Milestones Report (30 / 60 Days Lookahead)</h2>
        </div>
        <div className={styles.filterBtns}>
          <div className="all_search">
            <IconField iconPosition="left">
              <InputIcon className="pi pi-search"> </InputIcon>
              <InputText
                value={searchVal}
                onChange={(e) =>
                  searchProjectAndBillingsDetails(e.target.value)
                }
                v-model="value1"
                placeholder="Search"
              />
            </IconField>
          </div>
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
              <img src={ImportUploadImage} alt="no image" />
              Export
            </div>
          </div>

          <div className={styles.btnAndText}>
            <div
              className={styles.btnBackGround}
              onClick={() => setFilterBar(!filterBar)}
            >
              <img
                src={filterBar ? FilterNoneImage : FilterImage}
                alt="no image"
              />
              Filter
            </div>
          </div>
        </div>
      </div>
      {filterBar ? (
        <div className={styles.filterFields}>
          <div className={styles.filterField}>
            <label>Project Id</label>
            <InputText
              value={filterValues?.ProjectID}
              onChange={(e) => handleFilterChange("ProjectID", e.target.value)}
              placeholder="Enter here"
            />
          </div>
          <div className={styles.filterField}>
            <label>Project Manager</label>
            <InputText
              value={filterValues?.ProjectManager}
              onChange={(e) =>
                handleFilterChange("ProjectManager", e.target.value)
              }
              placeholder="Enter project manager name"
            />
          </div>
          <div className={styles.filterField}>
            <label>Account name</label>
            <InputText
              value={filterValues?.AccountName}
              onChange={(e) =>
                handleFilterChange("AccountName", e.target.value)
              }
              placeholder="Enter here"
            />
          </div>
          <div className={`${styles.filterField} dropdown`}>
            <label>Billing Model</label>
            <Dropdown
              options={initialCRMProejctsListDropContainer?.BillingModel}
              optionLabel="name"
              placeholder="Select a status"
              value={initialCRMProejctsListDropContainer?.BillingModel.find(
                (item) => item.name === filterValues?.BillingModel,
              )}
              onChange={(e) =>
                handleFilterChange("BillingModel", e.value?.name)
              }
            />
          </div>
          <div className={`${styles.filterField} dropdown`}>
            <label>Invoice Raised ?</label>
            <Dropdown
              options={[
                { label: "Yes", value: true },
                { label: "No", value: false },
              ]}
              optionLabel="label"
              placeholder="Select"
              value={filterValues.InvoiceTrigger}
              onChange={(e) => handleFilterChange("InvoiceTrigger", e.value)}
            />
          </div>
          <div className={styles.filterField} style={{ width: "3%" }}>
            <PrimaryButton
              styles={RefreshButton}
              iconProps={{ iconName: "refresh" }}
              className={styles.refresh}
              onClick={() => {
                setSearchVal("");
                setFilterValues({
                  ProjectID: "",
                  AccountName: "",
                  ProjectName: "",
                  ProjectManager: "",
                  BillingModel: "",
                  InvoiceTrigger: "",
                });
              }}
            />
          </div>
        </div>
      ) : (
        ""
      )}
      <div
        className={`${styles.tableData} tableData reportData
                    ${
                      ScreenWidth >= 1536
                        ? "data_table_1536"
                        : "data_table_1396"
                    }`}
      >
        <DataTable
          tableStyle={{ minWidth: "120rem" }}
          value={filteredData}
          paginator
          rows={10}
        >
          <Column sortable field="ProjectID" header="Project ID" />
          <Column sortable field="ProjectName" header="Project Name" />
          <Column sortable field="AccountName" header="Account Name" />
          <Column
            sortable
            field="ProjectManager"
            header="Project Manager"
            body={renderProjectManagersColumn}
          ></Column>
          <Column sortable field="BillingModel" header="Billing Model" />
          <Column
            sortable
            field="BillingMileStone"
            header="Milestone Name"
            body={milestoneTemplate}
          />
          <Column
            sortable
            field="DueDate"
            header="Milestone Due Date"
            body={(rowData) => {
              return (
                <div>
                  {rowData?.DueDate
                    ? moment(rowData?.DueDate).format("DD/MM/YYYY")
                    : "-"}
                </div>
              );
            }}
          />
          <Column sortable field="Amount" header="Amount" />
          <Column
            sortable
            field="DueDate"
            header="Days to Due Date"
            body={dueDateDiffTemplate}
          />
          <Column
            sortable
            field="ProjectID"
            header="Invoice Raised?"
            body={InvoiceTriggerTemplate}
          />
          <Column
            style={{ width: "15rem" }}
            sortable
            field="Remarks"
            header="Remarks"
            body={remarksTemplate}
          ></Column>
        </DataTable>
      </div>
    </div>
  );
};

export default MilestonesReports;
