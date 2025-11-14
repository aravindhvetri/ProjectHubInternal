//peoplePicker interface:
export interface IPeoplePickerDetails {
  id: number;
  name: string;
  email: string;
}

//ProjectDatas Interface:
export interface IProjectData {
  ID: number;
  ProjectID: string;
  AccountManager: string;
  AccountName: string;
  ProjectName: string;
  StartDate: string;
  PlannedEndDate: string;
  ProjectManager: IPeoplePickerDetails[];
  DeliveryHead: IPeoplePickerDetails[];
  ProjectStatus: string;
  BillingModel: string;
  Budget: number;
  Hours: string;
  Currency: string;
  BillingContactName: string;
  BillingContactEmail: string;
  BillingContactMobile: string;
  BillingAddress: string;
  Remarks: string;
}

export interface IBasicDropDown {
  name: string;
}

export interface ICRMProjectsListDrop {
  projectStaus: IBasicDropDown[];
  BillingModel: IBasicDropDown[];
  Currency: IBasicDropDown[];
}

export interface ICRMProjectRisksListDrop {
  RiskCategory: IBasicDropDown[];
  Probability: IBasicDropDown[];
  Impact: IBasicDropDown[];
  CurrentStatus: IBasicDropDown[];
  ResidualRisk: IBasicDropDown[];
  RiskOccurred: IBasicDropDown[];
}

export interface ICRMBillingsListDrop {
  Status: IBasicDropDown[];
  Currency: IBasicDropDown[];
  BillingFrequency: IBasicDropDown[];
}

export interface IDelModal {
  isOpen: boolean;
  Id: number | null;
}

export interface IApproveModal {
  isOpen: boolean;
  Id: number | null;
  projectStatus: string;
}

//CRMBillings List Interface:
export interface IBillingsDetails {
  ID: number;
  MileStoneName: string;
  MileStoneDescription: string;
  CompletionPercentage: number;
  DueDate: string;
  Amount: null;
  TMAmount: null;
  Status: string;
  InvoiceID: string;
  ReminderDaysBeforeDue: string;
  Notes: string;
  Currency: string;
  MonthlyAmount: number;
  StartMonth: string;
  EndMonth: string;
  BillingFrequency: string;
  ResourceType: string;
  Rate: number;
  Hours: string;
  ProjectId: number;
}

//Project Risks Details Interface:
export interface IProjectRisksDetails {
  ID: number;
  ProjectID: string;
  RiskId: string;
  ProjectName: string;
  RiskTitle: string;
  RiskDescription: string;
  RiskCategory: string;
  DateIdentified: string;
  Probability: string;
  Impact: string;
  Severity: string;
  MitigationPlan: string;
  TargetResolutionDate: string;
  CurrentStatus: string;
  ResidualRisk: string;
  Remarks: string;
  DateClosed: string;
  RiskOccurred: string;
  IdentifiedBy: IPeoplePickerDetails[];
  AssignedTo: IPeoplePickerDetails[];
}
