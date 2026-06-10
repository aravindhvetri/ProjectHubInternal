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
import {
  IButtonStyles,
  IDatePickerStyles,
  IPeoplePickerItemSelectedStyles,
} from "@fluentui/react";
import {
  IBillingsDetails,
  IChangeRequestDetails,
  ICRMBillingsListDrop,
  ICRMProjectCRsListDrop,
  ICRMProjectRisksListDrop,
  ICRMProjectsListDrop,
  IDelModal,
  IProjectRisksDetails,
} from "./interface";
import { IModalStyles } from "office-ui-fabric-react";
import * as moment from "moment";
import * as FileSaver from "file-saver";
import * as Excel from "exceljs";

/* eslint-disable @typescript-eslint/no-namespace */
export namespace Config {
  export const ListNames: IList = {
    CRMAccounts: "CRMAccounts",
    CRMContacts: "CRMContacts",
    CRMDeals: "CRMDeals",
    CRMLeads: "CRMLeads",
    CRMProjects: "CRMProjects",
    DealsKanbanOrder: "DealsKanbanOrder",
    PipeLineConfig: "PipeLineConfig",
    PMOpportunity: "PMOpportunity",
    CRMBillings: "CRMBillings",
    RejectComments: "RejectComments",
    CRMProjectRisks: "CRMProjectRisks",
    QuickLinks: "QuickLinks",
    CRMProjectCRs: "CRMProjectCRs",
    DealSheetDirectCost: "DealSheetDirectCost",
    SalaryRangeRoleWise: "SalaryRangeRoleWise",
    DealSheetConfigurationList: "DealSheetConfigurationList",
    ProjectConfiguration: "ProjectConfiguration",
    EmployeePartialAllocation: "EmployeePartialAllocation",
    InternalRegistry: "InternalRegistry",
    FPMMaster: "FPMMaster",
    ProjectChecklist: "CRMProjectChecklist",
    EmployeeAllocations: "EmployeeAllocations",
    AllocationsApproval: "AllocationsApproval",
    AllocationsApprovalRejectComments: "AllocationsApprovalRejectComments",
  };
  export const LibraryNames: ILibrary = {
    ProjectFiles: "ProjectFiles",
    ProjectFolderStructure: "ProjectFolderStructure",
  };
  export const GroupNames: IGroup = {
    PMO: "PMO",
    DH: "DH",
    Leads: "Leads",
    BA: "BA",
    Finance: "Finance",
    PM: "PM",
  };
  export const CRMOwners: string = "Admins";
  export const CRMManagersGroup: string = "Managers";
  export const PagenationShow: number = 8;

  //CRMProjects List DropDown:
  export const CRMProjectsDropDown: ICRMProjectsListDrop = {
    projectStaus: [],
    BillingModel: [],
    Currency: [],
    ProjectType: [],
    Status: [],
  };

  //CRMProjectsRisks List DropDown:
  export const CRMProjectRisksDropDown: ICRMProjectRisksListDrop = {
    RiskCategory: [],
    Probability: [],
    Impact: [],
    CurrentStatus: [],
    ResidualRisk: [],
    RiskOccurred: [],
  };

  //CRMProjectCRs List DropDown:
  export const CRMProjectCRsDropDown: ICRMProjectCRsListDrop = {
    ChangeType: [],
    Severity: [],
    Priority: [],
    ApprovalStatus: [],
    ImplementationStatus: [],
    BillingImpact: [],
  };

  //Initial Modal Config:
  export const initialModal: IDelModal = {
    isOpen: false,
    Id: null,
  };

  //CRMBillings List DropDown:
  export const CRMBillingsDropDown: ICRMBillingsListDrop = {
    Status: [],
    ProjectStatus: [],
    Currency: [],
    BillingFrequency: [],
  };

  //Modal popup Style:
  export const delModalStyle: Partial<IModalStyles> = {
    main: {
      minHeight: "150px",
      width: "25%",
      padding: "20px",
    },
  };

