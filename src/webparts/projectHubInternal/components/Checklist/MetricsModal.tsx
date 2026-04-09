import * as React from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import {
  ISmallProjectSections,
  IMediumProjectSections,
  ILargeProjectSections,
  DEFAULT_SMALL_SECTIONS,
  DEFAULT_MEDIUM_SECTIONS,
  DEFAULT_LARGE_SECTIONS,
  calculateWeightedScore,
  IChecklistItem,
  SECTION_WEIGHTS_SMALL,
  SECTION_WEIGHTS_MEDIUM,
  SECTION_WEIGHTS_LARGE,
} from "./MetricsTypes";
import SmallProjectChecklist from "./SmallProjectChecklist";
import MediumProjectChecklist from "./MediumProjectChecklist";
import LargeProjectChecklist from "./LargeProjectChecklist";
import styles from "../Projects/Projects.module.scss";
import { Icon } from "@fluentui/react";

interface IProps {
  visible: boolean;
  onHide: () => void;
  projectSize: "Small" | "Medium" | "Large" | "";
  monthOptions: { label: string; value: string }[];
  existingMonths: string[];
  onSave: (data: IMetricsModalData) => void;
  onSubmit: (data: IMetricsModalData) => void;
  editData?: IMetricsModalData | null;
  isViewMode?: boolean;
}

export interface IMetricsModalData {
  month: string;
  projectSize: "Small" | "Medium" | "Large";
  smallSections?: ISmallProjectSections;
  mediumSections?: IMediumProjectSections;
  largeSections?: ILargeProjectSections;
  score: number;
  isSubmitted: boolean;
  id?: number;
}

const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

