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
  ProjectType: string;
  UpWork: boolean;
  InternalProject: boolean;
  ProjectManager: IPeoplePickerDetails[];
  DeliveryHead: IPeoplePickerDetails[];
  BA: IPeoplePickerDetails[];
  ProjectStatus: string;
  BillingModel: string;
  Budget: number;
  Hours: string;
  ClientName: string;
  Currency: string;
  CustomerDisplayName: string;
  CustomerID: string;
  BillingContactName: string;
  BillingContactEmail: string;
  BillingContactMobile: string;
  BillingAddress: string;
  Remarks: string;
  Status: string;
  DealProfit?: number;
  DealMargin?: number;
  FPMProfit?: number;
  FPMMargin?: number;
}

export interface IBasicDropDown {
  name: string;
}

export interface ICRMProjectsListDrop {
  projectStaus: IBasicDropDown[];
  BillingModel: IBasicDropDown[];
  Currency: IBasicDropDown[];
  ProjectType: IBasicDropDown[];
  Status: IBasicDropDown[];
}

export interface ICRMProjectRisksListDrop {
  RiskCategory: IBasicDropDown[];
  Probability: IBasicDropDown[];
  Impact: IBasicDropDown[];
  CurrentStatus: IBasicDropDown[];
  ResidualRisk: IBasicDropDown[];
  RiskOccurred: IBasicDropDown[];
}

export interface ICRMProjectCRsListDrop {
  ChangeType: IBasicDropDown[];
  Severity: IBasicDropDown[];
  Priority: IBasicDropDown[];
  ApprovalStatus: IBasicDropDown[];
  ImplementationStatus: IBasicDropDown[];
  BillingImpact: IBasicDropDown[];
}

export interface ICRMBillingsListDrop {
  Status: IBasicDropDown[];
  ProjectStatus: IBasicDropDown[];
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
  CreatedBy: IPeoplePickerDetails[];
  LastUpdatedBy: IPeoplePickerDetails[];
  AssignedTo: IPeoplePickerDetails[];
}

export interface IChangeRequestDetails {
  ID: number;
  CRId: string;
  ProjectId: string;
  CRTitle: string;
  CRDescription: string;
  // RequestedBy: IPeoplePickerDetails[];
  RequestedBySLT: string;
  RequestDate: string;
  ChangeType: string;
  Severity: string;
  Priority: string;
  EffortEstimate: number;
  EstimatedStartDate: string;
  EstimatedEndDate: string;
  ActualStartDate: string;
  ActualEndDate: string;
  AssignedTo: IPeoplePickerDetails[];
  ApprovalStatus: string;
  ApprovalComments: string;
  ImplementationStatus: string;
  ChangeImpactedModules: string;
  ChangeImpactDescription: string;
  CostImpact: number;
  BillingImpact: string;
  BillingDetailsAmount: string;
  Remarks: string;
  CreatedBy: IPeoplePickerDetails[];
  CreatedDate: string;
  LastUpdatedBy: IPeoplePickerDetails[];
  LastUpdatedDate: string;
}

// ─── Employee allocation (CommonTemplate / EmployeeAllocations) ───

export interface AllocationMonth {
  month: string; // "Apr-2025"
  value: number; // 0–1 (fraction of full-time)
}

export interface EmployeeAllocationRecord {
  ID: number;
  EmployeeName: string;
  EmployeeID: string;
  /** CRM project id from EmployeeAllocations list column ProjectID (e.g. PRJ-xxx) */
  ProjectID: string;
  ProjectTitle?: string;
  /** Same value as ProjectID — used for matching the open project */
  ProjectFullID?: string;
  Loading: number; // 0–1
  AllocatedOn: string | null; // ISO date string
  ReleasedOn: string | null;
  BeginDate: string | null;
  EndDate: string | null;
  AllocationJson: AllocationMonth[];
}

export interface DashboardStats {
  currentAllocation: number; // 0–1
  freePercent: number; // 0–1
  benchPercent: number; // 0–1
  activeProjects: string[];
  allocationHistory: { month: string; total: number }[];
  monthlyDistribution: AllocationMonth[];
}

/** Assignable capacity for a contiguous date range */
export interface EmployeeAvailabilityWindow {
  fromDate: string;
  toDate: string;
  allocatedPercent: number;
  usableCapacityPercent: number;
}

/** Cross-project availability for a searched employee */
export interface EmployeeAvailabilitySummary {
  totalAllocationToday: number;
  freePercent: number;
  isAvailableNow: boolean;
  /** When currently available: first day of the current free-capacity period */
  availableFrom: string | null;
  /** When fully booked: first future day free capacity is expected */
  availableAfter: string | null;
  activeProjectCount: number;
  /** Periods where capacity can be assigned to another project */
  availabilityWindows: EmployeeAvailabilityWindow[];
}

export interface DateRangeConflict {
  projectTitle: string;
  allocatedOn: string | null;
  releasedOn: string | null;
}

/** Table row shape for employee allocation UI */
export interface AllocationRow extends EmployeeAllocationRecord {
  isNewRow?: boolean;
  isEditing?: boolean;
}

/** CSS module slots for the cross-project availability summary */
export interface IEmployeeAvailabilitySummaryScss {
  availabilitySummary: string;
  availabilitySummaryHeader: string;
  availabilitySummaryGrid: string;
  availabilityStat: string;
  availabilityStatLabel: string;
  availabilityStatValue: string;
  availabilityStatSub: string;
  availabilityAvailableNow: string;
  availabilityFullyBooked: string;
  availabilityWindowsSection: string;
  availabilityWindowsTitle: string;
  availabilityWindowRow: string;
  availabilityWindowDates: string;
  availabilityWindowMetrics: string;
}

/** CSS module slots for the employee allocation dashboard */
export interface IEmployeeAllocationDashboardScss {
  dashboard: string;
  statCard: string;
  tealCard: string;
  sageCard: string;
  goldCard: string;
  crimsonCard: string;
  projectsCard: string;
  statIcon: string;
  statLabel: string;
  statValue: string;
  statSub: string;
  timelineBar: string;
  fill: string;
  miniChart: string;
  bar: string;
  overAllocated: string;
  projectList: string;
  projectTag: string;
}

/** CSS module slots for the new-allocation form panel */
export interface IEmployeeAllocationNewFormScss {
  formPanel: string;
  formGrid: string;
  formField: string;
  peoplePicker: string;
  readonlyField: string;
  formActions: string;
  btnSecondary: string;
  btnPrimary: string;
  monthChip: string;
  over: string;
  high: string;
  medium: string;
}

/** Props for `EmployeeAllocationNewFormPanel` in CommonTemplate */
export interface IEmployeeAllocationNewFormPanelProps {
  css: IEmployeeAllocationNewFormScss;
  formData: Partial<AllocationRow>;
  formPickerKey: number;
  webAbsoluteUrl: string;
  context: any;
  defaultSelectedEmails: string[];
  onPeopleChange: (items: any[]) => void;
  onEmployeeIdChange: (value: string) => void;
  onLoadingPctChange: (fraction: number) => void;
  onAllocatedOnIsoChange: (iso: string | null) => void;
  onReleasedOnIsoChange: (iso: string | null) => void;
  onCancel: () => void;
  onSave: () => void;
}
