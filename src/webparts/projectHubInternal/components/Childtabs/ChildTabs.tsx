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
import styles from "./ChildTabs.module.scss";
import "../../../../External/CSS/Style.css";
import { Button } from "primereact/button";
import ChangeRequest from "../CRModule/ChangeRequest";
import Risk from "../RiskModule/Risk";
import QuickLinks from "../QuickLinks/QuickLinks";
import SPServices from "../../../../External/CommonServices/SPServices";
import { Config } from "../../../../External/CommonServices/Config";
import { IPeoplePickerDetails } from "../../../../External/CommonServices/interface";
import PartialAllocation from "../PartialAllocation/PartialAllocation";
import Checklist from "../Checklist/Checklist";
import EmployeeAllocations from "../EmployeeAllocations/EmployeeAllocations";

const ChildTabs = (props: any) => {
  const [activeTab, setActiveTab] = React.useState("");
  const [BAusers, setBAusers] = React.useState<IPeoplePickerDetails[]>([]);

  //Initial load get BA group users:
  React.useEffect(() => {
    getBAGroupUsers();
  }, []);

  //Get BA Group members:
  const getBAGroupUsers = () => {
    SPServices.getSPGroupMember({
      GroupName: Config.GroupNames.BA,
    })
      .then((res) => {
        const tempBAusers: IPeoplePickerDetails[] = [];
        res.forEach((items: any) => {
          tempBAusers.push({
            id: items?.Id,
            email: items?.Email,
            name: items?.Title,
          });
        });
        setBAusers([...tempBAusers]);
      })
      .catch((err) => {
        console.log(err, "Get BA group users errro in projectsFormPage.tsx");
      });
  };

  const isBA = BAusers?.some(
    (user) =>
      user?.email?.toLowerCase() === props?.loginUserEmail?.toLowerCase(),
  );

  const renderContent = () => {
    switch (activeTab) {
      case "ChangeRequest":
        return (
          <div className={styles.tabContent}>
            <ChangeRequest
              isBA={isBA}
              Notify={props.Notify}
              loginUserEmail={props?.loginUserEmail}
              rowDataID={props?.rowData?.ID}
              Projectdata={props?.rowData}
              setActiveTab={setActiveTab}
              getTabContent={props.getTabContent}
              spfxContext={props.spfxContext}
            />
          </div>
        );
      case "Risk":
        return (
          <div className={styles.tabContent}>
            <Risk
              isBA={isBA}
              Notify={props.Notify}
              loginUserEmail={props?.loginUserEmail}
              rowDataID={props?.rowData?.ID}
              Projectdata={props?.rowData}
              setActiveTab={setActiveTab}
              getTabContent={props.getTabContent}
              spfxContext={props.spfxContext}
            />
          </div>
        );
      case "QuickLinks":
        return (
          <div className={styles.tabContent}>
            <QuickLinks
              loginUserEmail={props?.loginUserEmail}
              rowDataID={props?.rowData?.ID}
              Projectdata={props?.rowData}
              setActiveTab={setActiveTab}
              getTabContent={props.getTabContent}
              spfxContext={props.spfxContext}
            />
          </div>
        );
      case "Allocation":
        return (
          <div className={styles.tabContent}>
            <PartialAllocation
              loginUserEmail={props?.loginUserEmail}
              rowDataID={props?.rowData?.ID}
              Projectdata={props?.rowData}
              setActiveTab={setActiveTab}
              getTabContent={props.getTabContent}
              spfxContext={props.spfxContext}
            />
          </div>
        );
      case "Checklist":
        return (
          <div className={styles.tabContent}>
            <Checklist
              loginUserEmail={props?.loginUserEmail}
              rowDataID={props?.rowData?.ID}
              Projectdata={props?.rowData}
              setActiveTab={setActiveTab}
              getTabContent={props.getTabContent}
              spfxContext={props.spfxContext}
            />
          </div>
        );
      case "EmployeeAllocations":
        return (
          <div className={styles.tabContent}>
            <EmployeeAllocations
              Notify={props.Notify}
              loginUserEmail={props?.loginUserEmail}
              rowDataID={props?.rowData?.ID}
              selectedData={props?.rowData}
              getTabContent={props.getTabContent}
              setActiveTab={setActiveTab}
              spfxContext={props.spfxContext}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.childTabsContainer}>
      <div className={`${styles.tabButtons} tabButtons`}>
        <Button
          label="Change Request"
          className={`${styles.tabButton} ${
            activeTab === "ChangeRequest" ? styles.active : ""
          }`}
          onClick={() => {
            setActiveTab("ChangeRequest");
            props.getTabContent(true);
          }}
        />
        <Button
          label="Risk"
          className={`${styles.tabButton} ${
            activeTab === "Risk" ? styles.active : ""
          }`}
          onClick={() => {
            setActiveTab("Risk");
            props.getTabContent(true);
          }}
        />
        <Button
          label="Quick Links"
          className={`${styles.tabButton} ${
            activeTab === "QuickLinks" ? styles.active : ""
          }`}
          onClick={() => {
            setActiveTab("QuickLinks");
            props.getTabContent(true);
          }}
        />
        <Button
          label="Allocations View"
          className={`${styles.tabButton} ${
            activeTab === "Allocation" ? styles.active : ""
          }`}
          onClick={() => {
            setActiveTab("Allocation");
            props.getTabContent(true);
          }}
        />
        <Button
          label="Delivery Maturity Metrics"
          className={`${styles.tabButton} ${
            activeTab === "Checklist" ? styles.active : ""
          }`}
          onClick={() => {
            setActiveTab("Checklist");
            props.getTabContent(true);
          }}
        />
        <Button
          label="Employee Allocations"
          className={`${styles.tabButton} ${
            activeTab === "EmployeeAllocations" ? styles.active : ""
          }`}
          onClick={() => {
            setActiveTab("EmployeeAllocations");
            props.getTabContent(true);
          }}
        />
      </div>

      <div className={styles.contentContainer}>{renderContent()}</div>
    </div>
  );
};

export default ChildTabs;
