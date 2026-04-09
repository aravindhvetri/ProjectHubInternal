import * as React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import SPServices from "../../../../External/CommonServices/SPServices";
import { Config } from "../../../../External/CommonServices/Config";
import Loading from "../../../../External/Loader/Loading";
import MetricsModal, { IMetricsModalData } from "./MetricsModal";
import {
  ISmallProjectSections,
  IMediumProjectSections,
  ILargeProjectSections,
  getComplianceStatus,
  getMaturityLevel,
} from "./MetricsTypes";
import styles from "../Projects/Projects.module.scss";

interface IProps {
  projectData: any;
  projectSize: "Small" | "Medium" | "Large" | "";
  monthOptions: { label: string; value: string }[];
  loginUserEmail: string;
  spfxContext: any;
}

interface IDashboardRow {
  id: number;
  month: string;
  score: number;
  status: string;
  statusColor: string;
  maturity: string;
  isSubmitted: boolean;
  rawData: any;
}

const parseSectionJson = <T,>(
  raw: string | null | undefined,
  fallback: T,
): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const MetricsDashboard = (props: IProps): JSX.Element => {
  const {
    projectData,
    projectSize,
    monthOptions,
    loginUserEmail,
    spfxContext,
  } = props;

  const [loader, setLoader] = React.useState<boolean>(false);
  const [rows, setRows] = React.useState<IDashboardRow[]>([]);
  const [modalVisible, setModalVisible] = React.useState<boolean>(false);
  const [modalViewMode, setModalViewMode] = React.useState<boolean>(false);
  const [editData, setEditData] = React.useState<IMetricsModalData | null>(
    null,
  );
  const [savingLoader, setSavingLoader] = React.useState<boolean>(false);

  const existingMonths = rows.map((r) => r.month);

  const fetchData = () => {
    setLoader(true);
    SPServices.SPReadItems({
      Listname: Config.ListNames.ProjectChecklist,
      Select: "*,Project/ProjectID",
      Expand: "Project",
      Orderby: "Modified",
      Orderbydecorasc: false,
      Filter: [
        {
          FilterKey: "Project/ProjectID",
          Operator: "eq",
          FilterValue: `${projectData?.ProjectID}`,
        },
      ],
    })
      .then((res: any[]) => {
        const mapped: IDashboardRow[] = res.map((item: any) => {
          const score = item.ProjectScore ? parseInt(item.ProjectScore, 10) : 0;
          const compliance = getComplianceStatus(score);
          return {
            id: item.ID,
            month: item.Title || "",
            score,
            status: compliance.label,
            statusColor: compliance.color,
            maturity: getMaturityLevel(score),
            isSubmitted:
              item.IsSubmitted === true || item.IsSubmitted === "True",
            rawData: item,
          };
        });
        setRows(mapped);
        setLoader(false);
      })
      .catch((err: any) => {
        console.error("MetricsDashboard fetch error", err);
        setLoader(false);
      });
  };

  React.useEffect(() => {
    if (projectData?.ProjectID) {
      fetchData();
    }
  }, [projectData]);

  const openAddModal = () => {
    setEditData(null);
    setModalViewMode(false);
    setModalVisible(true);
  };

  const buildEditData = (row: IDashboardRow): IMetricsModalData => {
    const raw = row.rawData;
    return {
      id: row.id,
      month: row.month,
      projectSize: projectSize as "Small" | "Medium" | "Large",
      score: row.score,
      isSubmitted: row.isSubmitted,
      smallSections:
        projectSize === "Small"
          ? {
              initiation: parseSectionJson<ISmallProjectSections["initiation"]>(
                raw.Small_Intiation,
                [],
              ),
              execution: parseSectionJson<ISmallProjectSections["execution"]>(
                raw.Small_Execution,
                [],
              ),
              financial: parseSectionJson<ISmallProjectSections["financial"]>(
                raw.Small_Financial,
                [],
              ),
              closure: parseSectionJson<ISmallProjectSections["closure"]>(
                raw.Small_Closure,
                [],
              ),
            }
          : undefined,
      mediumSections:
        projectSize === "Medium"
          ? {
              initiation: parseSectionJson<
                IMediumProjectSections["initiation"]
              >(raw.Medium_Initiation, []),
              governance: parseSectionJson<
                IMediumProjectSections["governance"]
              >(raw.Medium_Governance, []),
              financial: parseSectionJson<IMediumProjectSections["financial"]>(
                raw.Medium_Financial,
                [],
              ),
              quality: parseSectionJson<IMediumProjectSections["quality"]>(
                raw.Medium_Quality,
                [],
              ),
              reporting: parseSectionJson<IMediumProjectSections["reporting"]>(
                raw.Medium_Reporting,
                [],
              ),
              closure: parseSectionJson<IMediumProjectSections["closure"]>(
                raw.Medium_Closure,
                [],
              ),
            }
          : undefined,
      largeSections:
        projectSize === "Large"
          ? {
              preInitiation: parseSectionJson<
                ILargeProjectSections["preInitiation"]
              >(raw.Large_PreInitiation, []),
              initiation: parseSectionJson<ILargeProjectSections["initiation"]>(
                raw.Large_Initiation,
                [],
              ),
              executionGovernance: parseSectionJson<
                ILargeProjectSections["executionGovernance"]
              >(raw.Large_Execution, []),
              financial: parseSectionJson<ILargeProjectSections["financial"]>(
                raw.Large_Financial,
                [],
              ),
              quality: parseSectionJson<ILargeProjectSections["quality"]>(
                raw.Large_Quality,
                [],
              ),
              delivery: parseSectionJson<ILargeProjectSections["delivery"]>(
                raw.Large_Delivery,
                [],
              ),
              // reporting: parseSectionJson<ILargeProjectSections["reporting"]>(
              //   raw.Large_Reporting,
              //   [],
              // ),
              closure: parseSectionJson<ILargeProjectSections["closure"]>(
                raw.Large_Closure,
                [],
              ),
            }
          : undefined,
    };
  };
  // const buildEditData = (row: IDashboardRow): IMetricsModalData => {
  //   const raw = row.rawData;

  //   // Single parse — MetricsJson holds whichever size's sections were saved
  //   const parsed = (() => {
  //     try {
  //       return raw.MetricsJson ? JSON.parse(raw.MetricsJson) : {};
  //     } catch {
  //       return {};
  //     }
  //   })();

  //   return {
  //     id: row.id,
  //     month: row.month,
  //     projectSize: projectSize as "Small" | "Medium" | "Large",
  //     score: row.score,
  //     isSubmitted: row.isSubmitted,
  //     smallSections: projectSize === "Small" ? parsed : undefined,
  //     mediumSections: projectSize === "Medium" ? parsed : undefined,
  //     largeSections: projectSize === "Large" ? parsed : undefined,
  //   };
  // };
  const openEditModal = (row: IDashboardRow) => {
    setEditData(buildEditData(row));
    setModalViewMode(false);
    setModalVisible(true);
  };

  const openViewModal = (row: IDashboardRow) => {
    setEditData(buildEditData(row));
    setModalViewMode(true);
    setModalVisible(true);
  };

  const buildSPPayload = (
    data: IMetricsModalData,
    isSubmit: boolean,
  ): Record<string, any> => {
    const payload: Record<string, any> = {
      Title: data.month,
      ProjectScore: `${data.score}`,
      IsSubmitted: isSubmit,
    };

    if (projectSize === "Small" && data.smallSections) {
      payload.Small_Intiation = JSON.stringify(data.smallSections.initiation);
      payload.Small_Execution = JSON.stringify(data.smallSections.execution);
      payload.Small_Financial = JSON.stringify(data.smallSections.financial);
      payload.Small_Closure = JSON.stringify(data.smallSections.closure);
    }
    if (projectSize === "Medium" && data.mediumSections) {
      payload.Medium_Initiation = JSON.stringify(
        data.mediumSections.initiation,
      );
      payload.Medium_Governance = JSON.stringify(
        data.mediumSections.governance,
      );
      payload.Medium_Financial = JSON.stringify(data.mediumSections.financial);
      payload.Medium_Quality = JSON.stringify(data.mediumSections.quality);
      payload.Medium_Reporting = JSON.stringify(data.mediumSections.reporting);
      payload.Medium_Closure = JSON.stringify(data.mediumSections.closure);
    }
    if (projectSize === "Large" && data.largeSections) {
      payload.Large_PreInitiation = JSON.stringify(
        data.largeSections.preInitiation,
      );
      payload.Large_Initiation = JSON.stringify(data.largeSections.initiation);
      payload.Large_Execution = JSON.stringify(
        data.largeSections.executionGovernance,
      );
      payload.Large_Financial = JSON.stringify(data.largeSections.financial);
      payload.Large_Quality = JSON.stringify(data.largeSections.quality);
      payload.Large_Delivery = JSON.stringify(data.largeSections.delivery);
      // payload.Large_Reporting = JSON.stringify(data.largeSections.reporting);
      payload.Large_Closure = JSON.stringify(data.largeSections.closure);
    }
    return payload;
    // let sectionsPayload: Record<string, any> | undefined;

    // if (projectSize === "Small" && data.smallSections) {
    //   sectionsPayload = data.smallSections;
    // } else if (projectSize === "Medium" && data.mediumSections) {
    //   sectionsPayload = data.mediumSections;
    // } else if (projectSize === "Large" && data.largeSections) {
    //   sectionsPayload = data.largeSections;
    // }

    // return {
    //   Title: data.month,
    //   ProjectScore: `${data.score}`,
    //   IsSubmitted: isSubmit,
    //   MetricsJson: JSON.stringify(sectionsPayload ?? {}),
    // };
  };

  const persistData = (data: IMetricsModalData, isSubmit: boolean) => {
    setSavingLoader(true);
    const payload = buildSPPayload(data, isSubmit);

    const operation = data.id
      ? SPServices.SPUpdateItem({
          Listname: Config.ListNames.ProjectChecklist,
          ID: data.id,
          RequestJSON: payload,
        })
      : SPServices.SPAddItem({
          Listname: Config.ListNames.ProjectChecklist,
          RequestJSON: { ...payload, ProjectId: projectData?.ID },
        });

    operation
      .then(() => {
        setModalVisible(false);
        fetchData();
        setSavingLoader(false);
      })
      .catch((err: any) => {
        console.error("Persist error", err);
        setSavingLoader(false);
      });
  };

  // ─── Column Templates ─────────────────────────────────────────────────────

  const monthTemplate = (row: IDashboardRow) => (
    <span style={{ fontWeight: 600, color: "#343a40", fontSize: "13px" }}>
      {row.month}
    </span>
  );

  const scoreTemplate = (row: IDashboardRow) => {
    const color =
      row.score >= 85 ? "#28a745" : row.score >= 70 ? "#ffc107" : "#dc3545";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "80px",
            height: "8px",
            background: "#e9ecef",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${row.score}%`,
              background: color,
              borderRadius: "4px",
            }}
          />
        </div>
        <span
          style={{ fontWeight: 700, color, fontSize: "13px", minWidth: "36px" }}
        >
          {row.score}%
        </span>
      </div>
    );
  };

  const statusTemplate = (row: IDashboardRow) => (
    <span
      style={{
        background: `${row.statusColor}1a`,
        color: row.statusColor,
        border: `1px solid ${row.statusColor}`,
        padding: "3px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {row.status}
    </span>
  );

  const maturityTemplate = (row: IDashboardRow) => (
    <span style={{ fontSize: "12px", color: "#495057" }}>{row.maturity}</span>
  );

  const stageTemplate = (row: IDashboardRow) => (
    <span
      style={{
        background: row.isSubmitted ? "#d4edda" : "#fff3cd",
        color: row.isSubmitted ? "#155724" : "#856404",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
      }}
    >
      {row.isSubmitted ? "✓ Submitted" : "Draft"}
    </span>
  );

  const actionTemplate = (row: IDashboardRow) => (
    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
      {row.isSubmitted ? (
        <button
          title="View"
          onClick={() => openViewModal(row)}
          style={{
            background: "none",
            border: "1px solid #007bff",
            borderRadius: "6px",
            width: "32px",
            height: "32px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#007bff",
          }}
        >
          {/* Eye icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      ) : (
        <button
          title="Edit"
          onClick={() => openEditModal(row)}
          style={{
            background: "none",
            border: "1px solid #ffc107",
            borderRadius: "6px",
            width: "32px",
            height: "32px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#e0a800",
          }}
        >
          {/* Pencil icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      )}
    </div>
  );

  // ─── KPI Summary ─────────────────────────────────────────────────────────────

  const avgScore =
    rows.length > 0
      ? Math.round(rows.reduce((acc, r) => acc + r.score, 0) / rows.length)
      : 0;
  const healthyCount = rows.filter((r) => r.score >= 85).length;
  const submittedCount = rows.filter((r) => r.isSubmitted).length;
  const latestScore = rows.length > 0 ? rows[0].score : null;
  const prevScore = rows.length > 1 ? rows[1].score : null;
  const trend =
    latestScore !== null && prevScore !== null
      ? latestScore > prevScore
        ? "⬆ Improving"
        : latestScore < prevScore
          ? "⬇ Declining"
          : "→ Stable"
      : null;

  return (
    <>
      {(loader || savingLoader) && <Loading />}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* KPI Cards */}
        {/* {rows.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "14px",
            }}
          >
            {[
              {
                label: "Avg Score",
                value: `${avgScore}%`,
                color:
                  avgScore >= 85
                    ? "#28a745"
                    : avgScore >= 70
                      ? "#ffc107"
                      : "#dc3545",
                icon: "📊",
              },
              {
                label: "Latest Trend",
                value: trend || "–",
                color: trend?.includes("⬆")
                  ? "#28a745"
                  : trend?.includes("⬇")
                    ? "#dc3545"
                    : "#6c757d",
                icon: "📈",
              },
              {
                label: "Healthy Months",
                value: `${healthyCount} / ${rows.length}`,
                color: "#007bff",
                icon: "🟢",
              },
              {
                label: "Submitted",
                value: `${submittedCount} / ${rows.length}`,
                color: "#6f42c1",
                icon: "✅",
              },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  border: "1px solid #dee2e6",
                  borderTop: `3px solid ${card.color}`,
                  borderRadius: "8px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ fontSize: "20px" }}>{card.icon}</div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: card.color,
                    lineHeight: 1,
                  }}
                >
                  {card.value}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#6c757d",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {card.label}
                </div>
              </div>
            ))}
          </div>
        )} */}

        {/* Table Card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #dee2e6",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {/* Table Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid #dee2e6",
              background: "#f8f9fa",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{ fontWeight: 700, fontSize: "14px", color: "#343a40" }}
              >
                Metrics History
              </span>
              <span
                style={{
                  background: "#e9ecef",
                  color: "#495057",
                  padding: "2px 8px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {rows.length} records
              </span>
            </div>
            <div className={styles.btnAndText}>
              <div
                className={styles.btnBackGround}
                onClick={openAddModal}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  // background: "#007bff",
                  color: "#fff",
                  padding: "7px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  userSelect: "none",
                }}
              >
                <span
                  style={{ fontSize: "18px", lineHeight: 1, marginTop: "-1px" }}
                >
                  +
                </span>
                Add Metrics
              </div>
            </div>
          </div>

          {!loader && rows.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#6c757d",
              }}
            >
              <div style={{ fontSize: "42px", marginBottom: "12px" }}>📋</div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: "6px",
                }}
              >
                No Metrics Added Yet
              </div>
              <div style={{ fontSize: "13px" }}>
                Click "Add Metrics" to record the first monthly entry.
              </div>
            </div>
          ) : (
            <DataTable
              value={rows}
              paginator
              rows={10}
              // rowsPerPageOptions={[5, 10, 25]}
              emptyMessage="No records found."
              style={{ fontSize: "13px" }}
              rowHover
            >
              <Column
                field="month"
                header="Month"
                body={monthTemplate}
                style={{ minWidth: "120px" }}
              />
              <Column
                header="Score"
                body={scoreTemplate}
                style={{ minWidth: "170px" }}
              />
              <Column
                header="Status"
                body={statusTemplate}
                style={{ minWidth: "130px" }}
              />
              <Column
                header="Maturity Level"
                body={maturityTemplate}
                style={{ minWidth: "160px" }}
              />
              <Column
                header="Stage"
                body={stageTemplate}
                style={{ minWidth: "110px" }}
              />
              <Column
                header="Action"
                body={actionTemplate}
                style={{
                  minWidth: "80px",
                  textAlign: "center" as const,
                  display: "flex",
                }}
              />
            </DataTable>
          )}
        </div>
      </div>

      {/* Add / Edit / View Modal */}
      <MetricsModal
        visible={modalVisible}
        onHide={() => setModalVisible(false)}
        projectSize={projectSize}
        monthOptions={monthOptions}
        existingMonths={existingMonths}
        onSave={(data) => persistData(data, false)}
        onSubmit={(data) => persistData(data, true)}
        editData={editData}
        isViewMode={modalViewMode}
      />
    </>
  );
};

export default MetricsDashboard;
