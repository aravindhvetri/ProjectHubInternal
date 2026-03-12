import * as React from "react";
import styles from "../DealSheet.module.scss";
import projectStyles from "../../Projects/Projects.module.scss";
import { InputText } from "primereact/inputtext";
import { DatePicker, Label } from "@fluentui/react";
import { useState, useEffect } from "react";
import SPServices from "../../../../../External/CommonServices/SPServices";
import { Config } from "../../../../../External/CommonServices/Config";
import { Button } from "primereact/button";
import "../DealSheet.css";

const Configuration = (props: any) => {
  const [projectConfigurationData, setProjectConfigurationData] = useState<
    any[]
  >([]);
  const [formData, setFormData] = useState<any>({
    ID: null,
    ProjectId: props?.data?.ID,
    USDRupees: null,
    TrainingCost: null,
    TravelVisaCosts: null,
    BadgeCosts: null,
    DirectCosts: null,
    IndirectCosts: null,
    HSLCosts: null,
    MiscContigencyCosts: null,
    IndirectMisCost: null,
    TotalExecutionCost: null,
  });
  const [errors, setErrors] = useState<any>({
    USDRupees: "",
  });

  //Direct cost calculation:
  const baseCost = Number(props?.totalCost) || 0;
  const training = Number(formData.TrainingCost) || 0;
  const hardware = Number(formData.HSLCosts) || 0;
  const misc = Number(formData.MiscContigencyCosts) || 0;

  // const directCost = baseCost + training + hardware + misc;
  const directCost = Number((baseCost + training + hardware + misc).toFixed(2));

  // total Execution cost calculation:
  const costPerPerson =
    Number(
      projectConfigurationData.find(
        (item) => item.Key === "CostPerPersonPerMonth",
      )?.Value,
    ) || 0;
  const totalAllocation = Number(props?.totalAllocation) || 0;
  const indirectCost = costPerPerson * totalAllocation;
  const travel = Number(formData.TravelVisaCosts) || 0;
  const badge = Number(formData.BadgeCosts) || 0;
  const indirectMisc = Number(formData.IndirectMisCost) || 0;

  // const totalExecutionCost =
  //   directCost + indirectCost + travel + badge + indirectMisc;
  const totalExecutionCost = Number(
    (directCost + indirectCost + travel + badge + indirectMisc).toFixed(2),
  );

  //net profit and gross margin % calculation:
  const budget = Number(props?.data?.Budget) || 0;
  const netProfit = budget - totalExecutionCost;
  const grossMargin =
    budget > 0 ? ((netProfit / budget) * 100).toFixed(2) : "0.00";

  //Get project configuration data:
  const getProjectConfigurationData = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.ProjectConfiguration,
      Select: "*",
      Orderby: "Modified",
      Orderbydecorasc: true,
    })
      .then((res: any) => {
        let projectConfigData: any[] = [];
        res.forEach((items: any) => {
          projectConfigData.push({
            ID: items.ID,
            Key: items.Key,
            Value: items.Value,
            Misc: items.Misc,
          });
        });
        setProjectConfigurationData([...projectConfigData]);
      })
      .catch((err) => {
        console.log("Error while fetching project configuration data", err);
      });
  };

  //Get configuration data:
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
          const item = res[0];

          setFormData({
            ID: item.ID,
            ProjectId: item.ProjectId,
            USDRupees: item.USDRupees || 0,
            TrainingCost: item.TrainingCost || 0,
            TravelVisaCosts: item.TravelVisaCosts || 0,
            BadgeCosts: item.BadgeCosts || 0,
            DirectCosts: item.DirectCosts || 0,
            IndirectCosts: item.IndirectCosts || 0,
            HSLCosts: item.HSLCosts || 0,
            MiscContigencyCosts: item.MiscContigencyCosts || 0,
            IndirectMisCost: item.IndirectMisCost || 0,
            TotalExecutionCost: item.TotalExecutionCost || 0,
          });
        }
        getProjectConfigurationData();
      })
      .catch((err) => {
        console.log("Error fetching configuration data", err);
      });
  };

  //Handle OnChange for input fields:
  const handleOnChange = (e: any) => {
    const { name, value } = e.target;
    const numericValue = Number(value) || null;
    setFormData((prev: any) => ({
      ...prev,
      [name]: numericValue,
    }));

    //Real-time validation clear / show:
    if (name === "USDRupees") {
      if (numericValue && numericValue > 0) {
        setErrors((prev: any) => ({
          ...prev,
          USDRupees: "",
        }));
      } else {
        setErrors((prev: any) => ({
          ...prev,
          USDRupees: "USD to Rupees is required",
        }));
      }
    }

    if (name === "USDRupees" && props?.USDRuppes) {
      props.USDRuppes(numericValue);
    }
  };

  //Validations and save data:
  const validateForm = () => {
    let newErrors: any = { USDRupees: "" };
    let isValid = true;

    if (!formData.USDRupees || formData.USDRupees <= 0) {
      newErrors.USDRupees = "USD to Rupees is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  //Handle Save:
  const handleSave = () => {
    if (!validateForm()) return;

    const json = {
      ProjectId: props?.data?.ID,
      USDRupees: formData.USDRupees,
      TrainingCost: formData.TrainingCost,
      TravelVisaCosts: formData.TravelVisaCosts,
      BadgeCosts: formData.BadgeCosts,
      DirectCosts: directCost,
      IndirectCosts: indirectCost,
      HSLCosts: formData.HSLCosts,
      MiscContigencyCosts: formData.MiscContigencyCosts,
      IndirectMisCost: formData.IndirectMisCost,
      TotalExecutionCost: totalExecutionCost,
    };

    if (formData.ID) {
      SPServices.SPUpdateItem({
        Listname: Config.ListNames.DealSheetConfigurationList,
        RequestJSON: json,
        ID: formData.ID,
      })
        .then(() => {
          props.Notify(
            "success",
            "Success",
            "Configuration updated successfully",
          );
          props.goProjectFormPage();
        })
        .catch((err: any) => {
          console.log("Update error", err);
        });
    } else {
      SPServices.SPAddItem({
        Listname: Config.ListNames.DealSheetConfigurationList,
        RequestJSON: json,
      })
        .then((res: any) => {
          setFormData((prev: any) => ({
            ...prev,
            ID: res?.data?.ID,
          }));
          props.Notify(
            "success",
            "Success",
            "Configuration added successfully",
          );
          props.goProjectFormPage();
        })
        .catch((err: any) => {
          console.log("Add error", err);
        });
    }
  };

  //Handle Cancel:
  const handleCancel = () => {
    getConfigurationData();
    props.goProjectFormPage();
  };

  //Initial render:
  useEffect(() => {
    getConfigurationData();
  }, []);

  return (
    <>
      <div
        className={`${styles.dealSheetContentWrapper} dealSheetContentWrapper`}
      >
        <div className={`${projectStyles.allField}`}>
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
        <div className={`${projectStyles.allField}`}>
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
        <div className={`${styles.allField}`}>
          <Label>Cost/person/month</Label>
          <InputText
            value={
              projectConfigurationData.find(
                (item) => item.Key === "CostPerPersonPerMonth",
              )?.Value || ""
            }
            disabled
          />
        </div>
        <div className={`${projectStyles.allField}`}>
          <Label>Budget</Label>
          <InputText value={props?.data?.Budget} disabled />
        </div>
        <div className={`${styles.allField}`}>
          <Label>Direct cost</Label>
          <InputText value={directCost.toString()} disabled />
        </div>
        <div className={`${styles.allField}`}>
          <Label>Indirect cost</Label>
          <InputText
            value={(
              (Number(
                projectConfigurationData.find(
                  (item) => item.Key === "CostPerPersonPerMonth",
                )?.Value,
              ) || 0) * (Number(props?.totalAllocation) || 1)
            ).toFixed(2)}
            disabled
          />
        </div>
        <div className={`${styles.allField}`}>
          <Label>Total Execution cost</Label>
          <InputText value={totalExecutionCost.toFixed(2)} disabled />
        </div>
        <div className={`${projectStyles.allField}`}>
          <Label>Net profit</Label>
          <InputText value={"$" + netProfit.toFixed(2)} disabled />
        </div>
        <div className={`${projectStyles.allField}`}>
          <Label>Gross margin %</Label>
          <InputText value={grossMargin + "%"} disabled />
        </div>
      </div>

      <div className={styles.ConfigurationWrapper}>
        <div className={styles.ConfigBody}>
          <div className={`${styles.allField} `}>
            <Label>
              1 USD to INR{" "}
              <a
                className={styles.xeLink}
                href="https://www.xe.com"
                target="_blank"
              >
                Refer XE.com
              </a>
            </Label>
            <InputText
              name="USDRupees"
              value={formData.USDRupees}
              onChange={handleOnChange}
            />
            {errors.USDRupees && (
              <span className={styles.errorText}>{errors.USDRupees}</span>
            )}
          </div>
          <div className={`${styles.allField}`}>
            <Label>Training cost</Label>
            <InputText
              name="TrainingCost"
              value={formData.TrainingCost}
              onChange={handleOnChange}
            />
          </div>
          <div className={`${styles.allField}`}>
            <Label>Hardware costs</Label>
            <InputText
              name="HSLCosts"
              value={formData.HSLCosts}
              onChange={handleOnChange}
            />
          </div>
          <div className={`${styles.allField}`}>
            <Label>Misc/contingency costs</Label>
            <InputText
              name="MiscContigencyCosts"
              value={formData.MiscContigencyCosts}
              onChange={handleOnChange}
            />
          </div>
          <div className={`${styles.allField}`}>
            <Label>Travel visa costs</Label>
            <InputText
              name="TravelVisaCosts"
              value={formData.TravelVisaCosts}
              onChange={handleOnChange}
            />
          </div>
          <div className={`${styles.allField}`}>
            <Label>Badge costs</Label>
            <InputText
              name="BadgeCosts"
              value={formData.BadgeCosts}
              onChange={handleOnChange}
            />
          </div>
          <div className={`${styles.allField}`}>
            <Label>Indirect misc costs</Label>
            <InputText
              name="IndirectMisCost"
              value={formData.IndirectMisCost}
              onChange={handleOnChange}
            />
          </div>
          <div className={styles.buttonWrapper}>
            <Button className={styles.saveBtn} onClick={handleSave}>
              {formData.ID ? "Update" : "Save"}
            </Button>
            <Button className={styles.cancelBtn} onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Configuration;
