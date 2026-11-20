/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @rushstack/no-new-null */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from "react";
import { PrimaryButton } from "@fluentui/react";
import { Dropdown } from "primereact/dropdown";
import SPServices from "../../../../External/CommonServices/SPServices";
import { Config } from "../../../../External/CommonServices/Config";
import {
  IBasicDropDown,
  ICRMItemDetailRow,
  ICRMItemDetailsSummary,
} from "../../../../External/CommonServices/interface";
import styles from "./CRMItemDetails.module.scss";

const DeleteImage: string = require("../../../../External/Images/trashcan.png");

export const createEmptyItemRow = (): ICRMItemDetailRow => ({
  ID: null,
  tempId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  ItemDetails: "",
  Quantity: "",
  Rate: "",
  Discount: "",
  Tax: "",
  Amount: "",
});

export const parseTaxPercent = (taxValue: string): number => {
  if (!taxValue) return 0;
  const match = taxValue.match(/\[(\d+(?:\.\d+)?)%\]/);
  if (match?.[1]) return parseFloat(match[1]);
  const fallback = taxValue.match(/(\d+(?:\.\d+)?)/);
  return fallback?.[1] ? parseFloat(fallback[1]) : 0;
};

/**
 * Amount = Qty × Rate (before Discount and GST)
 */
export const calcRowAmount = (quantity: string, rate: string): string => {
  const qty = parseFloat(quantity || "0");
  const rt = parseFloat(rate || "0");
  if (!quantity && !rate) return "";
  if (isNaN(qty) || isNaN(rt)) return "";
  return Math.max(0, qty * rt).toFixed(2);
};

/**
 * SubTotal = sum of Amount (before Discount and GST)
 * Discount Value = sum of Amount × Discount% / 100
 * Tax Value = sum of (Amount − Discount) × Tax% / 100
 * Total = SubTotal − Discount Value + Tax Value
 */
export const calcItemDetailsSummary = (
  rows: ICRMItemDetailRow[],
): ICRMItemDetailsSummary => {
  let subTotal = 0;
  let discountValue = 0;
  let taxValue = 0;

  rows.forEach((row) => {
    const amount =
      parseFloat(calcRowAmount(row.Quantity, row.Rate) || "0") || 0;
    const discPercent = parseFloat(row.Discount || "0") || 0;
    const rowDiscount = (amount * discPercent) / 100;
    const taxableAmount = Math.max(0, amount - rowDiscount);
    const taxPercent = parseTaxPercent(row.Tax);
    taxValue += (taxableAmount * taxPercent) / 100;
    discountValue += rowDiscount;
    subTotal += amount;
  });

  return {
    subTotal: Number(subTotal.toFixed(2)),
    discountValue: Number(discountValue.toFixed(2)),
    taxValue: Number(taxValue.toFixed(2)),
    total: Number((subTotal - discountValue + taxValue).toFixed(2)),
  };
};

/** Build CRMItemDetails payload using exact SharePoint internal names only.
 * Text columns in SharePoint — send strings. Lookup uses InvoiceMergeIDId.
 */
export const buildCRMItemDetailsPayload = (row: any, invoiceId: number) => ({
  ItemDetails: row?.ItemDetails != null ? String(row.ItemDetails) : "",
  Quantity:
    row?.Quantity !== "" && row?.Quantity != null ? String(row.Quantity) : "",
  Rate: row?.Rate !== "" && row?.Rate != null ? String(row.Rate) : "",
  Discount:
    row?.Discount !== "" && row?.Discount != null ? String(row.Discount) : "",
  Amount: row?.Amount !== "" && row?.Amount != null ? String(row.Amount) : "",
  Tax: row?.Tax != null ? String(row.Tax) : "",
  InvoiceMergeIDId: Number(invoiceId),
  IsDeleted: false,
});

/** Persist Item Details rows against a CRMBillings invoice ID */
export const saveCRMItemDetailsRows = async (
  rows: any[],
  invoiceId: number,
): Promise<void> => {
  if (!invoiceId || !rows?.length) return;

  for (const row of rows) {
    await SPServices.SPAddItem({
      Listname: Config.ListNames.CRMItemDetails,
      RequestJSON: buildCRMItemDetailsPayload(row, invoiceId),
    });
  }
};

interface ICRMItemDetailsProps {
  rows: ICRMItemDetailRow[];
  onChange: (rows: ICRMItemDetailRow[]) => void;
  isView?: boolean;
  billingModel?: string;
  Notify?: (type: string, title: string, message: string) => void;
  fieldErrors?: {
    [tempId: string]: {
      ItemDetails?: boolean;
      Quantity?: boolean;
      Rate?: boolean;
    };
  };
}

