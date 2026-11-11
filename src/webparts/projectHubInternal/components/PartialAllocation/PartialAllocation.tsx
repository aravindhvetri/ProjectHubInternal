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
import SPServices from "../../../../External/CommonServices/SPServices";
import {
  Config,
  RefreshButton,
} from "../../../../External/CommonServices/Config";
import styles from "../Projects/Projects.module.scss";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { PrimaryButton } from "@fluentui/react";
import Loading from "../../../../External/Loader/Loading";

const PartialAllocation = (props: any) => {
  const ScreenWidth: number = window.innerWidth;
  const [employeePartialAllocationData, setEmployeePartialAllocationData] =
    React.useState<any[]>([]);
  const [monthColumns, setMonthColumns] = React.useState<any[]>([]);
  const [
    masterEmployeePartialAllocationData,
    setMasterEmployeePartialAllocationData,
  ] = React.useState<any[]>([]);
  const [searchVal, setSearchVal] = React.useState<string>("");
  const [loader, setLoader] = React.useState<boolean>(false);

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
          FilterValue: `${props?.Projectdata?.ProjectID}`,
        },
      ],
    })
      .then((res: any) => {
        let allocationData: any[] = [];
        res.forEach((items: any) => {
          allocationData.push({
            ID: items?.ID,
            EmployeeID: items?.EmployeeID || "",
            EmployeeName: items?.EmployeeName || "",
            ProjectID: items?.ProjectID || "",
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
          });
        });
        if (allocationData.length > 0) {
          const keys = Object.keys(allocationData[0]);

          const months = keys.filter((key) => {
            if (
              key === "ID" ||
              key === "EmployeeID" ||
              key === "EmployeeName" ||
              key === "ProjectID"
            ) {
              return false;
            }
            return allocationData.some((row: any) => (row[key] || 0) !== 0);
          });

          setMonthColumns(months);
        }

        setEmployeePartialAllocationData([...allocationData]);
        setMasterEmployeePartialAllocationData([...allocationData]);
        setLoader(false);
      })
      .catch((err) => {
        console.log(
          "Get Employee partial allocation datas err in PartialAllocation.tsx",
          err,
        );
      });
  };

  //Global search:
  const searchPartialAllocationDetails = (val: string) => {
    setSearchVal(val);
    const filtered = masterEmployeePartialAllocationData.filter((item) => {
      return (
        item.EmployeeID?.toLowerCase().includes(val.toLowerCase()) ||
        item.EmployeeName?.toLowerCase().includes(val.toLowerCase())
      );
    });
    setEmployeePartialAllocationData(filtered);
  };

  //Initial render:
  React.useEffect(() => {
    getEmployeePartialAllocationDatas();
    setLoader(true);
  }, []);
  return (
    <>
      {loader ? (
        <Loading />
      ) : (
        <div className={styles.lcaBody}>
          <div
            className={`${styles.filterBarAndTableBorder} ${ScreenWidth >= 1536 ? styles.filterBar_1536 : styles.filterBar_1396}`}
          >
            <div className={styles.filterBar}>
              <h2>Partial allocation</h2>
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              <div className={styles.filterBtns}>
                <div className={styles.btnAndText}>
                  <div
                    className={styles.btnBackGround}
                    onClick={() => {
                      props?.setActiveTab("");
                      props?.getTabContent(false);
                    }}
                  >
                    Back
                  </div>
                </div>
              </div>
              <div className="all_search">
                <IconField iconPosition="left">
                  <InputIcon className="pi pi-search"> </InputIcon>
                  <InputText
                    value={searchVal}
                    onChange={(e) =>
                      searchPartialAllocationDetails(e.target.value)
                    }
                    v-model="value1"
                    placeholder="Search"
                  />
                </IconField>
              </div>
              <div>
                <PrimaryButton
                  styles={RefreshButton}
                  style={{
                    width: "25px",
                    minWidth: "0px",
                    height: "30px",
                    minHeight: "0px",
                  }}
                  iconProps={{ iconName: "refresh" }}
                  className={styles.refresh}
                  onClick={() => {
                    setSearchVal("");
                    setLoader(true);
                    getEmployeePartialAllocationDatas();
                  }}
                />
              </div>
            </div>
          </div>

          <div
            className={`${styles.tableData}   ${ScreenWidth >= 1536 ? "data_table_1536" : "data_table_1396"}`}
          >
            <DataTable
              tableStyle={{ minWidth: "50rem" }}
              scrollable
              value={employeePartialAllocationData}
              paginator={
                employeePartialAllocationData &&
                employeePartialAllocationData?.length > 8
              }
              rows={8}
              emptyMessage={<p className={styles.noData}>No data !!!</p>}
            >
              <Column
                sortable
                field="ProjectID"
                header="Project id"
                style={{ minWidth: "120px" }}
              />
              <Column
                sortable
                field="EmployeeID"
                header="Employee id"
                style={{ minWidth: "130px" }}
              />
              <Column
                sortable
                field="EmployeeName"
                header="Employee name"
                style={{ minWidth: "146px" }}
              ></Column>
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
            </DataTable>
          </div>
        </div>
      )}
    </>
  );
};

export default PartialAllocation;
