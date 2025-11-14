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
import { useState } from "react";
import styles from "../CommonStyles/CommonStyle.module.scss";
import projectFormStyles from "../Projects/Projects.module.scss";
import "../../../../External/CSS/Style.css";
import SPServices from "../../../../External/CommonServices/SPServices";
import {
  Config,
  DatePickerStyles,
} from "../../../../External/CommonServices/Config";
import {
  IBasicDropDown,
  ICRMBillingsListDrop,
} from "../../../../External/CommonServices/interface";
import { InputText } from "primereact/inputtext";
import { DatePicker, Label, PrimaryButton } from "@fluentui/react";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import Loading from "../../../../External/Loader/Loading";

const BillingsForm = (props: any) => {
  //Local States:
  const [
    initialCRMBillingsListDropContainer,
    setinitialCRMBillingsListDropContainer,
  ] = useState<ICRMBillingsListDrop>({
    ...Config.CRMBillingsDropDown,
  });
  const [formData, setFormData] = useState<any>({});
  const [errorMessage, setErrorMessage] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [tempBillingsFormArray, setTempBillingsFormArray] = useState<any[]>([]);
  const [loader, setLoader] = React.useState<boolean>(false);
  console.log(tempBillingsFormArray, "tembiilingsFormArray");

  //Get All choices from Project List:
  const getAllChoiceFromCRMBillingsList = () => {
    SPServices.SPGetChoices({
      Listname: Config.ListNames.CRMBillings,
      FieldName: "Status",
    })
      .then((res: any) => {
        let tempStatus: IBasicDropDown[] = [];
        if (res?.Choices?.length) {
          res?.Choices?.forEach((val: any) => {
            tempStatus.push({
              name: Config.statusLabelMap[val] || val,
            });
          });
        }
        setinitialCRMBillingsListDropContainer(
          (prev: ICRMBillingsListDrop) => ({
            ...prev,
            Status: tempStatus,
          })
        );
        SPServices.SPGetChoices({
          Listname: Config.ListNames.CRMBillings,
          FieldName: "Currency",
        })
          .then((res: any) => {
            let tempCurrency: IBasicDropDown[] = [];
            if (res?.Choices?.length) {
              res?.Choices?.forEach((val: any) => {
                tempCurrency.push({
                  name: val,
                });
              });
            }
            setinitialCRMBillingsListDropContainer(
              (prev: ICRMBillingsListDrop) => ({
                ...prev,
                Currency: tempCurrency,
              })
            );
            SPServices.SPGetChoices({
              Listname: Config.ListNames.CRMBillings,
              FieldName: "BillingFrequency",
            })
              .then((res: any) => {
                let tempBillingFrequency: IBasicDropDown[] = [];
                if (res?.Choices?.length) {
                  res?.Choices?.forEach((val: any) => {
                    tempBillingFrequency.push({
                      name: val,
                    });
                  });
                }
                setinitialCRMBillingsListDropContainer(
                  (prev: ICRMBillingsListDrop) => ({
                    ...prev,
                    BillingFrequency: tempBillingFrequency,
                  })
                );
              })
              .catch((err) => {
                console.log(
                  err,
                  "Get BillingFrequency choice error from CRMBillings list"
                );
              });
          })
          .catch((err) => {
            console.log(err, "Get Currency choice error from CRMBillings list");
          });
      })
      .catch((err) => {
        console.log(err, "Get Status choice error from CRMBillings list");
      });
  };

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

  //Data refresh and goBack mainPage function:
  const emptyDatas = () => {
    props?.refresh();
    props?.goBackBiilingsDashboard();
  };

  //Validations:
  const isValidField = (field: string, value: any): boolean => {
    switch (field) {
      case "BillingFrequency":
      case "Currency":
      case "MileStoneName":
      case "Status":
        return value && typeof value === "string" && value.trim() !== "";

      case "ReminderDaysBeforeDue":
      case "MonthlyAmount":
      case "Rate":
      case "Amount":
        return (
          value !== null &&
          value !== undefined &&
          value.toString().trim() !== ""
        );
      case "Hours":
        if (value) {
          const regex = /^([0-9]+)(:[0-9]{1,2})?$/;
          const match = value.match(regex);
          if (match) {
            const parts = value.split(":");
            if (parts.length === 2) {
              const minutes = Number(parts[1]);
              return minutes >= 0 && minutes < 60;
            }
            return true; // Only hours entered without colon is valid
          }
        }
        return false;

      case "DueDate":
      case "EndMonth":
      case "StartMonth":
        return value !== null && value !== undefined;

      default:
        return true;
    }
  };

  const Validation = () => {
    let errors: { [key: string]: boolean } = {};
    const billingModel = props?.BillingModel;
    // Common fields
    if (!isValidField("Currency", formData?.Currency)) errors.Currency = true;
    if (!isValidField("DueDate", formData?.DueDate)) errors.DueDate = true;
    if (!isValidField("Status", formData?.Status)) errors.Status = true;
    if (!isValidField("ReminderDaysBeforeDue", formData?.ReminderDaysBeforeDue))
      errors.ReminderDaysBeforeDue = true;

    // DueDate should be between Project StartDate and PlannedEndDate
    if (
      formData?.DueDate &&
      props?.ProjectsFormData?.StartDate &&
      props?.ProjectsFormData?.PlannedEndDate
    ) {
      const dueDate = new Date(formData?.DueDate);
      const startDate = new Date(props.ProjectsFormData?.StartDate);
      const endDate = new Date(props.ProjectsFormData?.PlannedEndDate);

      if (dueDate < startDate || dueDate > endDate) {
        props.Notify(
          "error",
          "Validation Error",
          "Due Date must be between Project Start Date and Planned End Date!"
        );
        errors.DueDate = true;
      }
    }

    // Billing model specific fields
    if (billingModel === "Milestone") {
      if (!isValidField("MileStoneName", formData?.MileStoneName))
        errors.MileStoneName = true;
      if (!isValidField("Amount", formData?.Amount)) errors.Amount = true;
    }

    if (billingModel === "T&M") {
      if (!isValidField("BillingFrequency", formData?.BillingFrequency))
        errors.BillingFrequency = true;
      if (!isValidField("Rate", formData?.Rate)) errors.Rate = true;
      if (!isValidField("Hours", formData?.Hours)) errors.Hours = true;
    }

    if (billingModel === "FixedMonthly") {
      if (!isValidField("StartMonth", formData?.StartMonth))
        errors.StartMonth = true;
      if (!isValidField("EndMonth", formData?.EndMonth)) errors.EndMonth = true;
      if (!isValidField("MonthlyAmount", formData?.MonthlyAmount))
        errors.MonthlyAmount = true;
    }

    setErrorMessage(errors);

    if (Object.keys(errors).length === 0) {
      generateJson();
    }
  };

  //Json Generations:
  const generateJson = () => {
    let json = {
      Amount: formData?.Amount ? formData?.Amount : 0,
      BillingFrequency: formData?.BillingFrequency
        ? formData?.BillingFrequency
        : "",
      Currency: formData?.Currency ? formData?.Currency : "",
      DueDate: formData?.DueDate
        ? SPServices.GetDateFormat(formData?.DueDate)
        : null,
      EndMonth: formData?.EndMonth
        ? SPServices.GetDateFormat(formData?.EndMonth)
        : null,
      MileStoneDescription: formData?.MileStoneDescription
        ? formData?.MileStoneDescription
        : "",
      CompletionPercentage: formData?.CompletionPercentage
        ? formData?.CompletionPercentage
        : null,
      MileStoneName: formData?.MileStoneName ? formData?.MileStoneName : "",
      MonthlyAmount: formData?.MonthlyAmount ? formData?.MonthlyAmount : 0,
      Notes: formData?.Notes ? formData?.Notes : "",
      ProjectId: props?.selectedProjectsData?.ID,
      Rate: formData?.Rate ? formData?.Rate : 0,
      Hours: formData?.Hours ? formData?.Hours : "",
      TMAmount: formData?.TMAmount ? formData?.TMAmount : 0,
      ReminderDaysBeforeDue: formData?.ReminderDaysBeforeDue
        ? formData?.ReminderDaysBeforeDue
        : "",
      ResourceType: formData?.ResourceType ? formData?.ResourceType : "",
      StartMonth: formData?.StartMonth
        ? SPServices.GetDateFormat(formData?.StartMonth)
        : null,
      Status: formData?.Status
        ? Config.statusReverseMap[formData?.Status] || formData?.Status
        : "",
    };
    if (props?.isEdit) {
      handleUpdate(json);
    } else {
      handleAdd(json);
    }
  };

  //Add datas to CRMBillings List:
  const handleAdd = (json: any) => {
    setLoader(true);
    if (props?.projectsFormAdd) {
      const oldData = JSON.parse(
        sessionStorage.getItem("billingsData") || "[]"
      );
      const randomId = Math.floor(100000 + Math.random() * 900000);
      const newData = { ...json, ID: randomId };
      const updatedArray = [...oldData, newData];
      setTempBillingsFormArray(updatedArray);
      sessionStorage.setItem("billingsData", JSON.stringify(updatedArray));
      props?.getBillingFormDetails(updatedArray);
      props?.getBillingsAddDetails(updatedArray);
      setLoader(false);
      props?.goBackBiilingsDashboard();
    } else {
      SPServices.SPAddItem({
        Listname: Config.ListNames.CRMBillings,
        RequestJSON: json,
      })
        .then((res) => {
          props.Notify("success", "Success", "Milestone added successfully");
          emptyDatas();
          props?.getBillingsAddDetails(res);
          setLoader(false);
        })
        .catch((err) => {
          setLoader(false);
          console.log(
            err,
            "Add Datas to CRMBillings err in BillingsFormPage.tsx component"
          );
        });
    }
  };

  //Update Datas to CRMProjects List:
  const handleUpdate = (json: any) => {
    setLoader(true);
    if (props?.projectsFormAdd) {
      const oldData = JSON.parse(
        sessionStorage.getItem("billingsData") || "[]"
      );
      const updatedArray = oldData.map((item: any) =>
        item.ID === formData?.ID ? { ...item, ...json } : item
      );
      setTempBillingsFormArray(updatedArray);
      sessionStorage.setItem("billingsData", JSON.stringify(updatedArray));
      props?.getBillingFormDetails(updatedArray);
      props?.getBillingsAddDetails(updatedArray);
      setLoader(false);
      props?.goBackBiilingsDashboard();
    } else {
      SPServices.SPUpdateItem({
        Listname: Config.ListNames.CRMBillings,
        RequestJSON: json,
        ID: formData?.ID,
      })
        .then((res) => {
          props.Notify("success", "Success", "Milestone updated successfully");
          emptyDatas();
          props?.getBillingsAddDetails(res);
          setLoader(false);
        })
        .catch((err) => {
          console.log(
            err,
            "Update Datas to CRMBillings err in Billings FormPage.tsx component"
          );
        });
    }
  };

  //RowData is once comming then data set to the state:
  React.useEffect(() => {
    setFormData(props?.selectedCRMBillingsRowData);
  }, [props?.selectedCRMBillingsRowData]);

  //Initial Render:
  React.useEffect(() => {
    getAllChoiceFromCRMBillingsList();
    if (!props?.selectedCRMBillingsRowData) {
      setFormData({
        Amount: null,
        TMAmount: null,
        BillingFrequency: "",
        Currency: "",
        DueDate: null,
        EndMonth: null,
        MileStoneDescription: "",
        ConpletionPercentage: 0,
        MileStoneName: "",
        MonthlyAmount: null,
        Notes: "",
        Rate: null,
        Hours: "",
        ReminderDaysBeforeDue: 7,
        ResourceType: "",
        StartMonth: null,
        Status: "Not generated invoice",
      });
    }
  }, []);
  return (
    <>
      {loader ? (
        <Loading />
      ) : (
        <div
          style={{ margin: "0px", height: "490px" }}
          className={styles.viewFormMain}
        >
          <div className={styles.viewFormNavBar}>
            <h2>
              {props?.isAdd
                ? "Add milestone"
                : props?.isEdit
                ? "Edit milestone"
                : "View milestone"}
            </h2>
          </div>
          <div
            style={{ height: "48vh" }}
            className={projectFormStyles.formPage}
          >
            <div className={projectFormStyles.firstPage}>
              {props?.BillingModel == "Milestone" && (
                <>
                  <div className={`${projectFormStyles.allField} dealFormPage`}>
                    <Label>Milestone name</Label>
                    <InputText
                      value={formData?.MileStoneName}
                      onChange={(e) =>
                        handleOnChange("MileStoneName", e.target.value)
                      }
                      placeholder="Enter Milestone name"
                      style={
                        errorMessage["MileStoneName"]
                          ? { border: "2px solid #ff0000" }
                          : undefined
                      }
                      disabled={props?.isView}
                    />
                  </div>
                  <div className={`${projectFormStyles.allField} dealFormPage`}>
                    <Label>Milestone description</Label>
                    <InputTextarea
                      maxLength={500}
                      value={formData?.MileStoneDescription}
                      onChange={(e) =>
                        handleOnChange("MileStoneDescription", e.target.value)
                      }
                      disabled={props?.isView}
                      autoResize
                    />
                  </div>
                  <div className={`${projectFormStyles.allField} dealFormPage`}>
                    <Label>Completion percentage</Label>
                    <InputText
                      value={formData?.CompletionPercentage}
                      onChange={(e) => {
                        const onlyNumbers = e.target.value.replace(/\D/g, "");
                        handleOnChange("CompletionPercentage", onlyNumbers);
                      }}
                      placeholder="Enter completion percentage (0%-100%)"
                      disabled={props?.isView}
                    />
                  </div>
                  <div className={`${projectFormStyles.allField} dealFormPage`}>
                    <Label>Amount</Label>
                    <InputText
                      value={formData?.Amount}
                      //   onChange={(e) => handleOnChange("Amount", e.target.value)}
                      onChange={(e) => {
                        const onlyNumbers = e.target.value.replace(/\D/g, "");
                        handleOnChange("Amount", onlyNumbers);
                      }}
                      placeholder="Enter amount"
                      style={
                        errorMessage["Amount"]
                          ? { border: "2px solid #ff0000" }
                          : undefined
                      }
                      disabled={props?.isView}
                    />
                  </div>
                </>
              )}
              {props?.BillingModel == "FixedMonthly" && (
                <>
                  <div className={`${projectFormStyles.allField} dealFormPage`}>
                    <Label> Start month</Label>
                    <DatePicker
                      value={
                        formData?.StartMonth
                          ? new Date(formData?.StartMonth)
                          : undefined
                      }
                      formatDate={(date) =>
                        date
                          ? date.toLocaleString("default", {
                              month: "long",
                              year: "numeric",
                            })
                          : ""
                      }
                      onSelectDate={(date) =>
                        handleOnChange("StartMonth", date)
                      }
                      styles={
                        errorMessage["StartMonth"]
                          ? {
                              root: {
                                border: "2px solid #ff0000",
                                height: "35px",
                                borderRadius: "4px",
                              },
                            }
                          : DatePickerStyles
                      }
                      disabled={props?.isView}
                    />
                  </div>
                  <div className={`${projectFormStyles.allField} dealFormPage`}>
                    <Label>End month</Label>
                    <DatePicker
                      value={
                        formData?.EndMonth
                          ? new Date(formData?.EndMonth)
                          : undefined
                      }
                      onSelectDate={(date) => handleOnChange("EndMonth", date)}
                      formatDate={(date) =>
                        date
                          ? date.toLocaleString("default", {
                              month: "long",
                              year: "numeric",
                            })
                          : ""
                      }
                      styles={
                        errorMessage["EndMonth"]
                          ? {
                              root: {
                                border: "2px solid #ff0000",
                                height: "35px",
                                borderRadius: "4px",
                              },
                            }
                          : DatePickerStyles
                      }
                      disabled={props?.isView}
                    />
                  </div>
                  <div className={`${projectFormStyles.allField} dealFormPage`}>
                    <Label>Monthly amount</Label>
                    <InputText
                      value={formData?.MonthlyAmount}
                      onChange={(e) => {
                        const onlyNumbers = e.target.value.replace(/\D/g, "");
                        handleOnChange("MonthlyAmount", onlyNumbers);
                      }}
                      placeholder="Enter Monthly amount"
                      style={
                        errorMessage["MonthlyAmount"]
                          ? { border: "2px solid #ff0000" }
                          : undefined
                      }
                      disabled={props?.isView}
                    />
                  </div>
                </>
              )}
              {props?.BillingModel == "T&M" && (
                <div className={`${projectFormStyles.allField} dealFormPage`}>
                  <Label>Resource name</Label>
                  <InputText
                    value={formData?.ResourceType}
                    onChange={(e) =>
                      handleOnChange("ResourceType", e.target.value)
                    }
                    placeholder="Enter Resource name"
                    disabled={props?.isView}
                  />
                </div>
              )}
              {props?.BillingModel == "T&M" && (
                <>
                  <div className={`${projectFormStyles.allField} dealFormPage`}>
                    <Label>Billing frequency</Label>
                    <Dropdown
                      value={initialCRMBillingsListDropContainer?.BillingFrequency.find(
                        (item: any) => item.name === formData?.BillingFrequency
                      )}
                      onChange={(e) =>
                        handleOnChange("BillingFrequency", e?.value?.name)
                      }
                      options={
                        initialCRMBillingsListDropContainer?.BillingFrequency
                      }
                      optionLabel="name"
                      placeholder="Select a BillingFrequency"
                      style={
                        errorMessage["BillingFrequency"]
                          ? { border: "2px solid #ff0000", borderRadius: "4px" }
                          : undefined
                      }
                      disabled={props?.isView}
                    />
                  </div>
                  <div className={`${projectFormStyles.allField} dealFormPage`}>
                    <Label>Rate</Label>
                    <InputText
                      value={formData?.Rate}
                      // onChange={(e) => {
                      //   const onlyNumbers = e.target.value.replace(/\D/g, "");
                      //   handleOnChange("Rate", onlyNumbers);
                      // }}
                      onChange={(e) => {
                        const onlyNumbers = e.target.value.replace(/\D/g, "");
                        handleOnChange("Rate", onlyNumbers);

                        // check both fields
                        const hoursVal = formData?.Hours || "";
                        if (onlyNumbers && hoursVal) {
                          let totalHours = 0;
                          if (hoursVal.includes(":")) {
                            const [h, m] = hoursVal.split(":").map(Number);
                            totalHours = h + (m ? m / 60 : 0);
                          } else {
                            totalHours = parseFloat(hoursVal);
                          }

                          const amount = (
                            parseFloat(onlyNumbers) * totalHours
                          ).toFixed(2);
                          handleOnChange("TMAmount", amount);
                        } else {
                          handleOnChange("TMAmount", "");
                        }
                      }}
                      placeholder="Enter Rate"
                      style={
                        errorMessage["Rate"]
                          ? { border: "2px solid #ff0000" }
                          : undefined
                      }
                      disabled={props?.isView}
                    />
                  </div>
                  <div className={`${projectFormStyles.allField} dealFormPage`}>
                    <Label>Hours</Label>
                    <InputText
                      value={formData?.Hours || ""}
                      // onChange={(e) => {
                      //   const val = e.target.value;
                      //   // Allow only digits and colon
                      //   const regex = /^[0-9:]*$/;
                      //   if (regex.test(val)) {
                      //     handleOnChange("Hours", val);
                      //   }
                      // }}
                      onChange={(e) => {
                        const val = e.target.value;
                        const regex = /^[0-9:]*$/;
                        if (regex.test(val)) {
                          handleOnChange("Hours", val);

                          // check both fields
                          const rateVal = formData?.Rate || "";
                          if (rateVal && val) {
                            let totalHours = 0;
                            if (val.includes(":")) {
                              const [h, m] = val.split(":").map(Number);
                              totalHours = h + (m ? m / 60 : 0);
                            } else {
                              totalHours = parseFloat(val);
                            }

                            const amount = (
                              parseFloat(rateVal) * totalHours
                            ).toFixed(2);
                            handleOnChange("TMAmount", amount);
                          } else {
                            handleOnChange("TMAmount", "");
                          }
                        }
                      }}
                      placeholder="Enter Hours (e.g. 90:20)"
                      style={
                        errorMessage["Hours"]
                          ? { border: "2px solid #ff0000" }
                          : undefined
                      }
                      disabled={props?.isView}
                    />
                  </div>
                  <div className={`${projectFormStyles.allField} dealFormPage`}>
                    <Label>Amount</Label>
                    <InputText value={formData?.TMAmount || ""} disabled />
                  </div>
                </>
              )}
              <div className={`${projectFormStyles.allField} dealFormPage`}>
                <Label>Currency</Label>
                <Dropdown
                  value={initialCRMBillingsListDropContainer?.Currency.find(
                    (item) => item.name === formData?.Currency
                  )}
                  onChange={(e) => handleOnChange("Currency", e?.value?.name)}
                  options={initialCRMBillingsListDropContainer?.Currency}
                  optionLabel="name"
                  placeholder="Select a currency"
                  style={
                    errorMessage["Currency"]
                      ? { border: "2px solid #ff0000", borderRadius: "4px" }
                      : undefined
                  }
                  disabled={props?.isView}
                />
              </div>
              {/* <div className={`${projectFormStyles.allField} dealFormPage`}>
            <Label>Status</Label>
            <Dropdown
              value={initialCRMBillingsListDropContainer?.Status.find(
                (item) =>
                  item.name ===
                  (Config.statusLabelMap[formData?.Status] || formData?.Status)
              )}
              onChange={(e) => handleOnChange("Status", e?.value?.name)}
              options={initialCRMBillingsListDropContainer?.Status}
              optionLabel="name"
              placeholder="Select a start month"
              style={
                errorMessage["Status"]
                  ? { border: "2px solid #ff0000", borderRadius: "4px" }
                  : undefined
              }
              disabled
            />
          </div> */}
            </div>
            <div className={projectFormStyles.secondPage}>
              <div className={`${projectFormStyles.allField} dealFormPage`}>
                <Label>Due date</Label>
                <DatePicker
                  value={
                    formData?.DueDate ? new Date(formData?.DueDate) : undefined
                  }
                  onSelectDate={(date) => handleOnChange("DueDate", date)}
                  styles={
                    errorMessage["DueDate"]
                      ? {
                          root: {
                            border: "2px solid #ff0000",
                            height: "35px",
                            borderRadius: "4px",
                          },
                        }
                      : DatePickerStyles
                  }
                  disabled={props?.isView}
                />
              </div>
              <div className={`${projectFormStyles.allField} dealFormPage`}>
                <Label>Reminder days before due</Label>
                <InputText
                  value={formData?.ReminderDaysBeforeDue}
                  onChange={(e) => {
                    const onlyNumbers = e.target.value.replace(/\D/g, "");
                    handleOnChange("ReminderDaysBeforeDue", onlyNumbers);
                  }}
                  placeholder="Enter Reminder days before due"
                  style={
                    errorMessage["ReminderDaysBeforeDue"]
                      ? { border: "2px solid #ff0000" }
                      : undefined
                  }
                  disabled={props?.isView}
                />
              </div>

              <div className={`${projectFormStyles.allField} dealFormPage`}>
                <Label>Notes</Label>
                <InputTextarea
                  maxLength={500}
                  value={formData?.Notes}
                  onChange={(e) => handleOnChange("Notes", e.target.value)}
                  placeholder="Enter notes"
                  disabled={props?.isView}
                  autoResize
                />
              </div>
            </div>
          </div>
          <div className={styles.addUpdateBtns}>
            <PrimaryButton
              className={styles.cancelBtn}
              iconProps={{ iconName: "cancel" }}
              onClick={() => props?.goBackBiilingsDashboard()}
            >
              Cancel
            </PrimaryButton>
            {props?.isView == false && (
              <PrimaryButton
                className={styles.updateBtn}
                iconProps={{ iconName: "Save" }}
                onClick={() => Validation()}
              >
                {props?.isEdit ? "Update" : "Save"}
              </PrimaryButton>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BillingsForm;