  //Billing Details Configurations:
  export const CRMBillingsDetails: IBillingsDetails = {
    ID: 0,
    MileStoneName: "",
    MileStoneDescription: "",
    CompletionPercentage: 0,
    DueDate: "",
    Amount: null,
    TMAmount: null,
    Status: "",
    InvoiceID: "",
    ReminderDaysBeforeDue: "",
    Notes: "",
    Currency: "",
    MonthlyAmount: 0,
    DummyInvoice: false,
    StartMonth: "",
    EndMonth: "",
    BillingFrequency: "",
    ResourceType: "",
    Rate: 0,
    Hours: "",
    ProjectId: 0,
  };

  //Project Risks Details Configurations:
  export const initialProjectRisksDetails: IProjectRisksDetails = {
    ID: 0,
    RiskId: "",
    ProjectID: "",
    ProjectName: "",
    RiskTitle: "",
    RiskDescription: "",
    RiskCategory: "",
    DateIdentified: "",
    Probability: "",
    Impact: "",
    Severity: "",
    MitigationPlan: "",
    TargetResolutionDate: "",
    CurrentStatus: "",
    ResidualRisk: "",
    Remarks: "",
    DateClosed: "",
    RiskOccurred: "",
    CreatedBy: [],
    LastUpdatedBy: [],
    IdentifiedBy: [],
    AssignedTo: [],
  };

  //Project Change Request Details configurations:
  export const initialProjectChangeRequestDetails: IChangeRequestDetails = {
    ID: 0,
    CRId: "",
    ProjectId: "",
    CRTitle: "",
    CRDescription: "",
    // RequestedBy: [],
    RequestedBySLT: "",
    RequestDate: "",
    ChangeType: "",
    Severity: "",
    Priority: "",
    EffortEstimate: 0,
    EstimatedStartDate: "",
    EstimatedEndDate: "",
    ActualStartDate: "",
    ActualEndDate: "",
    AssignedTo: [],
    ApprovalStatus: "",
    ApprovalComments: "",
    ImplementationStatus: "",
    ChangeImpactedModules: "",
    ChangeImpactDescription: "",
    CostImpact: 0,
    BillingImpact: "",
    BillingDetailsAmount: "",
    Remarks: "",
    CreatedBy: [],
    CreatedDate: "",
    LastUpdatedBy: [],
    LastUpdatedDate: "",
  };

  //Billings status configurations:
  export const statusLabelMap: { [key: string]: string } = {
    "0": "Not generated invoice",
    "1": "Invoice raised",
    "2": "Invoice generated to Zoho",
    "3": "Paid",
    "4": "Over due",
    "5": "Void",
    "6": "Cancelled",
  };

  export const statusReverseMap: { [key: string]: string } = {
    "Not generated invoice": "0",
    "Invoice raised": "1",
    "Invoice generated to Zoho": "2",
    Paid: "3",
    "Over due": "4",
    Void: "5",
    Cancelled: "6",
  };

  //Projects Status configurations:
  export const projectStatusMap: { [key: string]: string } = {
    "0": "Draft",
    "1": "ProjectUpdated",
    "2": "PendingWithPM",
    "3": "PendingwithDH",
    "4": "RejectedByPM",
    "5": "RejectedByDH",
    "6": "Approved",
  };

  export const projectStatusReverseMap: { [key: string]: string } = {
    Draft: "0",
    ProjectUpdatedByPMO: "1",
    PendingWithPM: "2",
    PendingwithDH: "3",
    RejectedByPM: "4",
    RejectedByDH: "5",
    Approved: "6",
  };

  //RiskValue configurations:
  export const riskValueMap: any = {
    Low: 1,
    Medium: 2,
    High: 3,
  };

  //Month maps:
  export const monthMap: any = {
    JAN: "January",
    FEB: "February",
    MAR: "March",
    APR: "April",
    MAY: "Maymonth",
    JUN: "June",
    JUL: "July",
    AUG: "August",
    SEP: "September",
    OCT: "Octobar",
    NOV: "November",
    DEC: "December",
  };

