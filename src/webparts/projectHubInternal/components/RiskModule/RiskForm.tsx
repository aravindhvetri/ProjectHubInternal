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
import SPServices from "../../../../External/CommonServices/SPServices";
import {
  Config,
  DatePickerStyles,
  peopleErrorPickerStyles,
  peoplePickerStyles,
} from "../../../../External/CommonServices/Config";
import { sp } from "@pnp/sp";

const RiskForm = (props: any) => {
  //State variables:
  const [loader, setLoader] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({});
  const [errorMessage, setErrorMessage] = useState<{ [key: string]: boolean }>(
    {}
  );

  //handleOnChange function:
  const handleOnChange = (field: string, value: any) => {
    setFormData((prevData: any) => {
      const updatedData = {
        ...prevData,
        [field]: value,
      };

      // Only recalculate when Impact or Probability changes
      if (field === "Impact" || field === "Probability") {
        const impactVal = Config.riskValueMap[updatedData.Impact] || 0;
        const probabilityVal =
          Config.riskValueMap[updatedData.Probability] || 0;

        updatedData.Severity = (impactVal * probabilityVal).toString();
      }

      return updatedData;
    });

    // Remove the error once user starts typing
    setErrorMessage((prevErrors) => ({
      ...prevErrors,
      [field]: !isValidField(field, value),
    }));
  };

  //Get selected emails from people picker:
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

  const Validation = () => {
    let errors: { [key: string]: boolean } = {};
    if (!isValidField("IdentifiedBy", formData?.IdentifiedBy))
      errors.IdentifiedBy = true;
    if (!isValidField("AssignedTo", formData?.AssignedTo))
      errors.AssignedTo = true;
    if (!isValidField("RiskTitle", formData?.RiskTitle))
      errors.RiskTitle = true;
    if (!isValidField("RiskDescription", formData?.RiskDescription))
      errors.RiskDescription = true;
    if (!isValidField("RiskCategory", formData?.RiskCategory))
      errors.RiskCategory = true;
    if (!isValidField("DateIdentified", formData?.DateIdentified))
      errors.DateIdentified = true;
    if (!isValidField("Probability", formData?.Probability))
      errors.Probability = true;
    if (!isValidField("Impact", formData?.Impact)) errors.Impact = true;
    if (!isValidField("CurrentStatus", formData?.CurrentStatus))
      errors.CurrentStatus = true;
    //Set all field errors
    setErrorMessage(errors);
    if (Object.keys(errors).length > 0) return;
    //All validations passed
    generateJson();
  };

  //Validations:
  const isValidField = (field: string, value: any): boolean => {
    switch (field) {
      case "IdentifiedBy":
        return value && value.length > 0;
      case "AssignedTo":
        return value && value.length > 0;
      case "RiskTitle":
      case "RiskDescription":
      case "RiskCategory":
      case "Probability":
      case "Impact":
      case "CurrentStatus":
        return value && typeof value === "string" && value.trim() !== "";
      case "DateIdentified":
        return value !== null && value !== undefined;
      default:
        return true;
    }
  };

  //Json Generations:
  const generateJson = () => {
    setLoader(true);
    let IdentifiedByIds: number[] = JSON.parse(
      JSON.stringify(formData?.IdentifiedBy)
    )
      .map((user: IPeoplePickerDetails) => user.id)
      .sort((a: any, b: any) => a - b);

    let AssignedToIds: number[] = JSON.parse(
      JSON.stringify(formData?.AssignedTo)
    )
      .map((user: any) => (user.id ? user?.id : user?.key))
      .sort((a: any, b: any) => a - b);

    let json: any = {
      RiskID: formData?.RiskId,
      ProjectId: props?.projectData?.ID,
      ProjectName: props?.projectData?.ProjectName,
      RiskTitle: formData?.RiskTitle,
      RiskDescription: formData?.RiskDescription,
      DateIdentified: SPServices.GetDateFormat(formData?.DateIdentified),
      TargetResolutionDate: SPServices.GetDateFormat(
        formData?.TargetResolutionDate
      ),
      IdentifiedById: { results: IdentifiedByIds },
      AssignedToId: { results: AssignedToIds },
      Probability: formData?.Probability,
      RiskCategory: formData?.RiskCategory,
      Impact: formData?.Impact,
      Severity: formData?.Severity,
      MitigationPlan: formData?.MitigationPlan,
      CurrentStatus: formData?.CurrentStatus,
      ResidualRisk: formData?.ResidualRisk,
      Remarks: formData?.Remarks,
      DateClosed: SPServices.GetDateFormat(formData?.DateClosed),
      RiskOccurred: formData?.RiskOccurred,
    };
    if (props?.isEdit) {
      handleUpdate(json);
    } else {
      generateRiskId(json);
    }
  };

  //Generate RiskId function:
  const generateRiskId = (json: any) => {
    sp.web.lists
      .getByTitle(Config.ListNames?.CRMProjectRisks)
      .items.orderBy("ID", false)
      .top(1)
      .get()
      .then((res: any) => {
        const projectShortId = extractProjectShortId(
          props?.projectData?.ProjectID
        );
        const format = `RISK-${projectShortId}-`;

        const lastId = res[0]?.RiskID || "";

        const newId = GenerateFormatId(format, lastId, 3);
        handleAdd({ ...json, RiskID: newId });
      })
      .catch((err) =>
        console.log(err, "generate Risk Id Error in RiskForm.tsx")
      );
  };

  //Extract project ID function:
  const extractProjectShortId = (projectId: string): string => {
    if (!projectId) return "";
    const parts = projectId.split("-");
    if (parts.length !== 3) return projectId;
    const prefix = parts[0];
    const lastNumber = parseInt(parts[2]);
    const shortNumber = lastNumber + 100;
    return `${prefix}${shortNumber}`;
  };

  //Generate full format:
  const GenerateFormatId = (
    prefix: string,
    lastId: string,
    padLength: number
  ): string => {
    let lastNumber = 0;
    if (lastId) {
      // Extract last number Only
      const parts = lastId.split("-");
      const num = parts[parts.length - 1]; // take last section
      lastNumber = parseInt(num) || 0;
    }
    const nextNumber = lastNumber + 1;
    const paddedNumber = String(nextNumber).padStart(padLength, "0");
    return `${prefix}${paddedNumber}`;
  };

  //Update datas to sharepoint list:
  const handleUpdate = (json: any) => {
    SPServices.SPUpdateItem({
      Listname: Config.ListNames?.CRMProjectRisks,
      RequestJSON: json,
      ID: formData?.ID,
    })
      .then(() => {
        props.Notify("success", "Success", "Risk updated successfully");
        setLoader(false);
        emptyDatas();
      })
      .catch((err) => {
        console.log(
          err,
          "data update error to CRMProjectRisks List in RiskForm.tsx"
        );
      });
  };

  //Add datas to sharepoint list:
  const handleAdd = (json: any) => {
    SPServices.SPAddItem({
      Listname: Config.ListNames.CRMProjectRisks,
      RequestJSON: json,
    })
      .then((res: any) => {
        props.Notify("success", "Success", "Risk added successfully");
        setLoader(false);
        emptyDatas();
      })
      .catch((err) => {
        console.log(
          "Add datas to CRMProjectRisks list err in RiskForm.tsx",
          err
        );
      });
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
        DateIdentified: null,
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
          <div style={{ paddingTop: "20px" }} className={styles.riskFormHeader}>
            <h2 style={{ fontSize: "16px" }}>
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
              <InputText value={props?.projectData?.ProjectName} disabled />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Risk title</Label>
              <InputText
                onChange={(e) => handleOnChange("RiskTitle", e.target.value)}
                value={formData?.RiskTitle}
                disabled={props?.isView}
                style={
                  errorMessage["RiskTitle"]
                    ? { border: "2px solid #ff0000" }
                    : undefined
                }
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
                style={
                  errorMessage["RiskDescription"]
                    ? { border: "2px solid #ff0000" }
                    : undefined
                }
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
                style={
                  errorMessage["RiskCategory"]
                    ? { border: "2px solid #ff0000", borderRadius: "6px" }
                    : undefined
                }
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
                  styles={
                    errorMessage["IdentifiedBy"]
                      ? peopleErrorPickerStyles
                      : peoplePickerStyles
                  }
                />
              </div>
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Date identified</Label>
              <DatePicker
                minDate={new Date()}
                value={
                  formData?.DateIdentified
                    ? new Date(formData.DateIdentified)
                    : undefined
                }
                onSelectDate={(date) => {
                  handleOnChange("DateIdentified", date);
                }}
                disabled={props?.isView}
                styles={
                  errorMessage["DateIdentified"]
                    ? {
                        root: {
                          border: "2px solid #ff0000",
                          height: "35px",
                          borderRadius: "6px",
                        },
                      }
                    : DatePickerStyles
                }
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
                style={
                  errorMessage["Probability"]
                    ? { border: "2px solid #ff0000", borderRadius: "6px" }
                    : undefined
                }
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
                style={
                  errorMessage["Impact"]
                    ? { border: "2px solid #ff0000", borderRadius: "6px" }
                    : undefined
                }
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Severity/Risk score</Label>
              <InputText value={formData?.Severity} disabled />
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
                  styles={
                    errorMessage["AssignedTo"]
                      ? peopleErrorPickerStyles
                      : peoplePickerStyles
                  }
                />
              </div>
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Target resolution date</Label>
              <DatePicker
                minDate={new Date()}
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
                onChange={(e) => {
                  const newStatus = e?.value?.name;
                  handleOnChange("CurrentStatus", newStatus);
                  if (newStatus?.toLowerCase() === "closed") {
                    handleOnChange("DateClosed", new Date());
                  } else {
                    handleOnChange("DateClosed", null);
                  }
                }}
                disabled={props?.isView}
                style={
                  errorMessage["CurrentStatus"]
                    ? { border: "2px solid #ff0000", borderRadius: "6px" }
                    : undefined
                }
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
                minDate={new Date()}
                value={
                  formData?.DateClosed
                    ? new Date(formData.DateClosed)
                    : undefined
                }
                disabled
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

            {props?.isAdd || props?.isEdit ? (
              <PrimaryButton
                className={commonStyles.updateBtn}
                iconProps={{ iconName: "Save" }}
                onClick={() => Validation()}
              >
                {props?.isEdit ? "Update" : "Save"}
              </PrimaryButton>
            ) : (
              ""
            )}
          </div>
        </>
      )}
    </>
  );
};

export default RiskForm;
