import { PersonaSize } from "@fluentui/react";
import {
  DirectionalHint,
  Label,
  Persona,
  PersonaPresence,
  TooltipDelay,
  TooltipHost,
} from "office-ui-fabric-react";
import "../CSS/Style.css";
import { useState } from "react";
import { IPeoplePickerDetails } from "./interface";
import * as React from "react";
import { Config } from "./Config";
import styles from "../../webparts/reports/components/MainComponenet.module.scss";
interface FixedMonthDisplayProps {
  label: string;
  value: string;
}
interface MonthPickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  enabledKeys: string[]; // only these column keys are selectable
  minKey?: string; // lower bound (inclusive)
  maxKey?: string; // upper bound (inclusive)
}

//MultiPeoplePicker Template:
export const multiPeoplePickerTemplate = (users: IPeoplePickerDetails[]) => {
  if (!users?.length) return null;

  const uniqueUsers = users.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t?.email === item?.email),
  );

  return (
    <div
      className="user-selector-group"
      style={{
        display: "flex",
      }}
    >
      {uniqueUsers.map((value, index) => {
        if (index < 2) {
          return (
            <Persona
              key={index}
              styles={{
                root: {
                  cursor: "pointer",
                  margin: "0 !important",
                  ".ms-Persona-details": {
                    display: "none",
                  },
                },
              }}
              imageUrl={`/_layouts/15/userphoto.aspx?size=S&username=${value.email}`}
              title={value.name}
              size={PersonaSize.size24}
            />
          );
        }
        return null;
      })}

      {uniqueUsers.length > 2 && (
        <TooltipHost
          className="all-member-users"
          content={
            <ul style={{ margin: 10, padding: 0 }}>
              {uniqueUsers.map((DName: any, index) => (
                <li key={index} style={{ listStyleType: "none" }}>
                  <div style={{ display: "flex" }}>
                    <Persona
                      showOverflowTooltip
                      size={PersonaSize.size24}
                      presence={PersonaPresence.none}
                      showInitialsUntilImageLoads
                      imageUrl={`/_layouts/15/userphoto.aspx?size=S&username=${DName.email}`}
                    />
                    <Label style={{ marginLeft: 10, fontSize: 12 }}>
                      {DName.name}
                    </Label>
                  </div>
                </li>
              ))}
            </ul>
          }
          delay={TooltipDelay.zero}
          directionalHint={DirectionalHint.bottomCenter}
          styles={{ root: { display: "inline-block" } }}
        >
          <div className="persona">
            +{uniqueUsers.length - 2}
            <div className="allPersona"></div>
          </div>
        </TooltipHost>
      )}
    </div>
  );
};

//PeoplePicker Template:
export const peoplePickerTemplate = (user: IPeoplePickerDetails) => {
  return (
    <>
      {user && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <Persona
            styles={{
              root: {
                margin: "0 !important;",
                ".ms-Persona-details": {
                  display: "none",
                },
              },
            }}
            imageUrl={
              "/_layouts/15/userphoto.aspx?size=S&username=" + user?.email
            }
            title={user?.name}
            size={PersonaSize.size24}
          />
          <p
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              margin: 0,
            }}
            className="displayText"
            title={user?.name}
          >
            {user?.name}
          </p>
        </div>
      )}
    </>
  );
};

//Text Template in Multiline with tooltip:
export const textTemplate = (text: string) => {
  return (
    <div className="MultilinedisplayText" title={text}>
      {text}
    </div>
  );
};

export const FixedMonthDisplay: React.FC<FixedMonthDisplayProps> = ({
  label,
  value,
}) => {
  return (
    <div className={styles.monthPickerWrap}>
      <span className={styles.monthPickerLabel}>{label}</span>
      <div className={styles.fixedMonthDisplay}>
        <span className={styles.fixedMonthValue}>
          {Config.formatColLabel(value)}
        </span>
        <span className={styles.fixedMonthBadge}>Fixed</span>
      </div>
    </div>
  );
};

export const MonthPicker: React.FC<MonthPickerProps> = ({
  label,
  value,
  onChange,
  enabledKeys,
  minKey,
  maxKey,
}) => {
  const years = Array.from(
    new Set(enabledKeys.map((k) => parseInt(k.slice(3), 10))),
  ).sort((a, b) => a - b);

  const { month: selMonth, year: selYear } = Config.parseColumnKey(
    value || enabledKeys[0] || "JAN2025",
  );
  const [viewYear, setViewYear] = useState<number>(selYear);

  const minDate = minKey ? Config.colKeyToDate(minKey) : null;
  const maxDate = maxKey ? Config.colKeyToDate(maxKey) : null;

  const isEnabled = (monthIdx: number, year: number): boolean => {
    const key = `${Config.MONTH_KEYS[monthIdx]}${year}`;
    if (!enabledKeys.includes(key)) return false;
    const d = new Date(year, monthIdx, 1);
    if (minDate && d < minDate) return false;
    if (maxDate && d > maxDate) return false;
    return true;
  };

  const handleSelect = (monthIdx: number) => {
    if (!isEnabled(monthIdx, viewYear)) return;
    onChange(`${Config.MONTH_KEYS[monthIdx]}${viewYear}`);
  };

  return (
    <div className={styles.monthPickerWrap}>
      <span className={styles.monthPickerLabel}>{label}</span>
      <div className={styles.yearNav}>
        <button
          className={styles.yearNavBtn}
          disabled={viewYear <= years[0]}
          onClick={() => setViewYear((y) => y - 1)}
        >
          ‹
        </button>
        <span className={styles.yearText}>{viewYear}</span>
        <button
          className={styles.yearNavBtn}
          disabled={viewYear >= years[years.length - 1]}
          onClick={() => setViewYear((y) => y + 1)}
        >
          ›
        </button>
      </div>
      <div className={styles.monthGrid}>
        {Config.MONTH_ABBRS.map((m, idx) => {
          const enabled = isEnabled(idx, viewYear);
          const selected = idx === selMonth && viewYear === selYear;
          return (
            <button
              key={m}
              className={`${styles.monthCell} ${selected ? styles.monthCellSelected : ""} ${!enabled ? styles.monthCellDisabled : ""}`}
              disabled={!enabled}
              onClick={() => handleSelect(idx)}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
};
