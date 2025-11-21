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

const ChildTabs = (props: any) => {
  const [activeTab, setActiveTab] = React.useState("");

  const renderContent = () => {
    switch (activeTab) {
      case "ChangeRequest":
        return (
          <div className={styles.tabContent}>
            <ChangeRequest
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
      </div>

      <div className={styles.contentContainer}>{renderContent()}</div>
    </div>
  );
};

export default ChildTabs;
