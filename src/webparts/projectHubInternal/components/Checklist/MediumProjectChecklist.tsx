import * as React from "react";
import { Dropdown } from "primereact/dropdown";
import {
  IMediumProjectSections,
  IChecklistItem,
  STATUS_OPTIONS,
  StatusOption,
  SECTION_WEIGHTS_MEDIUM,
  calculateSectionScore,
  calculateWeightedScore,
  getComplianceStatus,
  getMaturityLevel,
} from "./MetricsTypes";

interface IProps {
  sections: IMediumProjectSections;
  onChange: (sections: IMediumProjectSections) => void;
  isViewMode?: boolean;
}

const StatusBadge = ({ status }: { status: StatusOption }): JSX.Element => {
  const colorMap: Record<StatusOption, { bg: string; text: string }> = {
    "Not Started": { bg: "#f8d7da", text: "#721c24" },
    "In Progress": { bg: "#fff3cd", text: "#856404" },
    "Partially Compliant": { bg: "#cce5ff", text: "#004085" },
    "Fully Compliant": { bg: "#d4edda", text: "#155724" },
    "Not Applicable": { bg: "#e2e3e5", text: "#383d41" },
  };
  const colors = colorMap[status] || { bg: "#e2e3e5", text: "#383d41" };
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {status}
    </span>
  );
};

const MediumProjectChecklist = (props: IProps): JSX.Element => {
  const { sections, onChange, isViewMode } = props;

  const updateItem = (sectionKey: keyof IMediumProjectSections, index: number, newStatus: StatusOption) => {
    const updated = { ...sections };
    updated[sectionKey] = updated[sectionKey].map((item, i) =>
      i === index ? { ...item, status: newStatus } : item
    );
    onChange(updated);
  };

  const sectionConfigs: { key: keyof IMediumProjectSections; label: string; weight: number }[] = [
    { key: "initiation", label: "1. Initiation", weight: 15 },
    { key: "governance", label: "2. Governance", weight: 20 },
    { key: "financial", label: "3. Financial Governance", weight: 25 },
    { key: "quality", label: "4. Quality & Delivery", weight: 20 },
    { key: "reporting", label: "5. Reporting", weight: 10 },
    { key: "closure", label: "6. Closure", weight: 10 },
  ];

  const getScoreColor = (percent: number): string => {
    if (percent >= 85) return "#28a745";
    if (percent >= 70) return "#ffc107";
    return "#dc3545";
  };

  const totalScore = calculateWeightedScore(
    sections as unknown as Record<string, IChecklistItem[]>,
    SECTION_WEIGHTS_MEDIUM
  );
  const compliance = getComplianceStatus(totalScore);
  const maturity = getMaturityLevel(totalScore);

  // Check Critical Rule: If Financial OR Governance < 60%, flag it
  // Skip the check if the section is entirely Not Applicable
  const financialResult = calculateSectionScore(sections.financial);
  const governanceResult = calculateSectionScore(sections.governance);
  const criticalOverride =
    (!financialResult.isAllNA && financialResult.percent < 60) ||
    (!governanceResult.isAllNA && governanceResult.percent < 60);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Score Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
          borderRadius: "10px",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: `2px solid ${compliance.color}`,
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <div style={{ fontSize: "12px", color: "#6c757d", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Overall Compliance Score
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: compliance.color, lineHeight: 1 }}>
            {totalScore}%
          </div>
          <div style={{ fontSize: "13px", color: "#495057", marginTop: "4px" }}>{compliance.label}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "12px", color: "#6c757d", fontWeight: 600, textTransform: "uppercase" }}>
            Maturity Level
          </div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "#343a40", marginTop: "4px" }}>{maturity}</div>
        </div>
      </div>

      {/* Critical Override Warning */}
      {criticalOverride && (
        <div
          style={{
            background: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "13px",
            color: "#856404",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ⚠️ <strong>Critical Override:</strong> Financial or Governance section is below 60%. Overall cannot be rated "Healthy" regardless of total score.
        </div>
      )}

      {/* Sections */}
      {sectionConfigs.map((config) => {
        const items: IChecklistItem[] = sections[config.key];
        const { percent, isAllNA } = calculateSectionScore(items);
        return (
          <div key={config.key} style={{ border: "1px solid #dee2e6", borderRadius: "8px", overflow: "hidden" }}>
            <div
              style={{
                background: "#f1f3f5",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #dee2e6",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "14px", color: "#343a40" }}>{config.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "#6c757d" }}>Weight: {config.weight}%</span>
                {isAllNA ? (
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "13px",
                      color: "#6c757d",
                      background: "#e2e3e5",
                      padding: "2px 10px",
                      borderRadius: "20px",
                      border: "1px solid #adb5bd",
                    }}
                  >
                    NA
                  </span>
                ) : (
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "13px",
                      color: getScoreColor(percent),
                      background: `${getScoreColor(percent)}1a`,
                      padding: "2px 10px",
                      borderRadius: "20px",
                      border: `1px solid ${getScoreColor(percent)}`,
                    }}
                  >
                    {percent}%
                  </span>
                )}
              </div>
            </div>
            <div style={{ height: "4px", background: "#e9ecef" }}>
              {!isAllNA && (
                <div style={{ height: "100%", width: `${percent}%`, background: getScoreColor(percent), transition: "width 0.3s ease" }} />
              )}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={{ padding: "8px 16px", textAlign: "left", fontSize: "12px", color: "#6c757d", fontWeight: 600, width: "60%" }}>
                    Checklist Item
                  </th>
                  <th style={{ padding: "8px 16px", textAlign: "center", fontSize: "12px", color: "#6c757d", fontWeight: 600, width: "30%" }}>
                    Status
                  </th>
                  <th style={{ padding: "8px 16px", textAlign: "center", fontSize: "12px", color: "#6c757d", fontWeight: 600, width: "10%" }}>
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const scoreVal = item.status === "Not Applicable" ? "–" : item.status === "Not Started" ? "0" :
                    item.status === "In Progress" ? "1" : item.status === "Partially Compliant" ? "2" : "3";
                  return (
                    <tr key={idx} style={{ borderTop: "1px solid #f1f3f5", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "10px 16px", fontSize: "13px", color: "#495057" }}>{item.label}</td>
                      <td style={{ padding: "8px 16px", textAlign: "center" }}>
                        {isViewMode ? (
                          <StatusBadge status={item.status} />
                        ) : (
                          <Dropdown
                            value={item.status}
                            options={STATUS_OPTIONS}
                            onChange={(e) => updateItem(config.key, idx, e.value)}
                            style={{ width: "100%", fontSize: "12px" }}
                            itemTemplate={(option) => <StatusBadge status={option as StatusOption} />}
                            valueTemplate={(value) => <StatusBadge status={value as StatusOption} />}
                          />
                        )}
                      </td>
                      <td style={{ padding: "8px 16px", textAlign: "center", fontSize: "13px", fontWeight: 600, color: "#495057" }}>
                        {scoreVal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default MediumProjectChecklist;
