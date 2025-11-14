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
import { useEffect, useState } from "react";
import Loading from "../../../../External/Loader/Loading";
import styles from "./Risk.module.scss";
import commonStyles from "../CommonStyles/CommonStyle.module.scss";
import { DatePicker, Label } from "office-ui-fabric-react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { PeoplePicker } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { IPeoplePickerDetails } from "../../../../External/CommonServices/interface";
import { PrimaryButton } from "@fluentui/react";

const RiskForm = (props: any) => {
  //State variables:
  const [loader, setLoader] = useState<boolean>(false);
  console.log(setLoader);
  const [formData, setFormData] = useState<any>({});
  console.log(formData, "formData in RiskFormPage.tsx");

  //handleOnChange function:
  const handleOnChange = (field: string, value: any) => {
    setFormData((prevData: any) => ({
      ...prevData,
      [field]: value,
    }));
  };

  //Get selected emails from people picker:
  //Set default user in peoplepicker:
  const getSelectedEmails = (
    selectedUsers: IPeoplePickerDetails[],
    fallbackUsers: any[]
  ) => {
    let selectedEmails: string[] = [];
    if (selectedUsers?.length) {
      selectedUsers.forEach((user: IPeoplePickerDetails) => {
        selectedEmails.push(user?.email);
      });
    } else if (fallbackUsers?.length) {
      // formData?.ProjectManager case (secondaryText contains email)
      fallbackUsers.forEach((user: any) => {
        if (user?.secondaryText) {
          selectedEmails.push(user.secondaryText);
        }
      });
    }

    return selectedEmails;
  };

  //Data refresh and goBack mainPage function:
  const emptyDatas = () => {
    setFormData({
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
      TargetResolutionDate: null,
      CurrentStatus: "",
      ResidualRisk: "",
      Remarks: "",
      DateClosed: null,
      RiskOccurred: "",
      IdentifiedBy: [],
      AssignedTo: [],
    });
    props?.refresh();
    props?.goBack();
  };

  //Initial render:
  useEffect(() => {
    if (!props?.data) {
      setFormData({
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
        TargetResolutionDate: null,
        CurrentStatus: "",
        ResidualRisk: "",
        Remarks: "",
        DateClosed: null,
        RiskOccurred: "",
        IdentifiedBy: [],
        AssignedTo: [],
      });
    }
    props?.setLoader(false);
  }, []);

  //RowData is once comming then data set to the state:
  useEffect(() => {
    if (props?.data) {
      setFormData(props?.data);
    }
  }, [props?.data]);

  return (
    <>
      {loader ? (
        <Loading />
      ) : (
        <>
          <div style={{ paddingTop: "10px" }} className={styles.riskFormHeader}>
            <h2>
              {props?.isAdd
                ? "Add Risk"
                : props?.isEdit
                ? "Edit Risk"
                : "View Risk"}
            </h2>
          </div>
          <div className={styles.riskFormContainer}>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Risk id</Label>
              <InputText
                onChange={(e) => handleOnChange("RiskId", e.target.value)}
                value={
                  props?.isView || props?.isEdit
                    ? formData?.RiskId
                    : "Auto generate"
                }
                disabled
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Project name</Label>
              <InputText
                onChange={(e) => handleOnChange("ProjectName", e.target.value)}
                value={formData?.ProjectName}
                disabled
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Risk title</Label>
              <InputText
                onChange={(e) => handleOnChange("RiskTitle", e.target.value)}
                value={formData?.RiskTitle}
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Risk description</Label>
              <InputTextarea
                onChange={(e) =>
                  handleOnChange("RiskDescription", e.target.value)
                }
                value={formData?.RiskDescription}
                maxLength={500}
                autoResize
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Risk category</Label>
              <Dropdown
                options={
                  props?.initialCRMProjectsRisksListDropContainer?.RiskCategory
                }
                optionLabel="name"
                value={props?.initialCRMProjectsRisksListDropContainer?.RiskCategory.find(
                  (item: any) => item.name === formData?.RiskCategory
                )}
                onChange={(e) => handleOnChange("RiskCategory", e?.value?.name)}
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Identified by</Label>
              <div className={`${styles.textField} ${styles.peoplePicker}`}>
                <PeoplePicker
                  ensureUser
                  placeholder="Select the Person"
                  personSelectionLimit={1}
                  context={props.spfxContext}
                  defaultSelectedUsers={getSelectedEmails(
                    props?.data?.IdentifiedBy,
                    formData?.IdentifiedBy
                  )}
                  webAbsoluteUrl={
                    props?.spfxContext._pageContext._web.absoluteUrl
                  }
                  resolveDelay={100}
                  onChange={(items: any[]) =>
                    handleOnChange("IdentifiedBy", items)
                  }
                  disabled={props?.isView}
                />
              </div>
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Date identified</Label>
              <DatePicker
                value={
                  formData?.DateIdentified
                    ? new Date(formData.DateIdentified)
                    : undefined
                }
                onSelectDate={(date) => {
                  handleOnChange("DateIdentified", date);
                }}
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Probability</Label>
              <Dropdown
                options={
                  props?.initialCRMProjectsRisksListDropContainer?.Probability
                }
                optionLabel="name"
                value={props?.initialCRMProjectsRisksListDropContainer?.Probability.find(
                  (item: any) => item.name === formData?.Probability
                )}
                onChange={(e) => handleOnChange("Probability", e?.value?.name)}
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Impact</Label>
              <Dropdown
                options={
                  props?.initialCRMProjectsRisksListDropContainer?.Impact
                }
                optionLabel="name"
                value={props?.initialCRMProjectsRisksListDropContainer?.Impact.find(
                  (item: any) => item.name === formData?.Impact
                )}
                onChange={(e) => handleOnChange("Impact", e?.value?.name)}
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Severity</Label>
              <InputText
                onChange={(e) => handleOnChange("Severity", e.target.value)}
                value={formData?.Severity}
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>MitigationPlan</Label>
              <InputTextarea
                onChange={(e) =>
                  handleOnChange("MitigationPlan", e.target.value)
                }
                value={formData?.MitigationPlan}
                maxLength={500}
                autoResize
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>AssignedTo</Label>
              <div className={`${styles.textField} ${styles.peoplePicker}`}>
                <PeoplePicker
                  ensureUser
                  placeholder="Select the Person"
                  personSelectionLimit={1}
                  context={props.spfxContext}
                  defaultSelectedUsers={getSelectedEmails(
                    props?.data?.AssignedTo,
                    formData?.AssignedTo
                  )}
                  webAbsoluteUrl={
                    props?.spfxContext._pageContext._web.absoluteUrl
                  }
                  resolveDelay={100}
                  onChange={(items: any[]) =>
                    handleOnChange("AssignedTo", items)
                  }
                  disabled={props?.isView}
                />
              </div>
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Target resolution date</Label>
              <DatePicker
                value={
                  formData?.TargetResolutionDate
                    ? new Date(formData.TargetResolutionDate)
                    : undefined
                }
                onSelectDate={(date) => {
                  handleOnChange("TargetResolutionDate", date);
                }}
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Status</Label>
              <Dropdown
                options={
                  props?.initialCRMProjectsRisksListDropContainer?.CurrentStatus
                }
                optionLabel="name"
                value={props?.initialCRMProjectsRisksListDropContainer?.CurrentStatus.find(
                  (item: any) => item.name === formData?.CurrentStatus
                )}
                onChange={(e) =>
                  handleOnChange("CurrentStatus", e?.value?.name)
                }
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Residual risk</Label>
              <Dropdown
                options={
                  props?.initialCRMProjectsRisksListDropContainer?.ResidualRisk
                }
                optionLabel="name"
                value={props?.initialCRMProjectsRisksListDropContainer?.ResidualRisk.find(
                  (item: any) => item.name === formData?.ResidualRisk
                )}
                onChange={(e) => handleOnChange("ResidualRisk", e?.value?.name)}
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Remarks</Label>
              <InputTextarea
                onChange={(e) => handleOnChange("Remarks", e.target.value)}
                value={formData?.Remarks}
                maxLength={500}
                autoResize
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Date closed</Label>
              <DatePicker
                value={
                  formData?.DateClosed
                    ? new Date(formData.DateClosed)
                    : undefined
                }
                onSelectDate={(date) => {
                  handleOnChange("DateClosed", date);
                }}
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Risk occurred</Label>
              <Dropdown
                options={
                  props?.initialCRMProjectsRisksListDropContainer?.RiskOccurred
                }
                optionLabel="name"
                value={props?.initialCRMProjectsRisksListDropContainer?.RiskOccurred.find(
                  (item: any) => item.name === formData?.RiskOccurred
                )}
                onChange={(e) => handleOnChange("RiskOccurred", e?.value?.name)}
                disabled={props?.isView}
              />
            </div>
          </div>
          <div className={commonStyles.addUpdateBtns}>
            <PrimaryButton
              className={commonStyles.cancelBtn}
              iconProps={{ iconName: "cancel" }}
              onClick={() => emptyDatas()}
            >
              Cancel
            </PrimaryButton>

            <PrimaryButton
              className={commonStyles.updateBtn}
              iconProps={{ iconName: "Save" }}
              onClick={() => {}}
            >
              {props?.isEdit ? "Update" : "Save"}
            </PrimaryButton>
          </div>
        </>
      )}
    </>
  );
};

export default RiskForm;