  export const monthIndexMap: any = {
    JAN: 0,
    FEB: 1,
    MAR: 2,
    APR: 3,
    MAY: 4,
    JUN: 5,
    JUL: 6,
    AUG: 7,
    SEP: 8,
    OCT: 9,
    NOV: 10,
    DEC: 11,
  };

  export const monthKeys = [
    "APR2025",
    "MAY2025",
    "JUN2025",
    "JUL2025",
    "AUG2025",
    "SEP2025",
    "OCT2025",
    "NOV2025",
    "DEC2025",
    "JAN2026",
    "FEB2026",
    "MAR2026",
    "APR2026",
    "MAY2026",
    "JUN2026",
  ];

  export const MONTH_KEYS = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  export const MONTH_ABBRS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  export const benchProject = "PRJ-2026-128";

  export const getDefaultFromTo = (cols: string[]) => {
    if (!cols.length) return { from: "", to: "" };
    const now = new Date();
    const toKey = `${Config.MONTH_KEYS[now.getMonth()]}${now.getFullYear()}`;
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 4, 1);
    const fromKey = `${Config.MONTH_KEYS[fromDate.getMonth()]}${fromDate.getFullYear()}`;

    const colDates = cols.map((c) => colKeyToDate(c).getTime());
    const minAvailable = cols[colDates.indexOf(Math.min(...colDates))];
    const maxAvailable = cols[colDates.indexOf(Math.max(...colDates))];

    const clamp = (key: string) => {
      const d = colKeyToDate(key).getTime();
      if (d < colKeyToDate(minAvailable).getTime()) return minAvailable;
      if (d > colKeyToDate(maxAvailable).getTime()) return maxAvailable;
      if (cols.includes(key)) return key;
      return [...cols].sort(
        (a, b) =>
          Math.abs(colKeyToDate(a).getTime() - d) -
          Math.abs(colKeyToDate(b).getTime() - d),
      )[0];
    };

    return { from: clamp(fromKey), to: clamp(toKey) };
  };

  export const getCurrentMonthKey = (): string => {
    const now = new Date();
    return `${Config.MONTH_KEYS[now.getMonth()]}${now.getFullYear()}`;
  };

  export const parseColumnKey = (
    key: string,
  ): { month: number; year: number } => {
    const monthAbbr = key.slice(0, 3).toUpperCase();
    const year = parseInt(key.slice(3), 10);
    return { month: Config.MONTH_KEYS.indexOf(monthAbbr), year };
  };

  export const colKeyToDate = (key: string): Date => {
    const { month, year } = parseColumnKey(key);
    return new Date(year, month, 1);
  };

  export const formatColLabel = (key: string): string => {
    const monthName = key.slice(0, 3);
    const year = key.slice(3);
    return `${monthName.charAt(0) + monthName.slice(1).toLowerCase()}-${year}`;
  };

  /** Converts a raw allocation fraction (0–1) to a rounded whole-number percentage. */
  export const toMonthPercentage = (rawValue: unknown): number =>
    Math.round((Number(rawValue) || 0) * 100);

  /** Rounds a month percentage for display (handles float noise from backend/calculation). */
  export const formatMonthDisplayValue = (value: unknown): number =>
    Math.round(Number(value) || 0);

  /** PrimeReact Column body template for dynamic month columns in Reports. */
  export const monthColumnBodyTemplate =
    (field: string) =>
    (rowData: any): number =>
      formatMonthDisplayValue(rowData?.[field]);

  export const generateExcel = async (
    items: any[],
    monthColumns: any,
    sheetName: string,
  ) => {
    const workbook: any = new Excel.Workbook();
    const worksheet: any = workbook.addWorksheet(sheetName);

    // Static columns
    const staticColumns = [
      { header: "Project ID", key: "ProjectID", width: 20 },
      { header: "Employee ID", key: "EmployeeID", width: 20 },
      { header: "Employee Name", key: "EmployeeName", width: 25 },
      { header: "Designation", key: "Designation", width: 20 },
      { header: "Function", key: "Function", width: 20 },
      { header: "Reporting Manager", key: "ReportingManager", width: 20 },
      { header: "Technology", key: "Technology", width: 20 },
    ];

    // Dynamic month columns
    const dynamicColumns = monthColumns.map((month: any) => {
      const monthName = month.slice(0, 3);
      const year = month.slice(3);

      return {
        header: `${monthName}-${year}`,
        key: month,
        width: 15,
      };
    });

    worksheet.columns = [...staticColumns, ...dynamicColumns];

    // Add rows
    items.forEach((item) => {
      let rowObj: any = {
        ProjectID: item.ProjectID || "-",
        EmployeeID: item.EmployeeID || "-",
        EmployeeName: item.EmployeeName || "-",
        Designation: item.Designation || "-",
        Function: item.Function || "-",
        ReportingManager: item.ReportingManager || "-",
        Technology: item.Technology || "-",
      };

      monthColumns.forEach((month: any) => {
        rowObj[month] = formatMonthDisplayValue(item[month] ?? 0);
      });

      const row = worksheet.addRow(rowObj);

      // borders
      row.eachCell((cell: any) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "center" };
      });
    });

    // Header style
    worksheet.getRow(1).eachCell((cell: any) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "00a99d" },
      };

      cell.font = {
        bold: true,
        color: { argb: "FFFFFF" },
      };

      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // File name
    const now = new Date();
    const fileName = `${sheetName}_${moment(now).format(
      "DD_MM_YYYY_HH_mm",
    )}.xlsx`;

    workbook.xlsx
      .writeBuffer()
      .then((buffer: any) => {
        FileSaver.saveAs(new Blob([buffer]), fileName);
      })
      .catch((err: any) => {
        console.log("Excel export error", err);
      });
  };
}