const MetricsModal = (props: IProps): JSX.Element => {
  const {
    visible,
    onHide,
    projectSize,
    monthOptions,
    existingMonths,
    onSave,
    onSubmit,
    editData,
    isViewMode,
  } = props;

  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [smallSections, setSmallSections] =
    React.useState<ISmallProjectSections>(deepClone(DEFAULT_SMALL_SECTIONS));
  const [mediumSections, setMediumSections] =
    React.useState<IMediumProjectSections>(deepClone(DEFAULT_MEDIUM_SECTIONS));
  const [largeSections, setLargeSections] =
    React.useState<ILargeProjectSections>(deepClone(DEFAULT_LARGE_SECTIONS));
  const [monthError, setMonthError] = React.useState<string>("");

  const availableMonths = monthOptions.filter(
    (m) =>
      !existingMonths.includes(m.value) ||
      (editData && m.value === editData.month),
  );

  React.useEffect(() => {
    if (visible) {
      if (editData) {
        setSelectedMonth(editData.month);
        if (editData.smallSections)
          setSmallSections(deepClone(editData.smallSections));
        if (editData.mediumSections)
          setMediumSections(deepClone(editData.mediumSections));
        if (editData.largeSections)
          setLargeSections(deepClone(editData.largeSections));
      } else {
        setSelectedMonth("");
        setSmallSections(deepClone(DEFAULT_SMALL_SECTIONS));
        setMediumSections(deepClone(DEFAULT_MEDIUM_SECTIONS));
        setLargeSections(deepClone(DEFAULT_LARGE_SECTIONS));
      }
      setMonthError("");
    }
  }, [visible, editData]);

  const getCurrentScore = (): number => {
    if (projectSize === "Small") {
      return calculateWeightedScore(
        smallSections as unknown as Record<string, IChecklistItem[]>,
        SECTION_WEIGHTS_SMALL,
      );
    } else if (projectSize === "Medium") {
      return calculateWeightedScore(
        mediumSections as unknown as Record<string, IChecklistItem[]>,
        SECTION_WEIGHTS_MEDIUM,
      );
    } else if (projectSize === "Large") {
      return calculateWeightedScore(
        largeSections as unknown as Record<string, IChecklistItem[]>,
        SECTION_WEIGHTS_LARGE,
      );
    }
    return 0;
  };

  const buildModalData = (isSubmit: boolean): IMetricsModalData => {
    const score = getCurrentScore();
    const base: IMetricsModalData = {
      month: selectedMonth,
      projectSize: projectSize as "Small" | "Medium" | "Large",
      score,
      isSubmitted: isSubmit,
      id: editData?.id,
    };
    if (projectSize === "Small") base.smallSections = smallSections;
    if (projectSize === "Medium") base.mediumSections = mediumSections;
    if (projectSize === "Large") base.largeSections = largeSections;
    return base;
  };

  const validate = (): boolean => {
    if (!selectedMonth) {
      setMonthError("Please select a month.");
      return false;
    }
    setMonthError("");
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(buildModalData(false));
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(buildModalData(true));
  };

  const score = getCurrentScore();
  const getScoreColor = (s: number) =>
    s >= 85 ? "#28a745" : s >= 70 ? "#ffc107" : "#dc3545";

  const modalTitle = (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontSize: "16px", fontWeight: 700, color: "#343a40" }}>
        {isViewMode
          ? "View Metrics"
          : editData
            ? "Edit Metrics"
            : "Add Metrics"}
      </span>
      {projectSize && (
        <span
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
            padding: "2px 10px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {projectSize} Project
        </span>
      )}
      {score > 0 && (
        <span
          style={{
            background: `${getScoreColor(score)}1a`,
            color: getScoreColor(score),
            border: `1px solid ${getScoreColor(score)}`,
            padding: "2px 10px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {score}%
        </span>
      )}
    </div>
  );

  const modalFooter = !isViewMode ? (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        padding: "4px 0",
      }}
    >
      <div
        className={styles.btnBackGround}
        onClick={onHide}
        style={{
          background: "#868f98ff",
          color: "#fff",
          padding: "8px 20px",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        Cancel
      </div>
      <div
        className={styles.btnBackGround}
        onClick={handleSave}
        style={{
          background: "#0d900d",
          color: "#fff",
          padding: "8px 20px",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        Save
      </div>
      <div
        className={styles.btnBackGround}
        onClick={handleSubmit}
        style={{
          background: "#00a99d",
          color: "#fff",
          padding: "8px 20px",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        Submit
      </div>
    </div>
  ) : (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div
        className={styles.btnBackGround}
        onClick={onHide}
        style={{
          background: "#6c757d",
          color: "#fff",
          padding: "8px 20px",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        Close
      </div>
    </div>
  );

  return (
    <Dialog
      header={modalTitle}
      footer={modalFooter}
      visible={visible}
      onHide={onHide}
      style={{ width: "85vw", maxWidth: "1100px" }}
      maximizable
      draggable={false}
      resizable={false}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          paddingBottom: "8px",
        }}
      >
        {/* Month Selector */}
        {!isViewMode && !editData?.month ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              maxWidth: "260px",
            }}
          >
            <label
              style={{ fontSize: "13px", fontWeight: 600, color: "#495057" }}
            >
              Month <span style={{ color: "#dc3545" }}>*</span>
            </label>
            <Dropdown
              value={selectedMonth}
              options={availableMonths}
              onChange={(e) => {
                setSelectedMonth(e.value);
                setMonthError("");
              }}
              placeholder="Select Month"
              optionLabel="label"
              style={{ width: "100%" }}
            />
            {monthError && (
              <span style={{ fontSize: "12px", color: "#dc3545" }}>
                {monthError}
              </span>
            )}
          </div>
        ) : (
          <div style={{ fontSize: "14px", color: "#495057" }}>
            <span style={{ fontWeight: 600 }}>Month: </span>
            {selectedMonth}
          </div>
        )}

        {/* Checklist by Project Size */}
        {!projectSize && (
          <div
            style={{ textAlign: "center", color: "#6c757d", padding: "40px" }}
          >
            Project size not determined.
          </div>
        )}
        {projectSize === "Small" && (
          <SmallProjectChecklist
            sections={smallSections}
            onChange={setSmallSections}
            isViewMode={isViewMode}
          />
        )}
        {projectSize === "Medium" && (
          <MediumProjectChecklist
            sections={mediumSections}
            onChange={setMediumSections}
            isViewMode={isViewMode}
          />
        )}
        {projectSize === "Large" && (
          <LargeProjectChecklist
            sections={largeSections}
            onChange={setLargeSections}
            isViewMode={isViewMode}
          />
        )}
      </div>
    </Dialog>
  );
};

export default MetricsModal;
