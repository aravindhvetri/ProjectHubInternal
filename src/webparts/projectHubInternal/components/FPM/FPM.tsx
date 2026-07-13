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
import SPServices from "../../../../External/CommonServices/SPServices";
import { Config } from "../../../../External/CommonServices/Config";
import styles from "../DealSheet/DealSheet.module.scss";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import projectStyles from "../Projects/Projects.module.scss";
import commonStyles from "../CommonStyles/CommonStyle.module.scss";
import Loading from "../../../../External/Loader/Loading";
import { PrimaryButton } from "@fluentui/react";
import projectComponentStyles from "../Projects/Projects.module.scss";
import { InputText } from "primereact/inputtext";

// Fixed conversion rates: 1 unit of currency = X USD
const CURRENCY_TO_USD_RATES: Record<string, number> = {
  USD: 1,
  INR: 0.01047,
  EURO: 1.08,
  EUR: 1.08,
  BHD: 2.65119,
  CAD: 0.72,
  AED: 0.2723,
  AUD: 0.65,
};

const normalizeCurrency = (currency: string): string => {
  const trimmed = (currency || "").trim();
  if (!trimmed) {
    return "USD";
  }

  const upper = trimmed.toUpperCase();
  const aliases: Record<string, string> = {
    USD: "USD",
    INR: "INR",
    EURO: "EURO",
    EUR: "EURO",
    BHD: "BHD",
    CAD: "CAD",
    AED: "AED",
    AUD: "AUD",
  };

  return aliases[upper] || upper;
};