//Refresh button Common Styles:
export const RefreshButton: Partial<IButtonStyles> = {
  root: {
    height: "33.25px",
    i: {
      fontWeight: "600 !important",
    },
  },
};

//DatePicker Styles:
export const DatePickerStyles: Partial<IDatePickerStyles> = {
  root: {
    ".ms-TextField-wrapper": {
      ".ms-TextField-fieldGroup": {
        border: "1px solid #00a99d",
        borderRadius: "6px",
        i: {
          color: "#00a99d !important",
        },
        "::after": {
          border: "none !important",
        },
        ".ms-TextField-field": {
          fontSize: "12px !important",
        },
      },
    },
  },
  callout: {
    ".ms-CalendarDay-dayIsToday": {
      backgroundColor: "#00a99d !important",
    },
  },
};

//PeoplePicker Styles:
export const peoplePickerStyles: Partial<IPeoplePickerItemSelectedStyles> = {
  root: {
    border: "1px solid #00A99D",
    borderRadius: "6px",
    outline: "none !important",
    borderLeftWidth: "3.5px",
    borderLeftColor: "#ff0000",
    fontSize: "12px !important",
    ".ms-BasePicker-text": {
      borderColor: "transparent !important",
      backgroundColor: "#fff !important",
      borderRadius: "6px !important",
      "::after": {
        border: "none !important",
        background: "rgb(255 255 255 / 0%)",
      },
      ".ms-BasePicker-input": {
        background: "#fff !important",
      },
      ".ms-Persona-primaryText": {
        color: "#000 !important",
        fontWeight: "400 !important",
        fontSize: "12px !important",
      },
    },
    ".ms-PickerPersona-container.is-selected": {
      background: "#00A99D !important",
    },
  },
};

//PeoplePicker Error Design:
export const peopleErrorPickerStyles: Partial<IPeoplePickerItemSelectedStyles> =
  {
    root: {
      border: "2px solid #ff0000",
      borderRadius: "6px",
      outline: "none !important",
      ".ms-BasePicker-text": {
        borderColor: "transparent !important",
        "::after": {
          border: "none !important",
        },
        ".ms-BasePicker-input": {
          background: "#fff !important",
        },
      },
    },
  };
