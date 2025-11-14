/* eslint-disable prefer-const */
import {
  IButtonStyles,
  IDatePickerStyles,
  IPeoplePickerItemSelectedStyles,
} from "@fluentui/react";
import {
  IBillingsDetails,
  ICRMBillingsListDrop,
  ICRMProjectRisksListDrop,
  ICRMProjectsListDrop,
  IDelModal,
  IProjectRisksDetails,
} from "./interface";
import { IModalStyles } from "office-ui-fabric-react";

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
  };
  export const LibraryNames: ILibrary = {
    ProjectFiles: "ProjectFiles",
    ProjectFolderStructure: "ProjectFolderStructure",
  };
  export const GroupNames: IGroup = {
    PMO: "PMO",
    DH: "DH",
    Leads: "Leads",
  };
  export const CRMOwners: string = "Admins";
  export const CRMManagersGroup: string = "Managers";
  export const PagenationShow: number = 8;

  //CRMProjects List DropDown:
  export const CRMProjectsDropDown: ICRMProjectsListDrop = {
    projectStaus: [],
    BillingModel: [],
    Currency: [],
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

  //Initial Modal Config:
  export const initialModal: IDelModal = {
    isOpen: false,
    Id: null,
  };

  //CRMBillings List DropDown:
  export const CRMBillingsDropDown: ICRMBillingsListDrop = {
    Status: [],
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
    IdentifiedBy: [],
    AssignedTo: [],
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
    "1": "ProjectUpdatedByPMO",
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
