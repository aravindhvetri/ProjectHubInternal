import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IReportsProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
}
