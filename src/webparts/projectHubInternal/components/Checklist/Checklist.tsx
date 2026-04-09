/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from "react";
import SPServices from "../../../../External/CommonServices/SPServices";
import { Config } from "../../../../External/CommonServices/Config";
import styles from "../Projects/Projects.module.scss";
import Loading from "../../../../External/Loader/Loading";
import MetricsDashboard from "./MetricsDashboard";
import { useEffect } from "react";

interface IProps {
  loginUserEmail: string;
  rowDataID: number;
  Projectdata: any;
  setActiveTab: any;
  getTabContent: any;
  spfxContext: any;
}

const Checklist = (props: IProps): JSX.Element => {
  const ScreenWidth: number = window.innerWidth;

  // ─── States ────────────────────────────────────────────────────────────────
  const [loader, setLoader] = React.useState<boolean>(false);
  const [monthOptions, setMonthOptions] = React.useState<
    { label: string; value: string }[]
  >([]);
  const [projectSize, setProjectSize] = React.useState<
    "Small" | "Medium" | "Large" | ""
  >("");

  // ─── Utilities ─────────────────────────────────────────────────────────────

  const getMonthOptions = (): { label: string; value: string }[] => {
    const startDate = props.Projectdata?.StartDate
      ? new Date(props.Projectdata.StartDate)
      : null;

    const endDate = props.Projectdata?.PlannedEndDate
      ? new Date(props.Projectdata.PlannedEndDate)
      : null;

    if (!startDate || isNaN(startDate.getTime())) {
      // console.log("Invalid Start Date");
      return [];
    }

    const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    const end =
      endDate && !isNaN(endDate.getTime())
        ? new Date(endDate.getFullYear(), endDate.getMonth() + 4, 1)
        : new Date(start.getFullYear(), start.getMonth() + 4, 1);

    // 🛑 Fix: ensure end is always >= start
    if (end < start) {
      // console.log("End date is before start date");
      return [];
    }

    const months: { label: string; value: string }[] = [];
    const current = new Date(start);

    while (current <= end) {
      const label =
        current.toLocaleString("default", { month: "short" }) +
        " " +
        current.getFullYear();

      months.push({ label, value: label });

      current.setMonth(current.getMonth() + 1);
    }

    // console.log("Generated months:", months); // 🔍 debug

    return months;
  };

  const getProjectSize = (): "Small" | "Medium" | "Large" => {
    const hours = props.Projectdata?.Hours ?? 0;
    if (hours >= 0 && hours <= 100) return "Small";
    if (hours > 100 && hours <= 500) return "Medium";
    return "Large";
  };

  // ─── Init ──────────────────────────────────────────────────────────────────

  const init = () => {
    setLoader(true);
    setMonthOptions(getMonthOptions());
    setProjectSize(getProjectSize());
    setLoader(false);
  };

  useEffect(() => {
    init();
  }, [props.Projectdata]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {loader ? (
        <Loading />
      ) : (
        <div className={styles.lcaBody}>
          {/* Header Bar */}
          <div
            className={`${styles.filterBarAndTableBorder} ${
              ScreenWidth >= 1536
                ? styles.filterBar_1536
                : styles.filterBar_1396
            }`}
          >
            <div
              className={styles.filterBar}
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <h2 style={{ margin: 0 }}>
                {`${props?.Projectdata?.ProjectName || "Project"} — Delivery Maturity Metrics`}
              </h2>
              {projectSize && (
                <span
                  className={styles.projectSize}
                  style={{
                    background:
                      projectSize === "Small"
                        ? "#cce5ff"
                        : projectSize === "Medium"
                          ? "#fff3cd"
                          : "#f8d7da",
                    color:
                      projectSize === "Small"
                        ? "#004085"
                        : projectSize === "Medium"
                          ? "#856404"
                          : "#721c24",
                    padding: "3px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {projectSize} Project
                </span>
              )}
            </div>

            {/* Back button */}
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
          </div>

          {/* Dashboard */}
          <div style={{ marginTop: "20px" }}>
            <MetricsDashboard
              projectData={props.Projectdata}
              projectSize={projectSize}
              monthOptions={monthOptions}
              loginUserEmail={props.loginUserEmail}
              spfxContext={props.spfxContext}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Checklist;
