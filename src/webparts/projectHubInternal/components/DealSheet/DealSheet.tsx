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
import { useState, useEffect, useRef } from "react";
import styles from "./DealSheet.module.scss";
import projectStyles from "../Projects/Projects.module.scss";
import commonStyles from "../CommonStyles/CommonStyle.module.scss";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import SPServices from "../../../../External/CommonServices/SPServices";
import { Config } from "../../../../External/CommonServices/Config";
import { InputText } from "primereact/inputtext";
import { DatePicker, Label } from "@fluentui/react";
import Configuration from "./ConfigurationFieldsFolder/Configuration";

let tempIdCounter = -1;

const DealSheet = (props: any) => {
  const editingLockRef = useRef<number | null>(null);
  const [dealSheetData, setDealSheetData] = useState<any[]>([]);
  const [salaryRoleData, setSalaryRoleData] = useState<any[]>([]);
  const [monthColumns, setMonthColumns] = useState<string[]>([]);
  const [newRows, setNewRows] = useState<Record<number, any>>({});
  const [USD, setUSD] = useState<number>(0);
  console.log(USD, "USD in deal sheet");
  const [conversionRates, setConversionRates] = useState<
    Record<number, number | null>
  >({});
  const [editingRows, setEditingRows] = useState<Record<number, any>>({});
  const [editDraftRows, setEditDraftRows] = useState<Record<number, any>>({});
  const [usdRupees, setUsdRupees] = useState<number>(0);

  //Get project configuration data:
  const getConfigurationData = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.DealSheetConfigurationList,
      Select: "*,Project/Id",
      Expand: "Project",
      Filter: [
        {
          FilterKey: "ProjectId",
          Operator: "eq",
          FilterValue: `${props?.data?.ID}`,
        },
      ],
    })
      .then((res: any) => {
        if (res && res.length > 0) {
          setUsdRupees(Number(res[0]?.USDRupees) || 0);
        }
      })
      .catch((err: any) => {
        console.error("Error fetching configuration:", err);
      });
  };

  //Fetch SalaryRangeRoleWise:
  const getDatasFromSalaryRangeRoleWise = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.SalaryRangeRoleWise,
      Select: "*",
    })
      .then((res: any) => {
        const roles: any[] = [];
        res?.forEach((item: any) => {
          roles.push({
            Role: item?.Role || "",
            AverageSalary: item?.AverageSalary || 0,
          });
        });
        setSalaryRoleData([...roles]);
        getConfigurationData();
      })
      .catch((err: any) => {
        console.error("Error fetching SalaryRangeRoleWise:", err);
      });
  };

  //Fetch DealSheet Data:
  const getDealSheetDatas = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.DealSheetDirectCost,
      Select: "*,Project/Id",
      Expand: "Project",
      Orderby: "Modified",
      Orderbydecorasc: true,
      Filter: [
        {
          FilterKey: "ProjectId",
          Operator: "eq",
          FilterValue: `${props?.data?.ID}`,
        },
      ],
    })
      .then((res: any) => {
        const rows: any[] = [];
        res?.forEach((item: any) => {
          let parsedJson: any[] = [];
          try {
            parsedJson = item?.AllocationJson
              ? JSON.parse(item.AllocationJson)
              : [];
          } catch {
            parsedJson = [];
          }
          rows.push({
            ID: item?.ID,
            Role: item?.Role || "",
            MonthlySalaryINR: item?.MonthlySalaryINR || 0,
            MonthlySalaryUSD: item?.MonthlySalaryUSD || 0,
            AllocationJson: parsedJson,
            Allocation: item?.Allocation || 0,
            Cost: item?.Cost || 0,
          });
        });
        setDealSheetData([...rows]);
        getDatasFromSalaryRangeRoleWise();
      })
      .catch((err: any) => {
        console.error("Error fetching DealSheetDirectCost:", err);
      });
  };

  //Generate month labels:
  const generateMonths = (startDate: string, endDate: string): string[] => {
    const months: string[] = [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const extendedEnd = new Date(end.getFullYear(), end.getMonth() + 1, 1);

    while (current <= extendedEnd) {
      months.push(
        `${current.toLocaleString("default", { month: "short" })}-${current.getFullYear()}`,
      );
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  };

  //Unified row updater:
  const updateRow = (
    id: number,
    isNewRow: boolean,
    updater: (prev: any) => any,
  ) => {
    if (isNewRow) {
      setNewRows((prev) => {
        const updatedRow = updater(prev[id]);
        return { ...prev, [id]: updatedRow };
      });
    } else {
      setEditDraftRows((prev) => {
        const updatedRow = updater(prev[id]);
        return { ...prev, [id]: updatedRow };
      });
    }
  };

  //Add:
  const handleAddClick = () => {
    if (isAnyRowEditing()) {
      props?.Notify?.(
        "warn",
        "Warning",
        "Please save or cancel the current row before adding a new one.",
      );
      return;
    }
    const tempId = tempIdCounter--;
    const blankRow = {
      ID: tempId,
      isNewRow: true,
      isEditing: false,
      Role: "",
      MonthlySalaryINR: 0,
      MonthlySalaryUSD: 0,
      AllocationJson: monthColumns.map((m) => ({ month: m, value: 0 })),
      Allocation: 0,
      Cost: 0,
    };
    setDealSheetData((prev) => [blankRow, ...prev]);
    setNewRows((prev) => ({ ...prev, [tempId]: { ...blankRow } }));
    setConversionRates((prev) => ({ ...prev, [tempId]: null }));
  };

  //Edit:
  const handleEditClick = (rowData: any) => {
    if (isAnyRowEditing()) {
      props?.Notify?.(
        "warn",
        "Warning",
        "Please save or cancel the current row before adding a new one.",
      );
      return;
    }
    if (
      editingLockRef.current !== null &&
      editingLockRef.current !== rowData.ID
    ) {
      props?.Notify?.(
        "warn",
        "Warning",
        "Please save or cancel the current row before editing another one.",
      );
      return;
    }

    // Set lock immediately
    editingLockRef.current = rowData.ID;

    const snapshot = { ...rowData };
    setEditingRows((prev) => ({ ...prev, [rowData.ID]: snapshot }));
    setEditDraftRows((prev) => ({ ...prev, [rowData.ID]: { ...snapshot } }));
    setConversionRates((prev) => ({ ...prev, [rowData.ID]: null }));
    setDealSheetData((prev) =>
      prev.map((r) => (r.ID === rowData.ID ? { ...r, isEditing: true } : r)),
    );
  };

  //Cancel:
  const handleCancel = (rowData: any) => {
    editingLockRef.current = null;
    const id = rowData.ID;
    if (rowData.isNewRow) {
      setDealSheetData((prev) => prev.filter((r) => r.ID !== id));
      setNewRows((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      setDealSheetData((prev) =>
        prev.map((r) =>
          r.ID === id
            ? { ...editingRows[id], isEditing: false, isNewRow: false }
            : r,
        ),
      );
      setEditingRows((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setEditDraftRows((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }

    setConversionRates((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  //Role change:
  const handleRoleChange = (
    id: number,
    isNewRow: boolean,
    selectedRole: string,
  ) => {
    const matched = salaryRoleData.find((r: any) => r.Role === selectedRole);
    const avgSalaryINR = matched ? matched.AverageSalary : 0;

    const newUSD = usdRupees > 0 ? avgSalaryINR / usdRupees : 0;

    updateRow(id, isNewRow, (prev) => ({
      ...prev,
      Role: selectedRole,
      MonthlySalaryINR: avgSalaryINR,
      MonthlySalaryUSD: newUSD,
      Cost: prev.Allocation * newUSD,
    }));
  };

  //Month value change:
  const handleMonthValueChange = (
    id: number,
    isNewRow: boolean,
    month: string,
    value: number | null,
  ) => {
    updateRow(id, isNewRow, (prev) => {
      const updatedJson = prev.AllocationJson.map((m: any) =>
        m.month === month ? { ...m, value: value ?? 0 } : m,
      );
      const newAllocation = updatedJson.reduce(
        (sum: number, m: any) => sum + (m.value || 0),
        0,
      );
      return {
        ...prev,
        AllocationJson: updatedJson,
        Allocation: newAllocation,
        Cost: newAllocation * prev.MonthlySalaryUSD,
      };
    });
  };

  //Unified Save (Add + Update):
  const handleSave = (rowData: any) => {
    const rateToUse = usdRupees > 0 ? usdRupees : USD;
    if (!rateToUse || rateToUse <= 0) {
      props?.Notify?.(
        "warn",
        "Warning",
        "Please enter 'USD to Rupees' value in Configuration before saving this row.",
      );
      return;
    }

    editingLockRef.current = null;
    const isNewRow = rowData.isNewRow;
    const id = rowData.ID;
    const row = isNewRow ? newRows[id] : editDraftRows[id];
    const allocationJson = monthColumns.map((m) => {
      const found = row.AllocationJson?.find((a: any) => a.month === m);
      return { month: m, value: found ? found.value : 0 };
    });
    const allocation = allocationJson.reduce(
      (sum: number, m: any) => sum + m.value,
      0,
    );
    const cost = allocation * row.MonthlySalaryUSD;
    const json = {
      Role: row.Role,
      MonthlySalaryINR: row.MonthlySalaryINR,
      MonthlySalaryUSD: row.MonthlySalaryUSD,
      AllocationJson: JSON.stringify(allocationJson),
      Allocation: allocation,
      Cost: cost,
      ProjectId: props?.data?.ID,
    };

    const finalRow = {
      ID: id,
      isNewRow: false,
      isEditing: false,
      Role: row.Role,
      MonthlySalaryINR: row.MonthlySalaryINR,
      MonthlySalaryUSD: row.MonthlySalaryUSD,
      AllocationJson: allocationJson,
      Allocation: allocation,
      Cost: cost,
    };

    if (isNewRow) {
      SPServices.SPAddItem({
        Listname: Config.ListNames.DealSheetDirectCost,
        RequestJSON: json,
      })
        .then((res: any) => {
          const savedID = res?.data?.ID;
          setDealSheetData((prev) =>
            prev.map((r) => (r.ID === id ? { ...finalRow, ID: savedID } : r)),
          );
          setNewRows((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          setConversionRates((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          props?.Notify?.("success", "Success", "Row added successfully.");
        })
        .catch((err: any) => {
          console.error("SPAddItem error:", err);
          props?.Notify?.("error", "Error", "Failed to add row.");
        });
    } else {
      SPServices.SPUpdateItem({
        Listname: Config.ListNames.DealSheetDirectCost,
        RequestJSON: json,
        ID: id,
      })
        .then(() => {
          setDealSheetData((prev) =>
            prev.map((r) => (r.ID === id ? { ...finalRow } : r)),
          );
          setEditingRows((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          setEditDraftRows((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          setConversionRates((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          props?.Notify?.("success", "Success", "Row updated successfully.");
        })
        .catch((err: any) => {
          console.error("SPUpdateItem error:", err);
          props?.Notify?.("error", "Error", "Failed to update row.");
        });
    }
  };

  //Is any row in edit mode:
  const isAnyRowEditing = () => {
    return dealSheetData.some((row) => row.isNewRow || row.isEditing);
  };

  //Effects:
  useEffect(() => {
    getDealSheetDatas();
  }, []);

  useEffect(() => {
    if (props?.data?.StartDate && props?.data?.PlannedEndDate) {
      setMonthColumns(
        generateMonths(props.data.StartDate, props.data.PlannedEndDate),
      );
    }
  }, [props?.data]);

  useEffect(() => {
    setDealSheetData((prev) =>
      prev.map((row) => {
        if (row.isNewRow && newRows[row.ID]) {
          return {
            ...row,
            ...newRows[row.ID],
            isNewRow: true,
            isEditing: false,
          };
        }
        if (row.isEditing && editDraftRows[row.ID]) {
          return {
            ...row,
            ...editDraftRows[row.ID],
            isNewRow: false,
            isEditing: true,
          };
        }
        return row;
      }),
    );
  }, [newRows, editDraftRows]);

  useEffect(() => {
    const rateToUse = usdRupees > 0 ? usdRupees : USD;

    if (rateToUse > 0) {
      setDealSheetData((prev) =>
        prev.map((row) => {
          const newUSD =
            rateToUse > 0 ? Number(row.MonthlySalaryINR || 0) / rateToUse : 0;

          return {
            ...row,
            MonthlySalaryUSD: newUSD,
            Cost: (row.Allocation || 0) * newUSD,
          };
        }),
      );
    }
  }, [usdRupees, USD]);

  //Helpers:
  const isRowEditable = (rowData: any) => rowData.isNewRow || rowData.isEditing;

  // Column bodies read from newRows or editDraftRows (live values), never editingRows:
  const getRowState = (rowData: any) =>
    rowData.isNewRow ? newRows[rowData.ID] : editDraftRows[rowData.ID];
  const roleBody = (rowData: any) => {
    if (!isRowEditable(rowData)) return <span>{rowData.Role || "-"}</span>;
    const row = getRowState(rowData);
    return (
      <Dropdown
        value={row?.Role}
        options={salaryRoleData.map((r: any) => ({
          label: r.Role,
          value: r.Role,
        }))}
        onChange={(e) =>
          handleRoleChange(rowData.ID, rowData.isNewRow, e.value)
        }
        placeholder="Select role"
        className={styles.cellDropdown}
      />
    );
  };

  const salaryINRBody = (rowData: any) => {
    const val = isRowEditable(rowData)
      ? getRowState(rowData)?.MonthlySalaryINR
      : rowData.MonthlySalaryINR;
    return <span>₹ {Number(val || 0).toLocaleString("en-IN")}</span>;
  };

  const salaryUSDBody = (rowData: any) => {
    const inr = isRowEditable(rowData)
      ? getRowState(rowData)?.MonthlySalaryINR
      : rowData.MonthlySalaryINR;

    const rateToUse = usdRupees > 0 ? usdRupees : USD;
    const usdValue = rateToUse > 0 ? Number(inr || 0) / rateToUse : 0;

    return <span>$ {usdValue.toFixed(2)}</span>;
  };

  const monthBody = (month: string) => (rowData: any) => {
    if (!isRowEditable(rowData)) {
      const alloc = rowData.AllocationJson?.find((a: any) => a.month === month);
      return <span>{alloc ? alloc.value : 0}</span>;
    }
    const row = getRowState(rowData);
    const alloc = row?.AllocationJson?.find((a: any) => a.month === month);
    return (
      <InputNumber
        value={alloc ? alloc.value : 0}
        onValueChange={(e) =>
          handleMonthValueChange(
            rowData.ID,
            rowData.isNewRow,
            month,
            e.value ?? null,
          )
        }
        className={styles.cellInput}
        inputClassName={styles.cellInputField}
        min={0}
        minFractionDigits={0}
        maxFractionDigits={2}
      />
    );
  };

  const allocationBody = (rowData: any) => {
    if (!isRowEditable(rowData)) return <span>{rowData.Allocation || 0}</span>;
    const row = getRowState(rowData);
    return (
      <InputNumber
        value={row?.Allocation || 0}
        disabled
        className={styles.cellInput}
        inputClassName={`${styles.cellInputField} ${styles.disabledInput}`}
        minFractionDigits={0}
        maxFractionDigits={2}
      />
    );
  };

  const costBody = (rowData: any) => {
    const val = isRowEditable(rowData)
      ? getRowState(rowData)?.Cost
      : rowData.Cost;
    return <span>{Number(val || 0).toFixed(2)}</span>;
  };

  const actionBody = (rowData: any) => {
    if (isRowEditable(rowData)) {
      return (
        <div className={styles.actionBtns}>
          <Button
            icon="pi pi-check"
            className="p-button-text p-button-sm p-button-success"
            title="Save"
            onClick={() => handleSave(rowData)}
          />
          <img
            src={require("../../../../External/Images/close.png")}
            onClick={() => handleCancel(rowData)}
          ></img>
        </div>
      );
    }
    return (
      <div className={styles.actionBtns}>
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-sm p-button-warning"
          title="Edit"
          onClick={() => handleEditClick(rowData)}
        />
      </div>
    );
  };

  //Configuration fields comes to Dealsheet:
  const USDRuppes = (Rupee: any) => {
    setUSD(Rupee);
  };

  //Footer Totals:
  const totalAllocation = dealSheetData.reduce(
    (sum, row) => sum + (Number(row.Allocation) || 0),
    0,
  );
  const totalCost = dealSheetData.reduce(
    (sum, row) => sum + (Number(row.Cost) || 0),
    0,
  );

  return (
    <>
      <div
        style={{ height: "70px", margin: "0" }}
        className={commonStyles.viewFormMain}
      >
        <div className={commonStyles.viewFormNavBar}>
          <div
            className={commonStyles.backButton}
            onClick={() => props?.goProjectFormPage()}
          >
            <img
              src={require("../../../../External/Images/back.png")}
              alt="no image"
            />
          </div>
          <h2>Deal sheet</h2>
          <div className={styles.headerAddBtn}>
            <Button
              label="Add direct cost"
              icon="pi pi-plus"
              className="p-button-sm"
              onClick={handleAddClick}
            />
          </div>
        </div>
      </div>
      <div className={styles.dealSheetContentWrapper}>
        <div className={`${projectStyles.allField} dealFormPage`}>
          <Label>Budget</Label>
          <InputText value={props?.data?.Budget} disabled />
        </div>
        <div className={`${projectStyles.allField} dealFormPage`}>
          <Label>Project start date</Label>
          <DatePicker
            value={
              props?.data?.StartDate
                ? new Date(props.data.StartDate)
                : undefined
            }
            disabled
          />
        </div>
        <div className={`${projectStyles.allField} dealFormPage`}>
          <Label>Project end date</Label>
          <DatePicker
            value={
              props?.data?.PlannedEndDate
                ? new Date(props.data.PlannedEndDate)
                : undefined
            }
            disabled
          />
        </div>
      </div>
      <Configuration
        USDRuppes={USDRuppes}
        goProjectFormPage={props?.goProjectFormPage}
        data={props?.data}
        totalCost={totalCost}
        totalAllocation={totalAllocation}
        spfxContext={props.spfxContext}
        Notify={props.Notify}
      />
      <div className={styles.tableWrapper}>
        <DataTable
          value={dealSheetData}
          paginator={dealSheetData && dealSheetData.length > 8}
          rows={8}
          tableStyle={{ minWidth: "50rem" }}
          emptyMessage={<p className={projectStyles.noData}>No data !!!</p>}
          scrollable
          rowClassName={(rowData: any) =>
            isRowEditable(rowData) ? styles.newRow : ""
          }
        >
          <Column
            field="Role"
            header="Role"
            body={roleBody}
            style={{ minWidth: "160px" }}
          />
          <Column
            field="MonthlySalaryINR"
            header="Monthly Salary (INR ₹)"
            body={salaryINRBody}
            style={{ minWidth: "150px" }}
          />
          <Column
            field="MonthlySalaryUSD"
            header="Monthly Salary (USD $)"
            body={salaryUSDBody}
            style={{ minWidth: "180px" }}
          />
          {monthColumns.map((month) => (
            <Column
              key={month}
              header={month}
              body={monthBody(month)}
              style={{ minWidth: "110px" }}
            />
          ))}
          <Column
            field="Allocation"
            header="Allocation %"
            body={allocationBody}
            footer={() => (
              <div style={{ fontWeight: 600, fontSize: "14px" }}>
                {totalAllocation.toFixed(2)}
              </div>
            )}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="Cost"
            header="Cost"
            body={costBody}
            footer={() => (
              <div style={{ fontWeight: 600, fontSize: "14px" }}>
                $ {totalCost.toFixed(2)}
              </div>
            )}
            style={{ minWidth: "130px" }}
          />
          <Column
            header="Actions"
            body={actionBody}
            style={{ minWidth: "90px" }}
          />
        </DataTable>
      </div>
    </>
  );
};

export default DealSheet;
