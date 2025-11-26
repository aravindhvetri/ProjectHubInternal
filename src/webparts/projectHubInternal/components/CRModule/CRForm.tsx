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
import { useState, useEffect } from "react";
import Loading from "../../../../External/Loader/Loading";
import styles from "../RiskModule/Risk.module.scss";
import { InputText } from "primereact/inputtext";
import { DatePicker, Label, PrimaryButton } from "@fluentui/react";
import { InputTextarea } from "primereact/inputtextarea";
import { PeoplePicker } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { IPeoplePickerDetails } from "../../../../External/CommonServices/interface";
import {
  Config,
  DatePickerStyles,
  peopleErrorPickerStyles,
  peoplePickerStyles,
} from "../../../../External/CommonServices/Config";
import { Dropdown } from "primereact/dropdown";
import commonStyles from "../CommonStyles/CommonStyle.module.scss";
import SPServices from "../../../../External/CommonServices/SPServices";
import { sp } from "@pnp/sp";

const CRForm = (props: any) => {
  console.log(props?.initialCRMProjectCRsListDropContainer, "aari");
  //Local states:
  const [loader, setLoader] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({});
  console.log(formData, "formData");
  const [errorMessage, setErrorMessage] = useState<{ [key: string]: boolean }>(
    {}
  );

  //handleOnChange function:
  const handleOnChange = (field: string, value: any) => {
    setFormData((prevData: any) => ({
      ...prevData,
      [field]: value,
    }));
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
      CRId: "",
      ProjectId: "",
      CRTitle: "",
      CRDescription: "",
      RequestedBy: [],
      RequestDate: null,
      ChangeType: "",
      Severity: "",
      Priority: "",
      EffortEstimate: null,
      EstimatedStartDate: null,
      EstimatedEndDate: null,
      ActualStartDate: null,
      ActualEndDate: null,
      AssignedTo: [],
      ApprovalStatus: "",
      ApprovalComments: "",
      ImplementationStatus: "",
      ChangeImpactedModules: "",
      ChangeImpactDescription: "",
      CostImpact: null,
      BillingImpact: "",
      BillingDetailsAmount: null,
      Remarks: "",
      CreatedBy: [],
      CreatedDate: "",
      LastUpdatedBy: [],
      LastUpdatedDate: "",
    });
    props?.refresh();
    props?.goBack();
  };

  //Validate Func:
  const Validation = () => {
    let errors: { [key: string]: boolean } = {};
    if (!isValidField("RequestedBy", formData?.RequestedBy))
      errors.RequestedBy = true;
    if (!isValidField("AssignedTo", formData?.AssignedTo))
      errors.AssignedTo = true;
    if (!isValidField("CRTitle", formData?.CRTitle)) errors.CRTitle = true;
    if (!isValidField("CRDescription", formData?.CRDescription))
      errors.CRDescription = true;
    if (!isValidField("EffortEstimate", formData?.EffortEstimate))
      errors.EffortEstimate = true;
    if (!isValidField("RequestDate", formData?.RequestDate))
      errors.RequestDate = true;
    if (!isValidField("Severity", formData?.Severity)) errors.Severity = true;
    if (!isValidField("ChangeType", formData?.ChangeType))
      errors.ChangeType = true;

    //Set all field errors
    setErrorMessage(errors);
    if (Object.keys(errors).length > 0) return;

    //All validations passed
    generateJson();
  };

  const isValidField = (field: string, value: any): boolean => {
    switch (field) {
      case "RequestedBy":
        return value && value.length > 0;
      case "AssignedTo":
        return value && value.length > 0;
      case "CRTitle":
      case "CRDescription":
      case "Severity":
      case "ChangeType":
        return value && typeof value === "string" && value.trim() !== "";
      case "RequestDate":
        return value !== null && value !== undefined && value !== "";
      case "EffortEstimate":
        return value !== null && value !== undefined && value !== "";
      default:
        return true;
    }
  };

  //Json Generations:
  const generateJson = () => {
    setLoader(true);
    let RequestedByIds: number[] = JSON.parse(
      JSON.stringify(formData?.RequestedBy)
    )
      .map((user: IPeoplePickerDetails) => user.id)
      .sort((a: any, b: any) => a - b);

    let AssignedToIds: number[] = JSON.parse(
      JSON.stringify(formData?.AssignedTo)
    )
      .map((user: any) => (user.id ? user?.id : user?.key))
      .sort((a: any, b: any) => a - b);

    let json: any = {
      ProjectId: props?.projectData?.ID,
      CRID: formData?.CRId,
      CRTitle: formData?.CRTitle || "",
      CRDescription: formData?.CRDescription || "",
      RequestDate: SPServices.GetDateFormat(formData?.RequestDate) || null,
      EstimatedStartDate:
        SPServices.GetDateFormat(formData?.EstimatedStartDate) || null,
      EstimatedEndDate:
        SPServices.GetDateFormat(formData?.EstimatedEndDate) || null,
      ActualStartDate:
        SPServices.GetDateFormat(formData?.ActualStartDate) || null,
      ActualEndDate: SPServices.GetDateFormat(formData?.ActualEndDate) || null,
      RequestedById: { results: RequestedByIds },
      AssignedToId: { results: AssignedToIds },
      Severity: formData?.Severity || "",
      Priority: formData?.Priority || "",
      ChangeType: formData?.ChangeType || "",
      EffortEstimate: formData?.EffortEstimate || null,
      ApprovalStatus: formData?.ApprovalStatus || "",
      ApprovalComments: formData?.ApprovalComments || "",
      ImplementationStatus: formData?.ImplementationStatus || "",
      ChangeImpactedModules: formData?.ChangeImpactedModules || "",
      ChangeImpactDescription: formData?.ChangeImpactDescription || "",
      CostImpact: formData?.CostImpact || null,
      BillingImpact: formData?.BillingImpact || "",
      BillingDetailsAmount: formData?.BillingDetailsAmount || null,
      Remarks: formData?.Remarks || "",
    };
    if (props?.isEdit) {
      handleUpdate(json);
    } else {
      generateCRId(json);
    }
  };

  //Update datas to sharepoint list:
  const handleUpdate = (json: any) => {
    SPServices.SPUpdateItem({
      Listname: Config.ListNames?.CRMProjectCRs,
      RequestJSON: json,
      ID: formData?.ID,
    })
      .then(() => {
        props.Notify("success", "Success", "CR updated successfully");
        setLoader(false);
        emptyDatas();
      })
      .catch((err) => {
        console.log(
          err,
          "data update error to CRMProjectCRs List in CRForm.tsx"
        );
      });
  };

  //Generate CR ID:
  const generateCRId = (json: any) => {
    sp.web.lists
      .getByTitle(Config.ListNames?.CRMProjectCRs)
      .items.orderBy("ID", false)
      .top(1)
      .get()
      .then((res: any) => {
        let format: string = "CR-";
        let lastId = res[0]?.CRID || "";
        let newId = SPServices.GenerateFormatId(format, lastId, 3);
        handleAdd({ ...json, CRID: newId });
      })
      .catch((err: any) =>
        console.log(
          err,
          "getDetails from CRMPojects err in ProjectsFormPage.tsx component"
        )
      );
  };

  //Add datas to sharepoint list:
  const handleAdd = (json: any) => {
    SPServices.SPAddItem({
      Listname: Config.ListNames.CRMProjectCRs,
      RequestJSON: json,
    })
      .then((res: any) => {
        props.Notify("success", "Success", "CR added successfully");
        setLoader(false);
        emptyDatas();
      })
      .catch((err) => {
        console.log("Add datas to CRMProjectCRs list err in CRForm.tsx", err);
      });
  };

  //Initial render:
  useEffect(() => {
    if (!props?.data) {
      setFormData({
        CRId: "",
        ProjectId: "",
        CRTitle: "",
        CRDescription: "",
        RequestedBy: [],
        RequestDate: "",
        ChangeType: "",
        Severity: "",
        Priority: "",
        EffortEstimate: "",
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
        CostImpact: "",
        BillingImpact: "",
        BillingDetailsAmount: "",
        Remarks: "",
        CreatedBy: [],
        CreatedDate: "",
        LastUpdatedBy: [],
        LastUpdatedDate: "",
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
          <div className={styles.riskFormHeader}>
            <h2 style={{ fontSize: "16px" }}>
              {props?.isAdd ? "Add CR" : props?.isEdit ? "Edit CR" : "View CR"}
            </h2>
          </div>
          <div className={styles.riskFormContainer}>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>CR id</Label>
              <InputText
                onChange={(e) => handleOnChange("CRId", e.target.value)}
                value={
                  props?.isView || props?.isEdit
                    ? formData?.CRId
                    : "Auto generate"
                }
                disabled
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Project id</Label>
              <InputText value={props?.projectData?.ProjectID} disabled />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>CR title</Label>
              <InputText
                onChange={(e) => handleOnChange("CRTitle", e.target.value)}
                value={formData?.CRTitle}
                disabled={props?.isView}
                style={
                  errorMessage["CRTitle"]
                    ? { border: "2px solid #ff0000" }
                    : undefined
                }
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>CR description</Label>
              <InputTextarea
                onChange={(e) =>
                  handleOnChange("CRDescription", e.target.value)
                }
                value={formData?.CRDescription}
                maxLength={500}
                autoResize
                disabled={props?.isView}
                style={
                  errorMessage["CRDescription"]
                    ? { border: "2px solid #ff0000" }
                    : undefined
                }
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Requested by</Label>
              <div className={`${styles.textField} ${styles.peoplePicker}`}>
                <PeoplePicker
                  ensureUser
                  placeholder="Select the Person"
                  personSelectionLimit={1}
                  context={props.spfxContext}
                  defaultSelectedUsers={getSelectedEmails(
                    props?.data?.RequestedBy,
                    formData?.RequestedBy
                  )}
                  webAbsoluteUrl={
                    props?.spfxContext._pageContext._web.absoluteUrl
                  }
                  resolveDelay={100}
                  onChange={(items: any[]) =>
                    handleOnChange("RequestedBy", items)
                  }
                  disabled={props?.isView}
                  styles={
                    errorMessage["RequestedBy"]
                      ? peopleErrorPickerStyles
                      : peoplePickerStyles
                  }
                />
              </div>
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Request date</Label>
              <DatePicker
                value={
                  formData?.RequestDate
                    ? new Date(formData.RequestDate)
                    : undefined
                }
                onSelectDate={(date) => {
                  handleOnChange("RequestDate", date);
                }}
                minDate={new Date()}
                disabled={props?.isView}
                styles={
                  errorMessage["RequestDate"]
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
              <Label>Change type</Label>
              <Dropdown
                options={
                  props?.initialCRMProjectCRsListDropContainer?.ChangeType
                }
                optionLabel="name"
                value={props?.initialCRMProjectCRsListDropContainer?.ChangeType.find(
                  (item: any) => item.name === formData?.ChangeType
                )}
                onChange={(e) => handleOnChange("ChangeType", e?.value?.name)}
                disabled={props?.isView}
                style={
                  errorMessage["ChangeType"]
                    ? { border: "2px solid #ff0000", borderRadius: "6px" }
                    : undefined
                }
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Severity/Impact</Label>
              <Dropdown
                options={props?.initialCRMProjectCRsListDropContainer?.Severity}
                optionLabel="name"
                value={props?.initialCRMProjectCRsListDropContainer?.Severity.find(
                  (item: any) => item.name === formData?.Severity
                )}
                onChange={(e) => handleOnChange("Severity", e?.value?.name)}
                disabled={props?.isView}
                style={
                  errorMessage["Severity"]
                    ? { border: "2px solid #ff0000", borderRadius: "6px" }
                    : undefined
                }
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Priority</Label>
              <Dropdown
                options={props?.initialCRMProjectCRsListDropContainer?.Priority}
                optionLabel="name"
                value={props?.initialCRMProjectCRsListDropContainer?.Priority.find(
                  (item: any) => item.name === formData?.Priority
                )}
                onChange={(e) => handleOnChange("Priority", e?.value?.name)}
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Effort estimate</Label>
              <InputText
                keyfilter="int"
                inputMode="numeric"
                onChange={(e) => {
                  handleOnChange("EffortEstimate", e?.target?.value);
                }}
                value={formData?.EffortEstimate}
                disabled={props?.isView}
                style={
                  errorMessage["EffortEstimate"]
                    ? { border: "2px solid #ff0000" }
                    : undefined
                }
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Estimated start date</Label>
              <DatePicker
                value={
                  formData?.EstimatedStartDate
                    ? new Date(formData.EstimatedStartDate)
                    : undefined
                }
                minDate={new Date()}
                onSelectDate={(date) => {
                  handleOnChange("EstimatedStartDate", date);
                }}
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Estimated end date</Label>
              <DatePicker
                value={
                  formData?.EstimatedEndDate
                    ? new Date(formData.EstimatedEndDate)
                    : undefined
                }
                minDate={new Date()}
                onSelectDate={(date) => {
                  handleOnChange("EstimatedEndDate", date);
                }}
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Actual start date</Label>
              <DatePicker
                value={
                  formData?.ActualStartDate
                    ? new Date(formData.ActualStartDate)
                    : undefined
                }
                minDate={new Date()}
                onSelectDate={(date) => {
                  handleOnChange("ActualStartDate", date);
                }}
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Actual end date</Label>
              <DatePicker
                value={
                  formData?.ActualEndDate
                    ? new Date(formData.ActualEndDate)
                    : undefined
                }
                minDate={new Date()}
                onSelectDate={(date) => {
                  handleOnChange("ActualEndDate", date);
                }}
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Assigned to</Label>
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
              <Label>Approval status</Label>
              <Dropdown
                options={
                  props?.initialCRMProjectCRsListDropContainer?.ApprovalStatus
                }
                optionLabel="name"
                value={props?.initialCRMProjectCRsListDropContainer?.ApprovalStatus.find(
                  (item: any) => item.name === formData?.ApprovalStatus
                )}
                onChange={(e) =>
                  handleOnChange("ApprovalStatus", e?.value?.name)
                }
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Approval comments</Label>
              <InputTextarea
                onChange={(e) =>
                  handleOnChange("ApprovalComments", e.target.value)
                }
                value={formData?.ApprovalComments}
                maxLength={500}
                autoResize
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Implementation status</Label>
              <Dropdown
                options={
                  props?.initialCRMProjectCRsListDropContainer
                    ?.ImplementationStatus
                }
                optionLabel="name"
                value={props?.initialCRMProjectCRsListDropContainer?.ImplementationStatus.find(
                  (item: any) => item.name === formData?.ImplementationStatus
                )}
                onChange={(e) =>
                  handleOnChange("ImplementationStatus", e?.value?.name)
                }
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Change impacted modules</Label>
              <InputTextarea
                onChange={(e) =>
                  handleOnChange("ChangeImpactedModules", e.target.value)
                }
                value={formData?.ChangeImpactedModules}
                maxLength={500}
                autoResize
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Change impact description</Label>
              <InputTextarea
                onChange={(e) =>
                  handleOnChange("ChangeImpactDescription", e.target.value)
                }
                value={formData?.ChangeImpactDescription}
                maxLength={500}
                autoResize
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Cost impact ($ / %)</Label>
              <InputText
                keyfilter="int"
                inputMode="numeric"
                onChange={(e) => {
                  handleOnChange("CostImpact", e?.target?.value);
                }}
                value={formData?.CostImpact}
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Billing impact</Label>
              <Dropdown
                options={
                  props?.initialCRMProjectCRsListDropContainer?.BillingImpact
                }
                optionLabel="name"
                value={props?.initialCRMProjectCRsListDropContainer?.BillingImpact.find(
                  (item: any) => item.name === formData?.BillingImpact
                )}
                onChange={(e) =>
                  handleOnChange("BillingImpact", e?.value?.name)
                }
                disabled={props?.isView}
              />
            </div>
            <div className={`${styles.riskFormChilds} dealFormPages`}>
              <Label>Billing details amount</Label>
              <InputText
                keyfilter="int"
                inputMode="numeric"
                onChange={(e) => {
                  handleOnChange("BillingDetailsAmount", e.target.value);
                }}
                value={formData?.BillingDetailsAmount}
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
            {!props?.isAdd && (
              <>
                <div className={`${styles.riskFormChilds} dealFormPages`}>
                  <Label>Created by</Label>
                  <div className={`${styles.textField} ${styles.peoplePicker}`}>
                    <PeoplePicker
                      ensureUser
                      placeholder="Select the Person"
                      personSelectionLimit={1}
                      context={props.spfxContext}
                      defaultSelectedUsers={getSelectedEmails(
                        props?.data?.CreatedBy,
                        formData?.CreatedBy
                      )}
                      webAbsoluteUrl={
                        props?.spfxContext._pageContext._web.absoluteUrl
                      }
                      resolveDelay={100}
                      onChange={(items: any[]) =>
                        handleOnChange("CreatedBy", items)
                      }
                      disabled
                    />
                  </div>
                </div>
                <div className={`${styles.riskFormChilds} dealFormPages`}>
                  <Label>Created date</Label>
                  <DatePicker
                    value={
                      formData?.CreatedDate
                        ? new Date(formData.CreatedDate)
                        : undefined
                    }
                    onSelectDate={(date) => {
                      handleOnChange("CreatedDate", date);
                    }}
                    disabled
                  />
                </div>
                <div className={`${styles.riskFormChilds} dealFormPages`}>
                  <Label>Last updated by</Label>
                  <div className={`${styles.textField} ${styles.peoplePicker}`}>
                    <PeoplePicker
                      ensureUser
                      placeholder="Select the Person"
                      personSelectionLimit={1}
                      context={props.spfxContext}
                      defaultSelectedUsers={getSelectedEmails(
                        props?.data?.LastUpdatedBy,
                        formData?.LastUpdatedBy
                      )}
                      webAbsoluteUrl={
                        props?.spfxContext._pageContext._web.absoluteUrl
                      }
                      resolveDelay={100}
                      onChange={(items: any[]) =>
                        handleOnChange("LastUpdatedBy", items)
                      }
                      disabled
                    />
                  </div>
                </div>
                <div className={`${styles.riskFormChilds} dealFormPages`}>
                  <Label>Last updated date</Label>
                  <DatePicker
                    value={
                      formData?.LastUpdatedDate
                        ? new Date(formData.LastUpdatedDate)
                        : undefined
                    }
                    onSelectDate={(date) => {
                      handleOnChange("LastUpdatedDate", date);
                    }}
                    disabled
                  />
                </div>
              </>
            )}
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

export default CRForm;
