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
import "../../../External/CSS/Style.css";
import SPServices from "../../../External/CommonServices/SPServices";

import { Config, RefreshButton } from "../../../External/CommonServices/Config";
import {
  IBasicDropDown,
  ICRMBillingsListDrop,
  IPeoplePickerDetails,
  IProjectData,
} from "../../../External/CommonServices/interface";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import * as moment from "moment";
import {
  multiPeoplePickerTemplate,
  peoplePickerTemplate,
} from "../../../External/CommonServices/CommonTemplate";
import styles from "./MainComponenet.module.scss";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { PrimaryButton } from "@fluentui/react";
import { Dropdown } from "primereact/dropdown";
import * as FileSaver from "file-saver";
import * as Excel from "exceljs";
import MilestonesReports from "./UpComingMilestonesReports/MilestonesReports";
import PMwiseInvoiceComplianceReport from "./PMwiseInvoiceComplianceReport/PMwiseInvoiceComplianceReport";

const MainComponent = (props: any) => {
  //Local variables:
  const ScreenWidth: number = window.innerWidth;
  const FilterImage: string = require("../../../External/Images/filter.png");
  const FilterNoneImage: string = require("../../../External/Images/filternone.png");
  const ImportUploadImage: string = require("../../../External/Images/fileupload.png");

  //Local states:
  const [
    initialCRMBillingsListDropContainer,
    setinitialCRMBillingsListDropContainer,
  ] = React.useState<ICRMBillingsListDrop>({
    ...Config.CRMBillingsDropDown,
  });
  const [searchVal, setSearchVal] = React.useState<string>("");
  console.log("searchVal", searchVal);
  const [filterBar, setFilterBar] = React.useState<boolean>(true);
  const [reportData, setReportData] = React.useState<any[]>([]);
  const [filteredData, setFilteredData] = React.useState<any[]>([]);

  const [masterReportData, setMasterReportData] = React.useState<any[]>([]);
  const [filterValues, setFilterValues] = React.useState({
    ProjectID: "",
    AccountManager: "",
    AccountName: "",
    Status: "",
    Currency: "",
    ProjectName: "",
    ProjectManager: "",
    InvoiceTrigger: "",
  });
  const [selectedReport, setSelectedReport] = React.useState<string>(
    "Project Billing Status Report",
  );

  //Function to fetch Project and Billing data and combine them for report:
  const getProjectAndBillingData = async () => {
    try {
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

        let _DeliverHead: IPeoplePickerDetails[] = [];
        if (project?.DeliveryHead) {
          project?.DeliveryHead.forEach((user: any) => {
            _DeliverHead.push({
              id: user?.Id,
              name: user?.Title,
              email: user?.EMail,
            });
          });
        }

        const relatedBillings = billingRes.filter(
          (bill: any) => bill.ProjectId == project.ID,
        );

        let receivedAmount = 0;
        relatedBillings.forEach((billing: any) => {
          if (billing.Status === "3") {
            if (project.BillingModel === "Milestone") {
              receivedAmount += Number(billing.Amount || 0);
            } else if (project.BillingModel === "FixedMonthly") {
              receivedAmount += Number(billing.MonthlyAmount || 0);
            } else if (project.BillingModel === "T&M") {
              receivedAmount += Number(billing.TMAmount || 0);
            }
          }
        });

        if (relatedBillings.length > 0) {
          relatedBillings.forEach((billing: any) => {
            combinedData.push({
              ProjectID: project.ProjectID,
              ProjectName: project.ProjectName,
              AccountName: project.AccountName,
              AccountManager: project.AccountManager,
              ProjectManager: _ProjectManager,
              DeliveryHead: _DeliverHead,
              BillingModel: project.BillingModel,
              StartDate: project.StartDate,
              PlannedEndDate: project.PlannedEndDate,
              Budget: project?.Budget,
              Remarks: project.Remarks || "",
              BillingMileStone: billing.MileStoneName || "",
              DueDate: billing.DueDate,
              Amount: billing.Amount,
              TMAmount: billing.TMAmount || "",
              MonthlyAmount: billing.MonthlyAmount || "",
              InvoiceTrigger: billing.InvoiceTrigger,
              InvoiceID: billing.InvoiceID || "",
              Status: billing.Status,
              Currency: billing.Currency,
              ReminderDaysBeforeDue: billing.ReminderDaysBeforeDue || 7,
              ReceivedAmount: receivedAmount,
            });
          });
        } else {
          // Project without any billings
          combinedData.push({
            ProjectID: project.ProjectID,
            ProjectName: project.ProjectName,
            AccountName: project.AccountName,
            AccountManager: project.AccountManager,
            ProjectManager: _ProjectManager,
            DeliveryHead: _DeliverHead,
            BillingModel: project.BillingModel,
            StartDate: project.StartDate,
            PlannedEndDate: project.PlannedEndDate,
            Budget: project?.Budget,
            Remarks: project.Remarks || "",
            BillingMileStone: "",
            DueDate: "",
            Amount: "",
            TMAmount: "",
            MonthlyAmount: "",
            InvoiceTrigger: "",
            InvoiceID: "",
            Status: "",
            Currency: "",
            ReminderDaysBeforeDue: "",
            ReceivedAmount: 0,
          });
        }
      });
      setReportData([...combinedData]);
      setMasterReportData([...combinedData]);
      getAllChoices();
    } catch (error) {
      console.error(
        "Error fetching data in reports webpart main component.tsx page:",
        error,
      );
    }
  };

  //Get All Choices in CRMBillings list:
  const getAllChoices = () => {
    SPServices.SPGetChoices({
      Listname: Config.ListNames?.CRMBillings,
      FieldName: "Status",
    })
      .then((res: any) => {
        let tempStatus: IBasicDropDown[] = [];
        if (res?.Choices?.length) {
          res?.Choices?.forEach((val: any) => {
            tempStatus.push({
              name: Config.statusLabelMap[val] || val,
            });
          });
        }
        setinitialCRMBillingsListDropContainer(
          (prev: ICRMBillingsListDrop) => ({
            ...prev,
            Status: tempStatus,
          }),
        );
        SPServices.SPGetChoices({
          Listname: Config.ListNames.CRMBillings,
          FieldName: "Currency",
        })
          .then((res: any) => {
            let tempCurrency: IBasicDropDown[] = [];
            if (res?.Choices?.length) {
              res?.Choices?.forEach((val: any) => {
                tempCurrency.push({
                  name: val,
                });
              });
            }
            setinitialCRMBillingsListDropContainer(
              (prev: ICRMBillingsListDrop) => ({
                ...prev,
                Currency: tempCurrency,
              }),
            );
          })
          .catch((err) => {
            console.log(err, "Get choice error from CRMProjects list");
          });
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

  //Render Delivery head Column function:
  const renderDeliveryHeadColumn = (rowData: IProjectData) => {
    const DeliveryHead: IPeoplePickerDetails[] = rowData?.DeliveryHead;
    console.log("DeliveryHead", DeliveryHead);
    return (
      <div>
        {rowData?.DeliveryHead?.length > 1
          ? multiPeoplePickerTemplate(DeliveryHead)
          : peoplePickerTemplate(DeliveryHead[0])}
      </div>
    );
  };

  // Milestone Column Template
  // const milestoneTemplate = (rowData: any) => {
  //   return (
  //     <div className="MultilinedisplayText" title={rowData?.BillingMileStone}>
  //       {rowData?.BillingMileStone || "-"}
  //     </div>
  //   );
  // };

  // Invoice Trigger Column Template
  const InvoiceTriggerTemplate = (rowData: any) => {
    return <div>{rowData?.InvoiceTrigger ? "Yes" : "No"}</div>;
  };

  // Amount Column Template
  const renderAmountTemplate = (rowData: any) => {
    return (
      <div>
        {rowData?.BillingModel == "Milestone"
          ? rowData?.Amount
          : rowData?.BillingModel == "T&M"
            ? rowData?.TMAmount
            : rowData?.MonthlyAmount || "-"}
      </div>
    );
  };

  // Invoice ID Column Template
  const InvoiceIDTemplate = (rowData: any) => {
    return <div>{rowData?.InvoiceID || "-"}</div>;
  };

  //Render status column function:
  const renderStatus = (rowData: any) => {
    return (
      <div>{Config.statusLabelMap[rowData?.Status] || rowData?.Status}</div>
    );
  };

  // Remarks column template
  const remarksTemplate = (rowData: any) => {
    return (
      <div className="MultilinedisplayText" title={rowData?.Remarks}>
        {rowData?.Remarks || "-"}
      </div>
    );
  };

  //handle all filters:
  const handleFilterChange = (field: string, value: string) => {
    setFilterValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  //Global Search functionalities:
  const searchProjectAndBillingsDetails = (val: string) => {
    setSearchVal(val);

    const sourceData =
      filteredData.length || Object.values(filterValues).some((v) => v)
        ? filteredData
        : masterReportData;

    if (!val) {
      setReportData(sourceData);
      return;
    }

    const filtered = sourceData.filter((item) => {
      const managerNames =
        item?.ProjectManager?.map((pm: IPeoplePickerDetails) =>
          pm.name?.toLowerCase(),
        ).join(" ") || "";
      const deliveryHeadNames =
        item?.DeliveryHead?.map((dh: IPeoplePickerDetails) =>
          dh.name?.toLowerCase(),
        ).join(" ") || "";
      return (
        item.ProjectID?.toLowerCase().includes(val.toLowerCase()) ||
        item.AccountManager?.toLowerCase().includes(val.toLowerCase()) ||
        item.AccountName?.toLowerCase().includes(val.toLowerCase()) ||
        item.ProjectName?.toLowerCase().includes(val.toLowerCase()) ||
        item.BillingModel?.toLowerCase().includes(val.toLowerCase()) ||
        (Config.statusLabelMap[item?.Status] || item?.Status)
          ?.toLowerCase()
          .includes(val.toLowerCase()) ||
        item?.InvoiceID?.toLowerCase().includes(val.toLowerCase()) ||
        item?.Remarks?.toLowerCase().includes(val.toLowerCase()) ||
        // item?.Amount?.toString().toLowerCase().includes(val.toLowerCase()) ||
        item.Currency?.toLowerCase().includes(val.toLowerCase()) ||
        managerNames.includes(val.toLowerCase()) ||
        deliveryHeadNames.includes(val.toLowerCase())
      );
    });

    setReportData(filtered);
  };

  // Export Project & Billing Reports Excel
  const generateExcel = (items: any): void => {
    const workbook: any = new Excel.Workbook();
    const worksheet: any = workbook.addWorksheet("Project & Billing Report");

    worksheet.columns = [
      { header: "Project ID", key: "ProjectID", width: 20 },
      { header: "Project Name", key: "ProjectName", width: 30 },
      { header: "Account Name", key: "AccountName", width: 25 },
      { header: "AccountManager", key: "AccountManager", width: 20 },
      { header: "Project Manager", key: "ProjectManager", width: 35 },
      { header: "Start Date", key: "StartDate", width: 20 },
      { header: "Planned End Date", key: "PlannedEndDate", width: 20 },
      { header: "Milestone", key: "BillingMileStone", width: 25 },
      { header: "Due Date", key: "DueDate", width: 20 },
      { header: "Currency", key: "Currency", width: 15 },
      { header: "Amount", key: "Amount", width: 15 },
      { header: "Billing Model", key: "BillingModel", width: 25 },
      { header: "Status", key: "Status", width: 20 },
      { header: "Invoice Raised ?", key: "InvoiceTrigger", width: 25 },
      { header: "Invoice No", key: "InvoiceID", width: 20 },
      { header: "Remarks", key: "Remarks", width: 30 },
    ];

    items.forEach((item: any) => {
      const projectManagers =
        item?.ProjectManager?.map((pm: any) => pm?.name).join(", ") || "-";

      const row = worksheet.addRow({
        ProjectID: item.ProjectID || "-",
        ProjectName: item.ProjectName || "-",
        AccountName: item.AccountName || "-",
        AccountManager: item.AccountManager || "-",
        ProjectManager: projectManagers,
        StartDate: item.StartDate
          ? moment(item.StartDate).format("DD/MM/YYYY")
          : "-",
        PlannedEndDate: item.PlannedEndDate
          ? moment(item.PlannedEndDate).format("DD/MM/YYYY")
          : "-",
        BillingMileStone: item.BillingMileStone || "-",
        DueDate: item.DueDate ? moment(item.DueDate).format("DD/MM/YYYY") : "-",
        Currency: item.Currency || "-",
        Amount: item.Amount || "-",
        BillingModel: item.BillingModel || "-",
        Status: Config.statusLabelMap[item.Status] || item.Status || "-",
        InvoiceTrigger: item.InvoiceTrigger ? "Yes" : "No",
        InvoiceID: item.InvoiceID || "-",
        Remarks: item.Remarks || "-",
      });

      // Add borders and alignment for each cell
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
    const fileName = `Project_Billing_Report_${moment(now).format(
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
      const matchLead = item?.AccountManager?.toLowerCase().includes(
        filterValues.AccountManager.toLowerCase(),
      );
      const matchAccount = item?.AccountName?.toLowerCase().includes(
        filterValues.AccountName.toLowerCase(),
      );
      const matchProjectName = item?.ProjectName?.toLowerCase().includes(
        filterValues.ProjectName.toLowerCase(),
      );
      const matchStatus = filterValues.Status
        ? (Config.statusLabelMap[item?.Status] || item?.Status) ===
          filterValues.Status
        : true;
      const matchCurrency = filterValues.Currency
        ? item?.Currency === filterValues.Currency
        : true;
      const matchProjectManager = filterValues.ProjectManager
        ? managerNames.includes(filterValues.ProjectManager.toLowerCase())
        : true;
      const matchInvoiceTrigger =
        filterValues.InvoiceTrigger === "" ||
        filterValues.InvoiceTrigger === null
          ? true
          : String(item?.InvoiceTrigger).toLowerCase() ===
            String(filterValues.InvoiceTrigger).toLowerCase();

      return (
        matchProjectID &&
        matchLead &&
        matchAccount &&
        matchProjectName &&
        matchStatus &&
        matchCurrency &&
        matchProjectManager &&
        matchInvoiceTrigger
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
          item.AccountManager?.toLowerCase().includes(
            searchVal.toLowerCase(),
          ) ||
          item.AccountName?.toLowerCase().includes(searchVal.toLowerCase()) ||
          item.ProjectName?.toLowerCase().includes(searchVal.toLowerCase()) ||
          item.BillingModel?.toLowerCase().includes(searchVal.toLowerCase()) ||
          (Config.statusLabelMap[item?.Status] || item?.Status)
            ?.toLowerCase()
            .includes(searchVal.toLowerCase()) ||
          item?.InvoiceID?.toLowerCase().includes(searchVal.toLowerCase()) ||
          item?.Remarks?.toLowerCase().includes(searchVal.toLowerCase()) ||
          item?.Budget?.toString()
            .toLowerCase()
            .includes(searchVal.toLowerCase()) ||
          item.Currency?.toLowerCase().includes(searchVal.toLowerCase()) ||
          managerNames.includes(searchVal.toLowerCase())
        );
      });
      setReportData(filteredSearch);
    } else {
      setReportData(filtered);
    }
  };

  //Apply filters when filter values change:
  React.useEffect(() => {
    applyFilters();
  }, [filterValues, searchVal]);

  //Initial data fetch:
  React.useEffect(() => {
    getProjectAndBillingData();
  }, []);

  return (
    <>
      <div className={styles.headerSection}>
        <h2>Reports</h2>
        <Dropdown
          value={selectedReport}
          options={[
            {
              label: "Project Billing Status Report",
              value: "Project Billing Status Report",
            },
            {
              label: "Upcoming Milestones Report",
              value: "Upcoming Milestones Report",
            },
            {
              label: "PM-wise Invoice Compliance Report",
              value: "PM-wise Invoice Compliance Report",
            },
          ]}
          onChange={(e) => setSelectedReport(e.value)}
          placeholder="Select Report"
          style={{ width: "16rem" }}
        />
      </div>
      {selectedReport === "Project Billing Status Report" && (
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
              <h2>Project Billing Status Report</h2>
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
                    cursor: reportData.length ? "pointer" : "not-allowed",
                  }}
                  onClick={() => {
                    if (reportData.length) generateExcel(reportData);
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
                  onChange={(e) =>
                    handleFilterChange("ProjectID", e.target.value)
                  }
                  placeholder="Enter here"
                />
              </div>
              <div className={styles.filterField}>
                <label>Project Name</label>
                <InputText
                  value={filterValues?.ProjectName}
                  onChange={(e) =>
                    handleFilterChange("ProjectName", e.target.value)
                  }
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
                <label>Account manager</label>
                <InputText
                  value={filterValues?.AccountManager}
                  onChange={(e) =>
                    handleFilterChange("AccountManager", e.target.value)
                  }
                  placeholder="Enter here"
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
                <label>Status</label>
                <Dropdown
                  options={initialCRMBillingsListDropContainer?.Status}
                  optionLabel="name"
                  placeholder="Select a status"
                  value={initialCRMBillingsListDropContainer?.Status.find(
                    (item) =>
                      item.name ===
                      (Config.statusLabelMap[filterValues?.Status] ||
                        filterValues?.Status),
                  )}
                  onChange={(e) => handleFilterChange("Status", e.value?.name)}
                />
              </div>
              <div className={`${styles.filterField} dropdown`}>
                <label>Currency</label>
                <Dropdown
                  options={initialCRMBillingsListDropContainer?.Currency}
                  optionLabel="name"
                  placeholder="Select a billing model"
                  value={initialCRMBillingsListDropContainer?.Currency.find(
                    (item) => item.name === filterValues?.Currency,
                  )}
                  onChange={(e) =>
                    handleFilterChange("Currency", e.value?.name)
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
                  onChange={(e) =>
                    handleFilterChange("InvoiceTrigger", e.value)
                  }
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
                      AccountManager: "",
                      AccountName: "",
                      Status: "",
                      Currency: "",
                      ProjectName: "",
                      ProjectManager: "",
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
              value={reportData}
              paginator
              rows={10}
              tableStyle={{ minWidth: "150rem" }}
            >
              <Column sortable field="ProjectID" header="Project Id"></Column>
              <Column
                sortable
                field="ProjectName"
                header="Project Name"
              ></Column>
              <Column
                sortable
                field="AccountName"
                header="Account Name"
              ></Column>
              <Column
                sortable
                field="AccountManager"
                header="Account manager"
              ></Column>
              <Column
                sortable
                field="ProjectManager"
                header="Project Manager"
                body={renderProjectManagersColumn}
              ></Column>
              <Column
                sortable
                field="DeliverHead"
                header="Delivery Head"
                body={renderDeliveryHeadColumn}
              ></Column>
              <Column
                sortable
                field="BillingModel"
                header="Billing Model"
              ></Column>
              <Column
                sortable
                field="StartDate"
                header="Start Date"
                body={(rowData) => {
                  return (
                    <div>
                      {rowData?.StartDate
                        ? moment(rowData?.StartDate).format("DD/MM/YYYY")
                        : ""}
                    </div>
                  );
                }}
              ></Column>
              <Column
                sortable
                field="PlannedEndDate"
                header="End Date"
                body={(rowData) => {
                  return (
                    <div>
                      {rowData?.PlannedEndDate
                        ? moment(rowData?.PlannedEndDate).format("DD/MM/YYYY")
                        : ""}
                    </div>
                  );
                }}
              ></Column>
              {/* <Column
                sortable
                field="BillingMileStone"
                header="Milestone"
                body={milestoneTemplate}
              ></Column> */}
              <Column
                sortable
                field="DueDate"
                header="Due Date"
                body={(rowData) => {
                  return (
                    <div>
                      {rowData?.DueDate
                        ? moment(rowData?.DueDate).format("DD/MM/YYYY")
                        : ""}
                    </div>
                  );
                }}
              ></Column>
              <Column sortable field="Currency" header="Currency"></Column>
              <Column
                sortable
                field="Amount"
                header="Invoice Amount"
                body={renderAmountTemplate}
              ></Column>
              <Column
                sortable
                field="ReceivedAmount"
                header="Received Amount"
              ></Column>
              <Column
                sortable
                field="InvoiceTrigger"
                header="Invoice Raised ?"
                body={InvoiceTriggerTemplate}
              ></Column>
              <Column
                sortable
                field="InvoiceID"
                header="Invoice No"
                body={InvoiceIDTemplate}
              ></Column>
              <Column
                sortable
                field="Status"
                header="Status"
                body={renderStatus}
              ></Column>
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
      )}

      {selectedReport === "Upcoming Milestones Report" && (
        <MilestonesReports projectAndBillingsDetails={masterReportData} />
      )}

      {selectedReport === "PM-wise Invoice Compliance Report" && (
        <PMwiseInvoiceComplianceReport />
      )}
    </>
  );
};

export default MainComponent;
