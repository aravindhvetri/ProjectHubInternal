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
import SPServices from "../../../../External/CommonServices/SPServices";
import { Config } from "../../../../External/CommonServices/Config";
import {
  IPeoplePickerDetails,
  IProjectData,
} from "../../../../External/CommonServices/interface";
import styles from "../UpComingMilestonesReports/MilestonesReports.module.scss";
import "../../../../External/CSS/Style.css";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  multiPeoplePickerTemplate,
  peoplePickerTemplate,
} from "../../../../External/CommonServices/CommonTemplate";
import * as moment from "moment";
import * as FileSaver from "file-saver";
import * as Excel from "exceljs";

const PMwiseInvoiceComplianceReport = () => {
  //Local states:
  const [reportData, setReportData] = React.useState<any[]>([]);
  const [masterReportData, setMasterReportData] = React.useState<any[]>([]);
  console.log("reportData", reportData, masterReportData);
  // const [filterBar, setFilterBar] = React.useState<boolean>(false);
  const [searchVal, setSearchVal] = React.useState<string>("");

  //Local variables:
  const ScreenWidth: number = window.innerWidth;
  // const FilterImage: string = require("../../../../External/Images/filter.png");
  // const FilterNoneImage: string = require("../../../../External/Images/filternone.png");
  const ImportUploadImage: string = require("../../../../External/Images/fileupload.png");

  const getProjectAndBillingData = async () => {
    try {
      const projectRes: any = await SPServices.SPReadItems({
        Listname: Config.ListNames.CRMProjects,
        Select: "*,ProjectManager/Id,ProjectManager/Title,ProjectManager/EMail",
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

      let combinedData: any[] = [];

      projectRes.forEach((project: any) => {
        // Extract Project Manager details
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

        // Filter Billings for this Project
        const relatedBillings = billingRes.filter(
          (bill: any) => bill?.ProjectId === project?.ID
        );

        // Calculate counts
        const totalMilestones = relatedBillings.length;
        const invoicesRaisedOnTime = relatedBillings.filter(
          (b: any) => b.Status == "1"
        ).length;
        const delayedInvoices = relatedBillings.filter(
          (b: any) => b.Status == "4"
        ).length;
        const notRaisedYet = relatedBillings.filter(
          (b: any) => b.Status == "0"
        ).length;

        // Push summary
        combinedData.push({
          ProjectID: project.ProjectID,
          ProjectManager: _ProjectManager,
          Remarks: project.Remarks || "",
          TotalMilestones: totalMilestones,
          InvoicesRaisedOnTime: invoicesRaisedOnTime,
          DelayedInvoices: delayedInvoices,
          NotRaisedYet: notRaisedYet,
        });
      });

      setReportData([...combinedData]);
      setMasterReportData([...combinedData]);
    } catch (error) {
      console.error("Error fetching project billing summary:", error);
    }
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

  // Remarks column template
  const remarksTemplate = (rowData: any) => {
    return (
      <div className="MultilinedisplayText" title={rowData?.Remarks}>
        {rowData?.Remarks || "-"}
      </div>
    );
  };

  // Generate Excel function:
  const generateExcel = async (items: any[]) => {
    const workbook: any = new Excel.Workbook();
    const worksheet: any = workbook.addWorksheet("Billing Summary Report");

    //Define columns for your new report
    worksheet.columns = [
      { header: "Project Manager", key: "ProjectManager", width: 30 },
      { header: "Total Milestones", key: "TotalMilestones", width: 20 },
      {
        header: "Invoices Raised On Time",
        key: "InvoicesRaisedOnTime",
        width: 25,
      },
      { header: "Remarks", key: "Remarks", width: 30 },
      { header: "Delayed Invoices", key: "DelayedInvoices", width: 20 },
      { header: "Not Raised Yet", key: "NotRaisedYet", width: 20 },
    ];

    items.forEach((item) => {
      const projectManagers =
        item?.ProjectManager?.map((pm: any) => pm?.name).join(", ") || "-";

      //Add row data
      const row = worksheet.addRow({
        ProjectManager: projectManagers,
        TotalMilestones: item?.TotalMilestones || 0,
        InvoicesRaisedOnTime: item?.InvoicesRaisedOnTime || 0,
        DelayedInvoices: item?.DelayedInvoices || 0,
        NotRaisedYet: item?.NotRaisedYet || 0,
        Remarks: item?.Remarks || "-",
      });

      //Add borders and alignments
      row.eachCell((cell: any) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    });

    //Style header row
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

    //File name with timestamp
    const now = new Date();
    const fileName = `PM-wise_Invoice_Compliance_Report_${moment(now).format(
      "DD_MM_YYYY_HH:mm"
    )}.xlsx`;

    //Save the Excel file
    workbook.xlsx
      .writeBuffer()
      .then((buffer: any) => {
        FileSaver.saveAs(new Blob([buffer]), fileName);
      })
      .catch((err: any) => {
        console.error("Error writing Excel export:", err);
      });
  };

  //Global Search functionalities:
  const searchProjectAndBillingsDetails = (val: string) => {
    setSearchVal(val);

    if (!val) {
      setReportData(masterReportData);
      return;
    }

    const filtered = masterReportData.filter((item) => {
      const managerNames =
        item?.ProjectManager?.map((pm: IPeoplePickerDetails) =>
          pm.name?.toLowerCase()
        ).join(" ") || "";

      return (
        managerNames.includes(val.toLowerCase()) ||
        item?.Remarks?.toLowerCase().includes(val.toLowerCase()) ||
        item?.TotalMilestones?.toString()
          .toLowerCase()
          .includes(val.toLowerCase()) ||
        item?.InvoicesRaisedOnTime?.toString()
          .toLowerCase()
          .includes(val.toLowerCase()) ||
        item?.DelayedInvoices?.toString()
          .toLowerCase()
          .includes(val.toLowerCase()) ||
        item?.NotRaisedYet?.toString().toLowerCase().includes(val.toLowerCase())
      );
    });

    setReportData(filtered);
  };

  React.useEffect(() => {
    getProjectAndBillingData();
  }, []);
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
          <h2>PM-wise Invoice Compliance Report</h2>
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

          {/* <div className={styles.btnAndText}>
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
          </div> */}
        </div>
      </div>
      <div
        className={`${styles.tableData} tableData
                    ${
                      ScreenWidth >= 1536
                        ? "data_table_1536"
                        : "data_table_1396"
                    }`}
      >
        <DataTable value={reportData} paginator rows={10}>
          <Column
            sortable
            field="ProjectManager"
            header="Project Manager"
            body={renderProjectManagersColumn}
          ></Column>
          <Column
            sortable
            field="TotalMilestones"
            header="Total Milestones Due (Period)"
          />
          <Column
            sortable
            field="InvoicesRaisedOnTime"
            header="Invoices Raised On Time"
          />
          <Column sortable field="DelayedInvoices" header="Delayed Invoices" />
          <Column sortable field="NotRaisedYet" header="Not Raised Yet" />
          <Column
            field="Compliance %"
            header="Compliance %"
            body={(rowData) => {
              const total = rowData?.TotalMilestones || 0;
              const raised = rowData?.InvoicesRaisedOnTime || 0;
              const compliance = total > 0 ? (100 * raised) / total : 0;
              return `${Math.round(compliance)} %`;
            }}
            sortable
          />
          sortable
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

export default PMwiseInvoiceComplianceReport;
