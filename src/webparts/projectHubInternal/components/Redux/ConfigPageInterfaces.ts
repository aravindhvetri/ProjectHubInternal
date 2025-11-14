/* eslint-disable @rushstack/no-new-null */
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IConfigState {
  context: any | null;
  allChoicesData: IAllChoiceColumn;
  siteUsers: ISiteUsers[];
  siteManagerUsers: ISiteUsers[];
  siteAdminUsers: ISiteUsers[];
  isAdmin: boolean;
  currentUserId: number;
  currentUserEmail: string;
}
export interface IChoice {
  name: string;
  code: number | any;
}
export interface IAllChoiceColumn {
  JobTitle: IChoice[];
  LeadStatus: IChoice[];
  LeadSource: IChoice[];
  Industry: IChoice[];
  AccountType: IChoice[];
  Rating: IChoice[];
  OwnerShip: IChoice[];
  PipeLine: IChoice[];
  Stage: IChoice[];
  WinProbability: IChoice[];
  Platform: IChoice[];
  CampaignSource: IChoice[];
  Lost: IChoice[];
  Contact: IChoice[];
  Account: IChoice[];
  ParentAccount: IChoice[];
}
export interface ISiteUsers {
  Id: number;
  Email: string;
  LoginName: string;
  UserPrincipalName: string | null;
  Title: string;
}
export interface IManagerChoices {
  name: string;
  code: string | number;
  eMail: string;
}
// Deals Form Page
export interface IDealsFormData {
  ID: number | null;
  DealOwner: string[];
  DealOwnerId: number;
  DealName: string;
  Account: IChoice;
  Contact: IChoice[];
  AccountType: string;
  LeadSource: string;
  Industry: string;
  Location: string;
  Amount: string;
  ClosingDate: string;
  Stage: IChoice;
  Probability: string;
  ExpectedRevenue: string;
  CampaignSource: string;
  Platform: IChoice[];
  Country: string;
  PipeLine: string;
  Description: string;
  Lost: IChoice;
  OldData: {
    ID: number | null;
    DealOwner: string[];
    DealOwnerId: number;
    DealName: string;
    Account: IChoice;
    Contact: IChoice[];
    AccountType: string;
    LeadSource: string;
    Industry: string;
    Location: string;
    Amount: string;
    ClosingDate: string;
    Stage: IChoice;
    Probability: string;
    ExpectedRevenue: string;
    CampaignSource: string;
    Platform: IChoice[];
    Country: string;
    PipeLine: string;
    Description: string;
    Lost: IChoice;
  };
}
// Opportunity Form Page
export interface IOpporFormData {
  ID: number | null;
  OpportunityOwner: string[];
  OpportunityOwnerId: number;
  OpportunityName: string;
  Contact: IChoice[];
  Account: IChoice;
  Stage: string;
  Platform: IChoice[];
  EstimatedQuote: number;
  EstimatedTime: string;
  WinProbability: string;
  InterventionNeeded: boolean;
  Description: string;
  AdminWatchList: boolean;
  Lost: IChoice;
  OldData: {
    ID: number | null;
    OpportunityOwner: string[];
    OpportunityOwnerId: number;
    OpportunityName: string;
    Contact: IChoice[];
    Account: IChoice;
    Stage: string;
    Platform: IChoice[];
    EstimatedQuote: number;
    EstimatedTime: string;
    WinProbability: string;
    InterventionNeeded: boolean;
    Description: string;
    AdminWatchList: boolean;
    Lost: IChoice;
  };
}
// Account Form Page
export interface IAccountsFormData {
  ID: number;
  AccountOwner: string[];
  AccountOwnerId: number | null;
  AccountName: string;
  ParentAccount: IChoice;
  AccountType: string;
  Contact: IChoice[];
  Industry: string;
  AnnualRevenue: string;
  Rating: string;
  OwnerShip: string;
  WebSite: string;
  NumberOfEmployees: string;
  State: string;
  Country: string;
  Description: string;
  OldData?: {
    ID: number;
    AccountOwner: string[];
    AccountOwnerId: number | null;
    AccountName: string;
    ParentAccount: IChoice;
    AccountType: string;
    Contact: IChoice[];
    Industry: string;
    AnnualRevenue: string;
    Rating: string;
    OwnerShip: string;
    WebSite: string;
    NumberOfEmployees: string;
    State: string;
    Country: string;
    Description: string;
  };
}
// Contact Form Page
export interface IContactFormData {
  ID: number | null;
  ContactOwner: string[];
  ContactOwnerId: number;
  FirstName: string;
  LastName: string;
  Account: IChoice | null;
  Phone: string;
  JobTitle: string;
  Email: string;
  LeadSource: string;
  AnnualRevenue: string;
  DateOfBirth: any;
  State: string;
  Country: string;
  Description: string;
  OldData: {
    ID: number | null;
    ContactOwner: string[];
    ContactOwnerId: number;
    FirstName: string;
    LastName: string;
    Account: IChoice | null;
    Phone: string;
    JobTitle: string;
    Email: string;
    LeadSource: string;
    AnnualRevenue: string;
    DateOfBirth: any;
    State: string;
    Country: string;
    Description: string;
  };
}
// Lead Form Page
export interface ILeadFormData {
  ID: number | null;
  LeadOwner: string[];
  LeadOwnerId: number;
  FirstName: string;
  LastName: string;
  Phone: string;
  JobTitle: string;
  Email: string;
  Company: string;
  NumberOfEmployees: string;
  AnnualRevenue: string;
  WebSite: string;
  LeadStatus: string;
  LeadSource: string;
  Industry: string;
  State: string;
  Country: string;
  Description: string;
  OldData: {
    ID: number | null;
    LeadOwner: string[];
    LeadOwnerId: number;
    FirstName: string;
    LastName: string;
    Phone: string;
    JobTitle: string;
    Email: string;
    Company: string;
    NumberOfEmployees: string;
    AnnualRevenue: string;
    WebSite: string;
    LeadStatus: string;
    LeadSource: string;
    Industry: string;
    State: string;
    Country: string;
    Description: string;
  };
}

// Opportunity Form Page
export interface IFormShow {
  add: boolean;
  view: boolean;
  edit: boolean;
  delete: boolean;
}

// Deal Page Navigate
export interface IDealsPageNavigate {
  managerName: IManagerChoices;
  pipeLine: string;
  pipeLineValue: IChoice;
}
// Deals Form Page Navigate
export interface IDealsFormPageNavigate {
  id: number;
  formType: string;
  dealFormData: IDealsFormData;
  stage: IChoice;
  pipeLine: IChoice;
}
// Opportunity Form Page Navigate
export interface IOpportunityFormPageNavigate {
  id: number;
  pipeLineValue: IChoice;
  formType: string;
  formShow: IFormShow;
  opportunityFormData: IOpporFormData;
  stage: string;
}
// Account Form Page Navigate
export interface IAccountFormPageNavigate {
  id: number;
  formType: string;
}
// Contact Form Page Navigate
export interface IContactFormPageNavigate {
  id: number;
  formType: string;
  contactFormData: IContactFormData;
}
// Lead Form Page Navigate
export interface ILeadFormPageNavigate {
  id: number;
  value: string;
}
