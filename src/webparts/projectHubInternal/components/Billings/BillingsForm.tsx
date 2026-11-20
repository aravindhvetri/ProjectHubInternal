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
  ICRMItemDetailRow,
} from "../../../../External/CommonServices/interface";
import { InputText } from "primereact/inputtext";
import { DatePicker, Label, PrimaryButton } from "@fluentui/react";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import Loading from "../../../../External/Loader/Loading";
import CRMItemDetails, {
  buildCRMItemDetailsPayload,
  calcItemDetailsSummary,
  calcRowAmount,
  createEmptyItemRow,
  saveCRMItemDetailsRows,
} from "./CRMItemDetails";

const BillingsForm = (props: any) => {
  console.log(props, "billings form props");
  //Local States:
  const [
    initialCRMBillingsListDropContainer,
    setinitialCRMBillingsListDropContainer,
  ] = useState<ICRMBillingsListDrop>({
    ...Config.CRMBillingsDropDown,
  });
  const [formData, setFormData] = useState<any>({});
  const [errorMessage, setErrorMessage] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [tempBillingsFormArray, setTempBillingsFormArray] = useState<any[]>([]);
  const [itemDetailsRows, setItemDetailsRows] = useState<ICRMItemDetailRow[]>([
    createEmptyItemRow(),
  ]);
  const [deletedItemDetailIds, setDeletedItemDetailIds] = useState<number[]>(
    [],
  );
  const [itemDetailsFieldErrors, setItemDetailsFieldErrors] = useState<{
    [tempId: string]: {
      ItemDetails?: boolean;
      Quantity?: boolean;
      Rate?: boolean;
    };
  }>({});
  const [loader, setLoader] = React.useState<boolean>(false);
  console.log(tempBillingsFormArray, "tembiilingsFormArray");

  const mapSPItemDetails = (items: any[]): ICRMItemDetailRow[] => {
    if (!items?.length) return [createEmptyItemRow()];
    return items.map((item: any) => {
      const quantity =
        item?.Quantity !== null && item?.Quantity !== undefined
          ? String(item.Quantity)
          : "";
      const rate =
        item?.Rate !== null && item?.Rate !== undefined
          ? String(item.Rate)
          : "";
      return {
        ID: item?.ID,
        tempId: `sp_${item?.ID}`,
        ItemDetails: item?.ItemDetails || "",
        Quantity: quantity,
        Rate: rate,
        Discount:
          item?.Discount !== null && item?.Discount !== undefined
            ? String(item.Discount)
            : "",
        Tax: item?.Tax || "",
        // Amount = Qty × Rate (before Discount / GST)
        Amount: calcRowAmount(quantity, rate),
      };
    });
  };

  const isItemDetailsRowEmpty = (row: ICRMItemDetailRow) =>
    !(row.ItemDetails && row.ItemDetails.trim() !== "") &&
    !(row.Quantity && row.Quantity.toString().trim() !== "") &&
    !(row.Rate && row.Rate.toString().trim() !== "") &&
    !(row.Discount && row.Discount.toString().trim() !== "") &&
    !(row.Tax && row.Tax.trim() !== "");

  const isItemDetailsRowComplete = (row: ICRMItemDetailRow) =>
    !!(row.ItemDetails && row.ItemDetails.trim() !== "") &&
    !!(row.Quantity && row.Quantity.toString().trim() !== "") &&
    !!(row.Rate && row.Rate.toString().trim() !== "");

  // Only complete rows (Item Details + Qty + Rate) are saved / totaled
  const getMeaningfulItemRows = (rows: ICRMItemDetailRow[]) =>
    (rows || []).filter((row) => isItemDetailsRowComplete(row));

  const loadItemDetailsByInvoiceId = (invoiceId: number) => {
    if (!invoiceId) {
      setItemDetailsRows([createEmptyItemRow()]);
      setDeletedItemDetailIds([]);
      return;
    }
    SPServices.SPReadItems({
      Listname: Config.ListNames.CRMItemDetails,
      Select: "*,InvoiceMergeID/Id",
      Expand: "InvoiceMergeID",
      // Omit Orderbydecorasc: SPServices formatInputs flips explicit `true` to `false`.
      // Default (undefined) becomes ascending so ID order = creation order.
      Orderby: "ID",
      Filter: [
        {
          FilterKey: "InvoiceMergeIDId",
          Operator: "eq",
          FilterValue: `${invoiceId}`,
        },
        {
          FilterKey: "IsDeleted",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
    })
      .then((res: any) => {
        // Enforce creation order (lowest ID first) regardless of service defaults
        const sorted = [...(res || [])].sort(
          (a: any, b: any) => (Number(a?.ID) || 0) - (Number(b?.ID) || 0),
        );
        setItemDetailsRows(mapSPItemDetails(sorted));
        setDeletedItemDetailIds([]);
      })
      .catch((err: any) => {
        console.log(
          err,
          "Get CRMItemDetails error in BillingsForm.tsx component",
        );
        setItemDetailsRows([createEmptyItemRow()]);
        setDeletedItemDetailIds([]);
      });
  };

  const handleItemDetailsChange = (rows: ICRMItemDetailRow[]) => {
    const previousIds = (itemDetailsRows || [])
      .map((row) => row.ID)
      .filter((id): id is number => !!id);
    const nextIds = new Set(
      (rows || []).map((row) => row.ID).filter((id): id is number => !!id),
    );
    const newlyRemoved = previousIds.filter((id) => !nextIds.has(id));
    if (newlyRemoved.length) {
      setDeletedItemDetailIds((prev) => [
        ...prev,
        ...newlyRemoved.filter((id) => !prev.includes(id)),
      ]);
    }
    setItemDetailsRows(rows);
    // Clear only the field that now has a value. Other fields keep their errors.
    setItemDetailsFieldErrors((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next: typeof prev = {};
      rows.forEach((row) => {
        const err = prev[row.tempId];
        if (!err) return;
        const updated: typeof err = {};
        if (err.ItemDetails && !(row.ItemDetails && row.ItemDetails.trim())) {
          updated.ItemDetails = true;
        }
        if (
          err.Quantity &&
          !(row.Quantity && row.Quantity.toString().trim() !== "")
        ) {
          updated.Quantity = true;
        }
        if (err.Rate && !(row.Rate && row.Rate.toString().trim() !== "")) {
          updated.Rate = true;
        }
        if (Object.keys(updated).length) {
          next[row.tempId] = updated;
        }
      });
      return next;
    });
  };

  const saveBillingTotals = async (
    invoiceId: number,
    total: number,
    taxTotal: number,
    subTotal: number,
    totalDiscount: number,
  ) => {
    if (!invoiceId) return;
    await SPServices.SPUpdateItem({
      Listname: Config.ListNames.CRMBillings,
      ID: invoiceId,
      RequestJSON: {
        // Persist as string values (matches calculated display / text-compatible columns)
        Total: String(Number(total ?? 0).toFixed(2)),
        TaxTotal: String(Number(taxTotal ?? 0).toFixed(2)),
        SubTotal: String(Number(subTotal ?? 0).toFixed(2)),
        TotalDiscount: String(Number(totalDiscount ?? 0).toFixed(2)),
      },
    });
  };

  const saveItemDetailsForInvoice = async (invoiceId: number) => {
    const rowsToSave = getMeaningfulItemRows(itemDetailsRows);

    // Soft-delete removed rows (IsDeleted = true) — do not permanently delete
    if (deletedItemDetailIds.length) {
      await Promise.all(
        deletedItemDetailIds.map((id) =>
          SPServices.SPUpdateItem({
            Listname: Config.ListNames.CRMItemDetails,
            ID: id,
            RequestJSON: { IsDeleted: true },
          }),
        ),
      );
    }

    const existingRows = rowsToSave.filter((row) => !!row.ID);
    const newRows = rowsToSave.filter((row) => !row.ID);

    // Update existing rows
    if (existingRows.length) {
      await Promise.all(
        existingRows.map((row) =>
          SPServices.SPUpdateItem({
            Listname: Config.ListNames.CRMItemDetails,
            ID: row.ID as number,
            RequestJSON: buildCRMItemDetailsPayload(row, invoiceId),
          }),
        ),
      );
    }

    // Insert new rows
    if (newRows.length) {
      await saveCRMItemDetailsRows(newRows, invoiceId);
    }
  };

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
          }),
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
              }),
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
                  }),
                );
              })
              .catch((err) => {
                console.log(
                  err,
                  "Get BillingFrequency choice error from CRMBillings list",
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
      // const endDate = new Date(props.ProjectsFormData?.PlannedEndDate);

      if (dueDate < startDate) {
        props.Notify(
          "error",
          "Validation Error",
          "Due Date should be after the Project Start Date!",
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

    // Item Details: every started row must have Item Details, Quantity, and Rate
    const rowFieldErrors: {
      [tempId: string]: {
        ItemDetails?: boolean;
        Quantity?: boolean;
        Rate?: boolean;
      };
    } = {};
    let hasIncompleteItemRow = false;
    (itemDetailsRows || []).forEach((row) => {
      if (isItemDetailsRowEmpty(row)) return;
      const fieldErr: {
        ItemDetails?: boolean;
        Quantity?: boolean;
        Rate?: boolean;
      } = {};
      if (!(row.ItemDetails && row.ItemDetails.trim() !== "")) {
        fieldErr.ItemDetails = true;
      }
      if (!(row.Quantity && row.Quantity.toString().trim() !== "")) {
        fieldErr.Quantity = true;
      }
      if (!(row.Rate && row.Rate.toString().trim() !== "")) {
        fieldErr.Rate = true;
      }
      if (Object.keys(fieldErr).length) {
        rowFieldErrors[row.tempId] = fieldErr;
        hasIncompleteItemRow = true;
      }
    });
    setItemDetailsFieldErrors(rowFieldErrors);

    if (hasIncompleteItemRow) {
      props.Notify(
        "error",
        "Validation Error",
        "Please fill Item Details, Quantity, and Rate for every Item Details row.",
      );
      errors.ItemDetails = true;
    }

    // At least one complete Item Details row is required
    const meaningfulItemRows = getMeaningfulItemRows(itemDetailsRows);
    if (!meaningfulItemRows.length && !hasIncompleteItemRow) {
      props.Notify(
        "error",
        "Validation Error",
        "Please add at least one Item Details row before saving the invoice.",
      );
      errors.ItemDetails = true;
    }

    setErrorMessage(errors);

    if (Object.keys(errors).length === 0) {
      generateJson();
    }
  };

  // Billing Model amount used when no Item Details are provided
  const getBillingModelAmount = (): number => {
    const model = props?.BillingModel;
    if (model === "Milestone") {
      return parseFloat(String(formData?.Amount ?? "")) || 0;
    }
    if (model === "FixedMonthly") {
      return parseFloat(String(formData?.MonthlyAmount ?? "")) || 0;
    }
    if (model === "T&M") {
      return parseFloat(String(formData?.TMAmount ?? "")) || 0;
    }
    return 0;
  };

  // Calculated Item Details total shown in the Billing Model amount field
  const itemDetailsAmountDisplay = (() => {
    const meaningfulRows = getMeaningfulItemRows(itemDetailsRows);
    if (!meaningfulRows.length) return "";
    return calcItemDetailsSummary(meaningfulRows).total.toFixed(2);
  })();

  // Keep Billing Model amount field in sync with Item Details total
  React.useEffect(() => {
    const model = props?.BillingModel;
    const field =
      model === "Milestone"
        ? "Amount"
        : model === "FixedMonthly"
          ? "MonthlyAmount"
          : model === "T&M"
            ? "TMAmount"
            : null;
    if (!field) return;
    setFormData((prev: any) => {
      if (!prev) return prev;
      if (String(prev?.[field] ?? "") === String(itemDetailsAmountDisplay)) {
        return prev;
      }
      return { ...prev, [field]: itemDetailsAmountDisplay };
    });
    if (itemDetailsAmountDisplay) {
      setErrorMessage((prev) => ({ ...prev, [field]: false }));
    }
  }, [itemDetailsAmountDisplay, props?.BillingModel]);

  //Json Generations:
  const generateJson = () => {
    const meaningfulRows = getMeaningfulItemRows(itemDetailsRows);
    const itemSummary = calcItemDetailsSummary(meaningfulRows);
    const hasItemDetails = meaningfulRows.length > 0;
    // Total: Item Details final total when rows exist; otherwise Billing Model amount
    const totalToSave = hasItemDetails
      ? itemSummary.total
      : getBillingModelAmount();
    const taxTotalToSave = hasItemDetails ? itemSummary.taxValue : 0;
    const subTotalToSave = hasItemDetails ? itemSummary.subTotal : 0;
    const totalDiscountToSave = hasItemDetails ? itemSummary.discountValue : 0;
    const billingAmountFromItems = hasItemDetails
      ? itemSummary.total.toFixed(2)
      : null;
    // Keep CRMBillings payload aligned with existing list fields.
    // Total/TaxTotal/SubTotal/TotalDiscount are included for the new columns; ItemDetails stays UI-only.
    let json = {
      Amount:
        props?.BillingModel === "Milestone" && billingAmountFromItems != null
          ? billingAmountFromItems
          : formData?.Amount
            ? formData?.Amount
            : 0,
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
      MonthlyAmount:
        props?.BillingModel === "FixedMonthly" &&
        billingAmountFromItems != null
          ? billingAmountFromItems
          : formData?.MonthlyAmount
            ? formData?.MonthlyAmount
            : 0,
      Notes: formData?.Notes ? formData?.Notes : "",
      ProjectId: props?.selectedProjectsData?.ID,
      Rate: formData?.Rate ? formData?.Rate : 0,
      Hours: formData?.Hours ? formData?.Hours : "",
      TMAmount:
        props?.BillingModel === "T&M" && billingAmountFromItems != null
          ? billingAmountFromItems
          : formData?.TMAmount
            ? formData?.TMAmount
            : 0,
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
      DummyInvoice: formData?.DummyInvoice === true,
      Total: totalToSave,
      TaxTotal: taxTotalToSave,
      SubTotal: subTotalToSave,
      TotalDiscount: totalDiscountToSave,
    };
    if (props?.isEdit) {
      handleUpdate(json);
    } else {
      handleAdd(json);
    }
  };

  // Existing CRMBillings fields only (Total/TaxTotal/SubTotal/TotalDiscount saved in a follow-up update)
  const getCRMBillingsCoreJSON = (json: any) => {
    const {
      ItemDetails,
      ID,
      Total,
      TaxTotal,
      SubTotal,
      TotalDiscount,
      ...billingPayload
    } = json || {};
    return billingPayload;
  };

  //Add datas to CRMBillings List:
  const handleAdd = (json: any) => {
    setLoader(true);
    if (props?.projectsFormAdd) {
      const oldData = JSON.parse(
        sessionStorage.getItem("billingsData") || "[]",
      );
      const randomId = Math.floor(100000 + Math.random() * 900000);
      const newData = {
        ...getCRMBillingsCoreJSON(json),
        Total: json?.Total ?? 0,
        TaxTotal: json?.TaxTotal ?? 0,
        SubTotal: json?.SubTotal ?? 0,
        TotalDiscount: json?.TotalDiscount ?? 0,
        ID: randomId,
        ItemDetails: getMeaningfulItemRows(itemDetailsRows),
      };
      const updatedArray = [...oldData, newData];
      setTempBillingsFormArray(updatedArray);
      sessionStorage.setItem("billingsData", JSON.stringify(updatedArray));
      props?.getBillingFormDetails(updatedArray);
      props?.getBillingsAddDetails(updatedArray);
      setLoader(false);
      props?.goBackBiilingsDashboard();
    } else {
      // 1) Existing CRMBillings create (unchanged field set)
      SPServices.SPAddItem({
        Listname: Config.ListNames.CRMBillings,
        RequestJSON: getCRMBillingsCoreJSON(json),
      })
        .then(async (res: any) => {
          const invoiceId = res?.data?.ID ?? res?.data?.Id;
          try {
            if (invoiceId) {
              // 2) Save Total / TaxTotal / SubTotal
              try {
                await saveBillingTotals(
                  invoiceId,
                  json?.Total ?? 0,
                  json?.TaxTotal ?? 0,
                  json?.SubTotal ?? 0,
                  json?.TotalDiscount ?? 0,
                );
              } catch (totalErr) {
                console.log(
                  totalErr,
                  "Save Total/TaxTotal/SubTotal/TotalDiscount err in BillingsForm.tsx",
                );
              }
              // 3) Save Item Details linked by InvoiceMergeID
              await saveItemDetailsForInvoice(invoiceId);
            }
            props.Notify("success", "Success", "Milestone added successfully");
            emptyDatas();
            props?.getBillingsAddDetails(res);
            setLoader(false);
          } catch (itemErr) {
            setLoader(false);
            console.log(
              itemErr,
              "Add ItemDetails to CRMItemDetails err in BillingsForm.tsx component",
            );
            props.Notify(
              "error",
              "Error",
              "Invoice saved, but Item Details could not be saved.",
            );
            emptyDatas();
          }
        })
        .catch((err) => {
          setLoader(false);
          console.log(
            err,
            "Add Datas to CRMBillings err in BillingsFormPage.tsx component",
          );
        });
    }
  };

  //Update Datas to CRMProjects List:
  const handleUpdate = (json: any) => {
    setLoader(true);
    if (props?.projectsFormAdd) {
      const oldData = JSON.parse(
        sessionStorage.getItem("billingsData") || "[]",
      );
      const updatedArray = oldData.map((item: any) =>
        item.ID === formData?.ID
          ? {
              ...item,
              ...getCRMBillingsCoreJSON(json),
              Total: json?.Total ?? 0,
              TaxTotal: json?.TaxTotal ?? 0,
              SubTotal: json?.SubTotal ?? 0,
              TotalDiscount: json?.TotalDiscount ?? 0,
              ItemDetails: getMeaningfulItemRows(itemDetailsRows),
            }
          : item,
      );
      setTempBillingsFormArray(updatedArray);
      sessionStorage.setItem("billingsData", JSON.stringify(updatedArray));
      props?.getBillingFormDetails(updatedArray);
      props?.getBillingsAddDetails(updatedArray);
      setLoader(false);
      props?.goBackBiilingsDashboard();
    } else {
      // 1) Existing CRMBillings update (unchanged field set)
      SPServices.SPUpdateItem({
        Listname: Config.ListNames.CRMBillings,
        RequestJSON: getCRMBillingsCoreJSON(json),
        ID: formData?.ID,
      })
        .then(async (res: any) => {
          try {
            if (formData?.ID) {
              // 2) Save Total / TaxTotal / SubTotal
              try {
                await saveBillingTotals(
                  formData.ID,
                  json?.Total ?? 0,
                  json?.TaxTotal ?? 0,
                  json?.SubTotal ?? 0,
                  json?.TotalDiscount ?? 0,
                );
              } catch (totalErr) {
                console.log(
                  totalErr,
                  "Update Total/TaxTotal/SubTotal/TotalDiscount err in BillingsForm.tsx",
                );
              }
              // 3) Sync Item Details (add/update/delete)
              await saveItemDetailsForInvoice(formData.ID);
            }
            props.Notify(
              "success",
              "Success",
              "Milestone updated successfully",
            );
            emptyDatas();
            props?.getBillingsAddDetails(res);
            setLoader(false);
          } catch (itemErr) {
            setLoader(false);
            console.log(
              itemErr,
              "Update ItemDetails to CRMItemDetails err in BillingsForm.tsx component",
            );
            props.Notify(
              "error",
              "Error",
              "Invoice updated, but Item Details could not be saved.",
            );
            emptyDatas();
          }
        })
        .catch((err) => {
          setLoader(false);
          console.log(
            err,
            "Update Datas to CRMBillings err in Billings FormPage.tsx component",
          );
        });
    }
  };

  //RowData is once coming then data set to the state:
  React.useEffect(() => {
    if (props?.selectedCRMBillingsRowData) {
      setFormData(props?.selectedCRMBillingsRowData);
      if (
        props?.projectsFormAdd &&
        props?.selectedCRMBillingsRowData?.ItemDetails?.length
      ) {
        setItemDetailsRows(
          props.selectedCRMBillingsRowData.ItemDetails.map(
            (row: any, index: number) => ({
              ID: row?.ID || null,
              tempId: row?.tempId || `session_${index}_${Date.now()}`,
              ItemDetails: row?.ItemDetails || "",
              Quantity:
                row?.Quantity !== null && row?.Quantity !== undefined
                  ? String(row.Quantity)
                  : "",
              Rate:
                row?.Rate !== null && row?.Rate !== undefined
                  ? String(row.Rate)
                  : "",
              Discount:
                row?.Discount !== null && row?.Discount !== undefined
                  ? String(row.Discount)
                  : "",
              Tax: row?.Tax || "",
              Amount:
                row?.Amount !== null && row?.Amount !== undefined
                  ? String(row.Amount)
                  : "",
            }),
          ),
        );
        setDeletedItemDetailIds([]);
      } else if (
        props?.selectedCRMBillingsRowData?.ID &&
        !props?.projectsFormAdd
      ) {
        loadItemDetailsByInvoiceId(props.selectedCRMBillingsRowData.ID);
      } else {
        setItemDetailsRows([createEmptyItemRow()]);
        setDeletedItemDetailIds([]);
      }
    }
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
        DummyInvoice: false,
      });
      setItemDetailsRows([createEmptyItemRow()]);
      setDeletedItemDetailIds([]);
    }
  }, []);
  return (
    <>
      {loader ? (
        <Loading />
      ) : (
        <div
          style={{
            margin: "0px",
            height: "auto",
            maxHeight: "80vh",
            overflow: "auto",
          }}
          className={styles.viewFormMain}
        >
          <div className={styles.viewFormNavBar}>
            <h2>
              {props?.isAdd
                ? "Add invoice"
                : props?.isEdit
                  ? "Edit invoice"
                  : "View invoice"}
            </h2>
            {props?.isEdit || props?.isView ? (
              <span>{`(${props?.ProjectsFormData?.ProjectName} - ${props?.ProjectsFormData?.CustomerDisplayName})`}</span>
            ) : (
              ""
            )}
            {props?.selectedCRMBillingsRowData?.InvoiceID ? (
              <span>
                Invoice no : {props?.selectedCRMBillingsRowData?.InvoiceID}
              </span>
            ) : (
              ""
            )}
          </div>
          <div
            style={{
              height: "auto",
              maxHeight: "62vh",
              overflow: "auto",
              display: "block",
            }}
            className={projectFormStyles.formPage}
          >
            <div className={projectFormStyles.fieldWraps}>
              {props?.BillingModel == "Milestone" && (
                <>
                  <div
                    style={{ width: "22%" }}
                    className={`${projectFormStyles.allField} dealFormPage`}
                  >
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
                  <div
                    style={{ width: "22%" }}
                    className={`${projectFormStyles.allField} dealFormPage`}
                  >
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
                  <div
                    style={{ width: "22%" }}
                    className={`${projectFormStyles.allField} dealFormPage`}
                  >
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
                  <div
                    style={{ width: "22%" }}
                    className={`${projectFormStyles.allField} dealFormPage`}
                  >
                    <Label>Amount</Label>
                    <InputText
                      value={itemDetailsAmountDisplay}
                      placeholder="Amount from Item Details"
                      disabled
                    />
                  </div>
                </>
              )}
              {props?.BillingModel == "FixedMonthly" && (
                <>
                  <div
                    style={{ width: "22%" }}
                    className={`${projectFormStyles.allField} dealFormPage`}
                  >
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
                  <div
                    style={{ width: "22%" }}
                    className={`${projectFormStyles.allField} dealFormPage`}
                  >
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
                  <div
                    style={{ width: "22%" }}
                    className={`${projectFormStyles.allField} dealFormPage`}
                  >
                    <Label>Monthly amount</Label>
                    <InputText
                      value={itemDetailsAmountDisplay}
                      placeholder="Amount from Item Details"
                      disabled
                    />
                  </div>
                </>
              )}
              {props?.BillingModel == "T&M" && (
                <div
                  style={{ width: "22%" }}
                  className={`${projectFormStyles.allField} dealFormPage`}
                >
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
                  <div
                    style={{ width: "22%" }}
                    className={`${projectFormStyles.allField} dealFormPage`}
                  >
                    <Label>Billing frequency</Label>
                    <Dropdown
                      value={initialCRMBillingsListDropContainer?.BillingFrequency.find(
                        (item: any) => item.name === formData?.BillingFrequency,
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
                  <div
                    style={{ width: "22%" }}
                    className={`${projectFormStyles.allField} dealFormPage`}
                  >
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
                  <div
                    style={{ width: "22%" }}
                    className={`${projectFormStyles.allField} dealFormPage`}
                  >
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
                  <div
                    style={{ width: "22%" }}
                    className={`${projectFormStyles.allField} dealFormPage`}
                  >
                    <Label>Amount</Label>
                    <InputText
                      value={itemDetailsAmountDisplay}
                      placeholder="Amount from Item Details"
                      disabled
                    />
                  </div>
                </>
              )}
              <div
                style={{ width: "22%" }}
                className={`${projectFormStyles.allField} dealFormPage`}
              >
                <Label>Currency</Label>
                <Dropdown
                  value={initialCRMBillingsListDropContainer?.Currency.find(
                    (item) => item.name === formData?.Currency,
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
              {props?.ProjectsFormData?.UpWork == true && (
                <div
                  style={{ width: "22%" }}
                  className={`${projectFormStyles.allField} dealFormPage`}
                >
                  <Label>Status</Label>
                  <Dropdown
                    value={initialCRMBillingsListDropContainer?.Status.find(
                      (item) =>
                        item.name ===
                        (Config.statusLabelMap[formData?.Status] ||
                          formData?.Status),
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
                  />
                </div>
              )}
              <div
                style={{ width: "22%" }}
                className={`${projectFormStyles.allField} dealFormPage`}
              >
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
              <div
                style={{ width: "22%" }}
                className={`${projectFormStyles.allField} dealFormPage`}
              >
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
              <div
                style={{ width: "22%" }}
                className={`${projectFormStyles.allField} dealFormPage`}
              >
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
              <div
                style={{ width: "22%" }}
                className={`${projectFormStyles.allField} dealFormPage`}
              >
                <Label>Dummy invoice</Label>
                <Checkbox
                  inputId="dummyInvoice"
                  checked={formData?.DummyInvoice === true}
                  onChange={(e) => handleOnChange("DummyInvoice", e.checked)}
                  disabled={props?.isView}
                />
              </div>
            </div>
            <CRMItemDetails
              rows={itemDetailsRows}
              onChange={handleItemDetailsChange}
              isView={props?.isView}
              billingModel={props?.BillingModel}
              Notify={props?.Notify}
              fieldErrors={itemDetailsFieldErrors}
            />
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