const parseBudgetAmount = (value: any): number => {
  if (value == null || value === "") {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }

  const cleaned = String(value).replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const convertBudgetToUSD = (amount: number, currency: string): number => {
  const parsedAmount = parseBudgetAmount(amount);
  if (!parsedAmount) {
    return 0;
  }

  const normalizedCurrency = normalizeCurrency(currency);
  const rate = CURRENCY_TO_USD_RATES[normalizedCurrency] ?? 1;
  return Number((parsedAmount * rate).toFixed(2));
};

const FPM = (props: any) => {
  console.log("props data in FPM", props?.projectDatas);
  //State:
  const [employeePartialAllocationData, setEmployeePartialAllocationData] =
    useState<any[]>([]);
  const [internalRegistryData, setInternalRegistryData] = useState<any[]>([]);
  const [projectConfig, setProjectConfig] = useState<any>({
    usdRate: 0,
    costPerPerson: 0,
  });
  const [
    masterEmployeePartialAllocationData,
    setMasterEmployeePartialAllocationData,
  ] = useState<any[]>([]);
  const [loader, setLoader] = useState<boolean>(false);
  const [monthColumns, setMonthColumns] = React.useState<any[]>([]);
  const [dealConfigData, setDealConfigData] = useState<any>({});
  const [usdValue, setUsdValue] = useState<number>(0);
  const [usdError, setUsdError] = useState<boolean>(false);
  const [approvedBillingTotal, setApprovedBillingTotal] = useState<number>(0);

  //Get internal registry full datas:
  const getInternalRegistryDatas = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.InternalRegistry,
      Select: "*",
      Orderby: "Modified",
      Orderbydecorasc: true,
    })
      .then((res: any) => {
        setInternalRegistryData(res);
        getProjectConfiguration();
      })
      .catch((err) => {
        console.log("InternalRegistry fetch error", err);
      });
  };

  //Get USD rate:
  const getProjectConfiguration = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.ProjectConfiguration,
      Select: "*",
    })
      .then((res: any) => {
        const usdObj = res.find((item: any) => item?.Key === "USDtoRupees");
        const costObj = res.find(
          (item: any) => item?.Key === "CostPerPersonPerMonth",
        );
        setProjectConfig({
          usdRate: Number(usdObj?.Value) || 0,
          costPerPerson: Number(costObj?.Value) || 0,
        });
        getDealSheetConfiguration();
        getFPMMasterData();
        getCRMBillingsData();
      })
      .catch((err) => {
        console.log("ProjectConfiguration error", err);
      });
  };

  //Get approved CRMBillings total based on BillingModel:
  const getCRMBillingsData = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.CRMBillings,
      Select: "*,Project/Id",
      Expand: "Project",
      Orderby: "Modified",
      Orderbydecorasc: true,
      Filter: [
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
        {
          FilterKey: "ProjectId",
          Operator: "eq",
          FilterValue: `${props?.projectDatas?.ID}`,
        },
      ],
    })
      .then((res: any) => {
        const billingModel = props?.projectDatas?.BillingModel;
        const amountField =
          billingModel === "T&M"
            ? "TMAmount"
            : billingModel === "Milestone"
              ? "Amount"
              : billingModel === "FixedMonthly"
                ? "MonthlyAmount"
                : null;

        if (!amountField) {
          setApprovedBillingTotal(0);
          return;
        }

        const total = (res || []).reduce((sum: number, item: any) => {
          if (item?.Status != "1") {
            return sum;
          }
          return sum + parseBudgetAmount(item?.[amountField]);
        }, 0);

        setApprovedBillingTotal(total);
      })
      .catch((err) => {
        console.log("Get CRMBillings details error in FPM.tsx", err);
        setApprovedBillingTotal(0);
      });
  };

  //Get deal configuration data:
  const getDealSheetConfiguration = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.DealSheetConfigurationList,
      Select: "*,Project/Id",
      Expand: "Project",
      Filter: [
        {
          FilterKey: "ProjectId",
          Operator: "eq",
          FilterValue: `${props?.projectDatas?.ID}`,
        },
      ],
    })
      .then((res: any) => {
        const data = res?.[0] || {};
        setDealConfigData({
          TrainingCost: data?.TrainingCost || 0,
          TravelVisaCosts: data?.TravelVisaCosts || 0,
          BadgeCosts: data?.BadgeCosts || 0,
          HSLCosts: data?.HSLCosts || 0,
          MiscContigencyCosts: data?.MiscContigencyCosts || 0,
          IndirectMisCost: data?.IndirectMisCost || 0,
          USDRupees: data?.USDRupees || 0,
        });
        setLoader(false);
      })
      .catch((err) => {
        console.log("DealSheet config error", err);
      });
  };

  //Get FPM master data:
  const getFPMMasterData = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.FPMMaster,
      Select: "*",
      Filter: [
        {
          FilterKey: "ProjectId",
          Operator: "eq",
          FilterValue: `${props?.projectDatas?.ID}`,
        },
      ],
    })
      .then((res: any) => {
        if (res.length > 0 && res[0]?.USDRupees) {
          setUsdValue(Number(res[0].USDRupees));
        }
      })
      .catch((err) => console.log("FPMMaster fetch error", err));
  };

  //Get employee partial allocation full datas:
  const getEmployeePartialAllocationDatas = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.EmployeePartialAllocation,
      Select: "*",
      Orderby: "Modified",
      Orderbydecorasc: true,
      Filter: [
        {
          FilterKey: "ProjectID",
          Operator: "eq",
          FilterValue: `${props?.projectDatas?.ProjectID}`,
        },
      ],
    })
      .then((res: any) => {
        let allocationData: any[] = [];
        res.forEach((items: any) => {
          const monthData = {
            APR2025: (items?.April2025 || 0) * 100,
            MAY2025: (items?.Maymonth2025 || 0) * 100,
            JUN2025: (items?.June2025 || 0) * 100,
            JUL2025: (items?.July2025 || 0) * 100,
            AUG2025: (items?.August2025 || 0) * 100,
            SEP2025: (items?.September2025 || 0) * 100,
            OCT2025: (items?.Octobar2025 || 0) * 100,
            NOV2025: (items?.November2025 || 0) * 100,
            DEC2025: (items?.December2025 || 0) * 100,
            JAN2026: (items?.January2026 || 0) * 100,
            FEB2026: (items?.February2026 || 0) * 100,
            MAR2026: (items?.March2026 || 0) * 100,
            APR2026: (items?.April2026 || 0) * 100,
            MAY2026: (items?.Maymonth2026 || 0) * 100,
            JUN2026: (items?.June2026 || 0) * 100,
          };

          const hasAllocation = Object.values(monthData).some(
            (val: any) => val !== 0,
          );

          if (hasAllocation) {
            const empData = internalRegistryData.find(
              (emp: any) => emp?.EmpID == items?.EmployeeID,
            );
            allocationData.push({
              ID: items?.ID,
              EmployeeID: items?.EmployeeID || "",
              EmployeeName: items?.EmployeeName || "",
              ProjectID: items?.ProjectID || "",
              EmpMonthlyCTCINR: empData?.EmpMonthlyCTCINR || 0,
              ...monthData,
            });
          }
        });

        // if (allocationData.length > 0) {
        //   const keys = Object.keys(allocationData[0]);

        //   const months = keys.filter(
        //     (key) =>
        //       key !== "ID" &&
        //       key !== "EmployeeID" &&
        //       key !== "EmployeeName" &&
        //       key !== "ProjectID" &&
        //       key !== "EmpMonthlyCTCINR",
        //   );

        //   setMonthColumns(months);
        // }
        if (allocationData.length > 0) {
          const keys = Object.keys(allocationData[0]);

          const months = keys.filter(
            (key) =>
              key !== "ID" &&
              key !== "EmployeeID" &&
              key !== "EmployeeName" &&
              key !== "ProjectID" &&
              key !== "EmpMonthlyCTCINR",
          );

          // 🔥 only keep months where at least one row has value > 0
          const filteredMonths = months.filter((month) =>
            allocationData.some((row) => (row[month] || 0) !== 0),
          );

          setMonthColumns(filteredMonths);
        }

        setEmployeePartialAllocationData([...allocationData]);
        setMasterEmployeePartialAllocationData([...allocationData]);
      })
      .catch((err) => {
        console.log(
          "Get Employee partial allocation datas err in PartialAllocation.tsx",
          err,
        );
      });
  };

  //Get total allocation:
  const getTotalAllocation = () => {
    return employeePartialAllocationData.reduce((sum: number, row: any) => {
      const rowAllocation = monthColumns.reduce(
        (mSum: number, month: any) => mSum + (row[month] || 0),
        0,
      );
      return sum + rowAllocation;
    }, 0);
  };

  const totalAllocationFooter = () => {
    return `${(getTotalAllocation() / 100).toFixed(2)} %`;
  };

  //Get total cost Common function:
  const getTotalCost = () => {
    return employeePartialAllocationData.reduce((sum: number, row: any) => {
      const allocation = monthColumns.reduce(
        (mSum: number, month: any) => mSum + (row[month] || 0),
        0,
      );

      const inr = row?.EmpMonthlyCTCINR || 0;
      const usd = usdValue ? inr / usdValue : 0;

      const cost = (allocation / 100) * usd;

      return sum + cost;
    }, 0);
  };

  const totalCostFooter = () => {
    return getTotalCost().toFixed(2);
  };

  const totalExecutionCost =
    (dealConfigData?.TrainingCost || 0) +
    (dealConfigData?.HSLCosts || 0) +
    (dealConfigData?.MiscContigencyCosts || 0);

  //Grand TotalCost:
  const grandTotal = React.useMemo(() => {
    return getTotalCost() + (totalExecutionCost || 0);
  }, [employeePartialAllocationData, projectConfig, dealConfigData, usdValue]);

  //Get Execution Cost:
  const getExecutionCost = () => {
    const directCost = grandTotal || 0;

    const indirectCost =
      Number(projectConfig.costPerPerson) * (getTotalAllocation() / 100);

    const travel = dealConfigData?.TravelVisaCosts || 0;
    const badge = dealConfigData?.BadgeCosts || 0;
    const misc = dealConfigData?.IndirectMisCost || 0;

    return directCost + indirectCost + travel + badge + misc;
  };

  // Invoice total from approved CRMBillings only (not project Budget)
  const rawInvoices = approvedBillingTotal;
  const invoices = convertBudgetToUSD(
    rawInvoices,
    props?.projectDatas?.Currency,
  );
  const executionCost = getExecutionCost();

  //Get Net Profit:
  const netProfit = invoices - executionCost;

  //Get Gross Margin:
  const grossMargin =
    invoices > 0 ? ((netProfit / invoices) * 100).toFixed(2) : "0.00";

  //Save FPM Data:
  const saveFPMData = () => {
    // if (!dealConfigData?.USDRupees) {
    //   setUsdError(true);
    //   return;
    // }
    // setUsdError(false);
    if (!usdValue || usdValue === 0) {
      setUsdError(true);
      return;
    }
    setUsdError(false);

    const payload = {
      FPMMargin: grossMargin.toString(),
      FPMProfit: netProfit.toString(),
      AsOnDate: new Date().toISOString(),
      ProjectId: props?.projectDatas?.ID,
      USDRupee: usdValue,
      Status: "Success",
      Message: "Data added successfully",
    };

    // First check existing record
    SPServices.SPReadItems({
      Listname: Config.ListNames.FPMMaster,
      Select: "*",
      Filter: [
        {
          FilterKey: "ProjectId",
          Operator: "eq",
          FilterValue: `${props?.projectDatas?.ID}`,
        },
      ],
    })
      .then((res: any) => {
        if (res.length > 0) {
          SPServices.SPUpdateItem({
            Listname: Config.ListNames.FPMMaster,
            ID: res[0].ID,
            RequestJSON: payload,
          })
            .then(() => {
              props.getFPMDataCallback();
              props.Notify("success", "Success", "FPM updated successfully");
              props.setShowFPM(false);
            })
            .catch((err) => console.log("Update error", err));
        } else {
          SPServices.SPAddItem({
            Listname: Config.ListNames.FPMMaster,
            RequestJSON: payload,
          })
            .then(() => {
              props.getFPMDataCallback();
              props.Notify("success", "Success", "FPM added successfully");
              props.setShowFPM(false);
            })
            .catch((err) => console.log("Add error", err));
        }
      })
      .catch((err) => console.log("Fetch error", err));
  };

  //Initial Render:
  useEffect(() => {
    getInternalRegistryDatas();
    setLoader(true);
  }, []);

  useEffect(() => {
    if (internalRegistryData.length > 0) {
      getEmployeePartialAllocationDatas();
    }
  }, [internalRegistryData]);

  useEffect(() => {
    if (!usdValue && dealConfigData?.USDRupees) {
      setUsdValue(dealConfigData.USDRupees);
    }
  }, [dealConfigData]);

  return (
    <>
      {loader ? (
        <Loading />
      ) : (
        <>
          <div
            style={{ height: "70px", margin: "0" }}
            className={commonStyles.viewFormMain}
          >
            <div className={commonStyles.viewFormNavBar}>
              <div
                className={commonStyles.backButton}
                onClick={() => props?.setShowFPM(false)}
              >
                <img
                  src={require("../../../../External/Images/back.png")}
                  alt="no image"
                />
              </div>
              <h2>FPM</h2>
              {usdError && (
                <span
                  style={{ color: "red", fontSize: "12px", fontWeight: "500" }}
                >
                  Please enter USD value or complete the Deal Sheet
                </span>
              )}
            </div>
          </div>
          <div className={styles.summaryContainer}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>USD Rate</div>
              <InputText
                value={usdValue?.toString()}
                onChange={(e) => setUsdValue(Number(e.target.value))}
                className={styles.summaryInput}
              />
            </div>

            {[
              {
                label: "Cost Per Person",
                value: projectConfig.costPerPerson || 0,
              },
              {
                label: "$Invoices",
                value: rawInvoices ? invoices.toFixed(2) : "0.00",
              },
              {
                label: "Indirect Cost",
                value: (
                  Number(projectConfig.costPerPerson) *
                  (getTotalAllocation() / 100)
                ).toFixed(2),
              },
              {
                label: "Total Expenses (USD $)",
                value: getExecutionCost().toFixed(2),
              },
              {
                label: "Net Profit (USD $)",
                value: netProfit.toFixed(2),
              },
              {
                label: "Gross Margin %",
                value: grossMargin,
              },
            ].map((item, index) => (
              <div key={index} className={styles.summaryCard}>
                <div className={styles.summaryLabel}>{item.label}</div>
                <div className={styles.summaryValue}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: "20px" }}>
            <DataTable
              key={usdValue}
              value={[dealConfigData]}
              tableStyle={{ width: "100%" }}
            >
              <Column
                header="Direct Cost (USD $)"
                body={() => grandTotal.toFixed(2)}
              />
              <Column
                header="Indirect Cost (USD $)"
                body={() =>
                  (
                    projectConfig.costPerPerson *
                    (getTotalAllocation() / 100)
                  ).toFixed(2)
                }
              />
              <Column field="TravelVisaCosts" header="Travel & Visa Cost" />
              <Column field="BadgeCosts" header="Badge Cost" />
              <Column field="IndirectMisCost" header="Indirect Misc Cost" />
              <Column
                header="Total Execution Cost (USD $)"
                body={() => getExecutionCost().toFixed(2)}
              />
            </DataTable>
          </div>
          <div
            style={{
              marginBottom: "20px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <DataTable
              key={usdValue}
              value={[dealConfigData]}
              tableStyle={{ width: "100%" }}
            >
              <Column field="TrainingCost" header="Training Cost" />
              <Column field="HSLCosts" header="HSL Cost" />
              <Column field="MiscContigencyCosts" header="Misc Cost" />
              <Column
                header="Salary cost estimated (USD $)"
                body={() => grandTotal.toFixed(2)}
              />
            </DataTable>
          </div>
          <div style={{ padding: "0px" }} className={styles.tableWrapper}>
            <DataTable
              key={usdValue}
              className="EmployeePartialAllocationDataTable"
              value={employeePartialAllocationData}
              paginator={
                employeePartialAllocationData &&
                employeePartialAllocationData.length > 3
              }
              rows={3}
              tableStyle={{ minWidth: "40rem" }}
              emptyMessage={<p className={projectStyles.noData}>No data !!!</p>}
              scrollable
            >
              <Column
                field="EmployeeName"
                header="Employee name"
                style={{ minWidth: "160px" }}
              />
              <Column
                field="EmpMonthlyCTCINR"
                header="Monthly Salary (INR ₹)"
                style={{ minWidth: "150px" }}
              />
              <Column
                field="MonthlySalaryUSD"
                header="Monthly Salary (USD $)"
                body={(rowData: any) => {
                  const inr = rowData?.EmpMonthlyCTCINR || 0;
                  const usd = usdValue ? inr / usdValue : 0;
                  return usd.toFixed(2);
                }}
                style={{ minWidth: "180px" }}
              />
              {monthColumns.map((month: any) => {
                const monthName = month.slice(0, 3);
                const year = month.slice(3);
                const formattedMonth =
                  monthName.charAt(0) + monthName.slice(1).toLowerCase();
                return (
                  <Column
                    key={month}
                    sortable
                    field={month}
                    header={`${formattedMonth}-${year}`}
                    style={{ minWidth: "120px" }}
                  />
                );
              })}
              <Column
                field="Allocation"
                header="Allocation %"
                body={(rowData: any) => {
                  const totalAllocation = monthColumns.reduce(
                    (sum: number, month: any) => {
                      return sum + (rowData[month] || 0);
                    },
                    0,
                  );

                  return totalAllocation.toFixed(2) / 100;
                }}
                style={{ minWidth: "120px" }}
                footer={totalAllocationFooter}
              />
              <Column
                field="Cost"
                header="Cost"
                body={(rowData: any) => {
                  const allocation = monthColumns.reduce(
                    (sum: number, month: any) => {
                      return sum + (rowData[month] || 0);
                    },
                    0,
                  );

                  const inr = rowData?.EmpMonthlyCTCINR || 0;
                  const usd = usdValue ? inr / usdValue : 0;

                  const cost = (allocation / 100) * usd;

                  return cost.toFixed(2);
                }}
                style={{ minWidth: "130px" }}
                footer={totalCostFooter}
              />
            </DataTable>
          </div>
          <div className={projectComponentStyles.buttonContainer}>
            <PrimaryButton
              className={commonStyles.updateBtn}
              iconProps={{ iconName: "Save" }}
              onClick={() => saveFPMData()}
            >
              Update
            </PrimaryButton>

            <PrimaryButton
              style={{
                backgroundColor: "#aa1f1f",
                color: "#fff",
                borderRadius: "4px",
              }}
              iconProps={{ iconName: "cancel" }}
              onClick={() => props?.setShowFPM(false)}
            >
              Cancel
            </PrimaryButton>
          </div>
        </>
      )}
    </>
  );
};

export default FPM;