const CRMItemDetails = (props: ICRMItemDetailsProps) => {
  const [taxChoices, setTaxChoices] = React.useState<IBasicDropDown[]>([]);
  const summary = calcItemDetailsSummary(props.rows || []);

  React.useEffect(() => {
    SPServices.SPGetChoices({
      Listname: Config.ListNames.CRMItemDetails,
      FieldName: "Tax",
    })
      .then((res: any) => {
        const choices: IBasicDropDown[] = [];
        if (res?.Choices?.length) {
          res.Choices.forEach((val: string) => {
            choices.push({ name: val });
          });
        }
        setTaxChoices(choices);
      })
      .catch((err: any) => {
        console.log(err, "Get Tax choice error from CRMItemDetails list");
      });
  }, []);

  const updateRow = (
    tempId: string,
    field: keyof ICRMItemDetailRow,
    value: string,
  ) => {
    const nextRows = (props.rows || []).map((row) => {
      if (row.tempId !== tempId) return row;
      const updated = { ...row, [field]: value };
      if (field === "Quantity" || field === "Rate") {
        updated.Amount = calcRowAmount(
          field === "Quantity" ? value : updated.Quantity,
          field === "Rate" ? value : updated.Rate,
        );
      }
      return updated;
    });

    props.onChange(nextRows);
  };

  const handleAddMore = () => {
    if (props.isView) return;
    props.onChange([...(props.rows || []), createEmptyItemRow()]);
  };

  const handleDelete = (tempId: string) => {
    if (props.isView) return;
    const current = props.rows || [];
    if (current.length <= 1) {
      props.onChange([createEmptyItemRow()]);
      return;
    }
    props.onChange(current.filter((row) => row.tempId !== tempId));
  };

  return (
    <div className={styles.itemDetailsSection}>
      <h3 className={styles.sectionTitle}>Item Details</h3>
      <div className={styles.tableScroll}>
        <table className={styles.itemTable}>
          <thead>
            <tr>
              <th>S.no</th>
              <th>Item Details</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Discount in %</th>
              <th>Tax</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(props.rows || []).map((row, index) => {
              const rowErrors = props.fieldErrors?.[row.tempId];
              return (
              <tr key={row.tempId}>
                <td className={styles.snoCell}>{index + 1}.</td>
                <td className={styles.itemDetailsCell}>
                  <input
                    className={`${styles.inputField}${
                      rowErrors?.ItemDetails ? ` ${styles.inputError}` : ""
                    }`}
                    value={row.ItemDetails}
                    placeholder="Item Details"
                    disabled={props.isView}
                    onChange={(e) =>
                      updateRow(row.tempId, "ItemDetails", e.target.value)
                    }
                  />
                </td>
                <td className={styles.qtyCell}>
                  <input
                    className={`${styles.inputField}${
                      rowErrors?.Quantity ? ` ${styles.inputError}` : ""
                    }`}
                    value={row.Quantity}
                    placeholder="Quantity"
                    disabled={props.isView}
                    onChange={(e) => {
                      const onlyNumbers = e.target.value.replace(/[^\d.]/g, "");
                      updateRow(row.tempId, "Quantity", onlyNumbers);
                    }}
                  />
                </td>
                <td className={styles.rateCell}>
                  <input
                    className={`${styles.inputField}${
                      rowErrors?.Rate ? ` ${styles.inputError}` : ""
                    }`}
                    value={row.Rate}
                    placeholder="Rate"
                    disabled={props.isView}
                    onChange={(e) => {
                      const onlyNumbers = e.target.value.replace(/[^\d.]/g, "");
                      updateRow(row.tempId, "Rate", onlyNumbers);
                    }}
                  />
                </td>
                <td className={styles.discountCell}>
                  <input
                    className={styles.inputField}
                    value={row.Discount}
                    placeholder="Discount %"
                    disabled={props.isView}
                    onChange={(e) => {
                      const onlyNumbers = e.target.value.replace(/[^\d.]/g, "");
                      updateRow(row.tempId, "Discount", onlyNumbers);
                    }}
                  />
                </td>
                <td className={styles.taxCell}>
                  <div className={styles.taxDropdown}>
                    <Dropdown
                      value={
                        taxChoices.find((item) => item.name === row.Tax) || null
                      }
                      options={taxChoices}
                      optionLabel="name"
                      placeholder="Select"
                      disabled={props.isView}
                      onChange={(e) =>
                        updateRow(row.tempId, "Tax", e?.value?.name || "")
                      }
                    />
                  </div>
                </td>
                <td className={styles.amountCell}>
                  <input
                    className={styles.inputField}
                    value={row.Amount}
                    disabled
                    readOnly
                  />
                </td>
                <td className={styles.actionCell}>
                  {!props.isView && (
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(row.tempId)}
                      title="Delete row"
                    >
                      <img src={DeleteImage} alt="Delete" />
                    </button>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.footerRow}>
        <table className={styles.summaryTable}>
          <thead>
            <tr>
              <th>Sub Total</th>
              <th>Discount Value</th>
              <th>Tax Value</th>
              <th className={styles.totalHeader}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{summary.subTotal.toFixed(2)}</td>
              <td>{summary.discountValue.toFixed(2)}</td>
              <td>{summary.taxValue.toFixed(2)}</td>
              <td>{summary.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {!props.isView && (
          <PrimaryButton
            className={styles.addMoreBtn}
            text="Add more"
            onClick={handleAddMore}
          />
        )}
      </div>
    </div>
  );
};

export default CRMItemDetails;
