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
import {
  Config,
  RefreshButton,
} from "../../../../External/CommonServices/Config";
import {
  IBasicDropDown,
  ICRMProjectRisksListDrop,
  IPeoplePickerDetails,
  IProjectRisksDetails,
} from "../../../../External/CommonServices/interface";
import styles from "../Projects/Projects.module.scss";
import Loading from "../../../../External/Loader/Loading";
import { PrimaryButton } from "@fluentui/react";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  multiPeoplePickerTemplate,
  peoplePickerTemplate,
} from "../../../../External/CommonServices/CommonTemplate";
import * as moment from "moment";
import RiskForm from "./RiskForm";

const Risk = (props: any) => {
  //Local variables:
  const ScreenWidth: number = window.innerWidth;
  const PlusImage: string = require("../../../../External/Images/plus.png");
  const DeleteImage: string = require("../../../../External/Images/trashcan.png");
  const EditImage: string = require("../../../../External/Images/Edit.png");
  const FilterImage: string = require("../../../../External/Images/filter.png");
  const FilterNoneImage: string = require("../../../../External/Images/filternone.png");

  //Local states:
  const [ProjectRisksDetails, setProjectRisksDetails] = useState<
    IProjectRisksDetails[]
  >([]);
  const [selectedData, setSelectedData] =
    React.useState<IProjectRisksDetails | null>(null);
  const [formMode, setFormMode] = React.useState<"add" | "edit" | "view">(
    "add"
  );
  const [currentPage, setCurrentPage] = React.useState<"list" | "form">("list");
  const [masterProjectRisksDetails, setMasterProjectRisksDetails] = useState<
    IProjectRisksDetails[]
  >([]);
  const [loader, setLoader] = React.useState<boolean>(false);
  const [searchVal, setSearchVal] = React.useState<string>("");
  const [filterBar, setFilterBar] = React.useState<boolean>(false);
  const [filterValues, setFilterValues] = React.useState({
    RiskId: "",
    ProjectName: "",
    RiskOccurred: "",
    RiskTitle: "",
    CurrentStatus: "",
  });
  const [
    initialCRMProjectsRisksListDropContainer,
    setinitialCRMProjectsRisksListDropContainer,
  ] = React.useState<ICRMProjectRisksListDrop>({
    ...Config.CRMProjectRisksDropDown,
  });

  //get all choice field options for Project Risks List:
  const getAllProjectRisksDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.CRMProjectRisks,
      Select:
        "*,IdentifiedBy/Title,IdentifiedBy/ID,IdentifiedBy/EMail,AssignedTo/Title,AssignedTo/ID,AssignedTo/EMail,Project/Id,Project/ProjectName",
      Expand: "IdentifiedBy,AssignedTo,Project",
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
          FilterValue: `${props?.rowDataID}`,
        },
      ],
    })
      .then((res: any) => {
        let projectRisksData: IProjectRisksDetails[] = [];
        res?.forEach((items: any) => {
          let _IdentifiedBy: IPeoplePickerDetails[] = [];
          if (items?.IdentifiedBy) {
            items?.IdentifiedBy.forEach((user: any) => {
              _IdentifiedBy.push({
                id: user?.ID,
                name: user?.Title,
                email: user?.EMail,
              });
            });
          }
          let _AssignedTo: IPeoplePickerDetails[] = [];
          if (items?.AssignedTo) {
            items?.AssignedTo.forEach((user: any) => {
              _AssignedTo.push({
                id: user?.ID,
                name: user?.Title,
                email: user?.EMail,
              });
            });
          }
          projectRisksData.push({
            ID: items?.ID,
            RiskId: items?.RiskID,
            ProjectName: items?.Project?.ProjectName || "",
            RiskTitle: items?.RiskTitle,
            RiskDescription: items?.RiskDescription,
            RiskCategory: items?.RiskCategory,
            DateIdentified: items?.DateIdentified,
            Probability: items?.Probability,
            Impact: items?.Impact,
            Severity: items?.Severity,
            MitigationPlan: items?.MitigationPlan,
            TargetResolutionDate: items?.TargetResolutionDate,
            CurrentStatus: items?.CurrentStatus,
            ResidualRisk: items?.ResidualRisk,
            Remarks: items?.Remarks,
            DateClosed: items?.DateClosed,
            RiskOccurred: items?.RiskOccurred,
            IdentifiedBy: _IdentifiedBy,
            AssignedTo: _AssignedTo,
          });
        });
        setProjectRisksDetails([...projectRisksData]);
        setMasterProjectRisksDetails([...projectRisksData]);
        getAllChoices();
      })
      .catch((err) => {
        console.log(err, "Error in getting Project Risks Details in Risk.tsx");
      });
  };

  //Get all choice field options for Project Risks List:
  const getAllChoices = () => {
    SPServices.SPGetChoices({
      Listname: Config.ListNames.CRMProjectRisks,
      FieldName: "RiskCategory",
    })
      .then((res: any) => {
        let tempRiskCategory: IBasicDropDown[] = [];
        if (res?.Choices?.length) {
          res?.Choices?.forEach((val: any) => {
            tempRiskCategory.push({
              name: val,
            });
          });
        }
        setinitialCRMProjectsRisksListDropContainer(
          (prev: ICRMProjectRisksListDrop) => ({
            ...prev,
            RiskCategory: tempRiskCategory,
          })
        );
        SPServices.SPGetChoices({
          Listname: Config.ListNames.CRMProjectRisks,
          FieldName: "Probability",
        })
          .then((res: any) => {
            let tempProbability: IBasicDropDown[] = [];
            if (res?.Choices?.length) {
              res?.Choices?.forEach((val: any) => {
                tempProbability.push({
                  name: val,
                });
              });
            }
            setinitialCRMProjectsRisksListDropContainer(
              (prev: ICRMProjectRisksListDrop) => ({
                ...prev,
                Probability: tempProbability,
              })
            );
            SPServices.SPGetChoices({
              Listname: Config.ListNames.CRMProjectRisks,
              FieldName: "Impact",
            })
              .then((res: any) => {
                let tempImpact: IBasicDropDown[] = [];
                if (res?.Choices?.length) {
                  res?.Choices?.forEach((val: any) => {
                    tempImpact.push({
                      name: val,
                    });
                  });
                }
                setinitialCRMProjectsRisksListDropContainer(
                  (prev: ICRMProjectRisksListDrop) => ({
                    ...prev,
                    Impact: tempImpact,
                  })
                );
                SPServices.SPGetChoices({
                  Listname: Config.ListNames.CRMProjectRisks,
                  FieldName: "CurrentStatus",
                })
                  .then((res: any) => {
                    let tempCurrentStatus: IBasicDropDown[] = [];
                    if (res?.Choices?.length) {
                      res?.Choices?.forEach((val: any) => {
                        tempCurrentStatus.push({
                          name: val,
                        });
                      });
                    }
                    setinitialCRMProjectsRisksListDropContainer(
                      (prev: ICRMProjectRisksListDrop) => ({
                        ...prev,
                        CurrentStatus: tempCurrentStatus,
                      })
                    );

                    SPServices.SPGetChoices({
                      Listname: Config.ListNames.CRMProjectRisks,
                      FieldName: "ResidualRisk",
                    })
                      .then((res: any) => {
                        let tempResidualRisk: IBasicDropDown[] = [];
                        if (res?.Choices?.length) {
                          res?.Choices?.forEach((val: any) => {
                            tempResidualRisk.push({
                              name: val,
                            });
                          });
                        }
                        setinitialCRMProjectsRisksListDropContainer(
                          (prev: ICRMProjectRisksListDrop) => ({
                            ...prev,
                            ResidualRisk: tempResidualRisk,
                          })
                        );

                        SPServices.SPGetChoices({
                          Listname: Config.ListNames.CRMProjectRisks,
                          FieldName: "RiskOccurred",
                        })
                          .then((res: any) => {
                            let tempRiskOccurred: IBasicDropDown[] = [];
                            if (res?.Choices?.length) {
                              res?.Choices?.forEach((val: any) => {
                                tempRiskOccurred.push({
                                  name: val,
                                });
                              });
                            }
                            setinitialCRMProjectsRisksListDropContainer(
                              (prev: ICRMProjectRisksListDrop) => ({
                                ...prev,
                                RiskOccurred: tempRiskOccurred,
                              })
                            );
                            setLoader(false);
                          })
                          .catch((err) => {
                            console.log(
                              err,
                              "Error in getting choice fields options in Risk.tsx"
                            );
                          });
                      })
                      .catch((err) => {
                        console.log(
                          err,
                          "Error in getting choice fields options in Risk.tsx"
                        );
                      });
                  })
                  .catch((err) => {
                    console.log(
                      err,
                      "Error in getting choice fields options in Risk.tsx"
                    );
                  });
              })
              .catch((err) => {
                console.log(
                  err,
                  "Error in getting choice fields options in Risk.tsx"
                );
              });
          })
          .catch((err) => {
            console.log(
              err,
              "Error in getting choice fields options in Risk.tsx"
            );
          });
      })
      .catch((err) => {
        console.log(err, "Error in getting choice fields options in Risk.tsx");
      });
  };

  //Global Search functionalities:
  const searchProjecRiskstDetails = (val: string) => {
    setSearchVal(val);
    if (!val) {
      applyFilters();
      return;
    }

    const filtered = masterProjectRisksDetails.filter((item) => {
      const assignedToNames =
        item?.AssignedTo?.map((pm) => pm.name?.toLowerCase()).join(" ") || "";
      const IdentifiedByNames =
        item?.IdentifiedBy?.map((dh) => dh.name?.toLowerCase()).join(" ") || "";
      return (
        item.RiskId?.toLowerCase().includes(val.toLowerCase()) ||
        item.RiskTitle?.toLowerCase().includes(val.toLowerCase()) ||
        item.RiskCategory?.toLowerCase().includes(val.toLowerCase()) ||
        item.ProjectName?.toLowerCase().includes(val.toLowerCase()) ||
        item.CurrentStatus?.toLowerCase().includes(val.toLowerCase()) ||
        item.RiskOccurred?.toLowerCase().includes(val.toLowerCase()) ||
        assignedToNames.includes(val.toLowerCase()) ||
        IdentifiedByNames.includes(val.toLowerCase())
      );
    });
    setProjectRisksDetails(filtered);
  };

  //Apply Filters:
  const applyFilters = () => {
    const filtered = masterProjectRisksDetails.filter((item) => {
      const matchRiskID = item?.RiskId?.toLowerCase().includes(
        filterValues.RiskId.toLowerCase()
      );
      const matchProjectName = item?.ProjectName?.toLowerCase().includes(
        filterValues.ProjectName.toLowerCase()
      );
      const matchRiskTitle = item?.RiskTitle?.toLowerCase().includes(
        filterValues.RiskTitle.toLowerCase()
      );
      const matchStatus = filterValues.CurrentStatus
        ? item?.CurrentStatus === filterValues.CurrentStatus
        : true;
      const matchRiskOccurred = filterValues.RiskOccurred
        ? item?.RiskOccurred === filterValues.RiskOccurred
        : true;

      return (
        matchRiskID &&
        matchProjectName &&
        matchRiskTitle &&
        matchStatus &&
        matchRiskOccurred
      );
    });

    setProjectRisksDetails(filtered);
  };

  //Render Identified By Column:
  const renderIdentifiedByColumn = (rowData: IProjectRisksDetails) => {
    const identifiedBy: IPeoplePickerDetails[] = rowData?.IdentifiedBy || [];
    return (
      <div>
        {rowData?.IdentifiedBy?.length > 1
          ? multiPeoplePickerTemplate(identifiedBy)
          : peoplePickerTemplate(identifiedBy[0])}
      </div>
    );
  };

  //Render Assigned To Column:
  const renderAssignedToColumn = (rowData: IProjectRisksDetails) => {
    const assignedTo: IPeoplePickerDetails[] = rowData?.AssignedTo || [];
    return (
      <div>
        {rowData?.AssignedTo?.length > 1
          ? multiPeoplePickerTemplate(assignedTo)
          : peoplePickerTemplate(assignedTo[0])}
      </div>
    );
  };

  //Handle Filter change:
  const handleFilterChange = (field: string, value: string) => {
    setFilterValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  //initialize data on component load:
  useEffect(() => {
    setLoader(true);
    getAllProjectRisksDetails();
  }, []);

  //Filter changes render:
  React.useEffect(() => {
    applyFilters();
  }, [filterValues]);

  return (
    <>
      {loader ? (
        <Loading />
      ) : currentPage === "list" ? (
        <div className={styles.lcaBody}>
          <div
            className={`${styles.filterBarAndTableBorder} 
          ${ScreenWidth >= 1536 ? styles.filterBar_1536 : styles.filterBar_1396}
          `}
          >
            <div className={styles.filterBar}>
              <h2>Risks</h2>
            </div>
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
                    setFilterValues({
                      RiskId: "",
                      ProjectName: "",
                      RiskOccurred: "",
                      RiskTitle: "",
                      CurrentStatus: "",
                    });
                    setLoader(true);
                    getAllProjectRisksDetails();
                  }}
                />
              </div>
              <div className="all_search">
                <IconField iconPosition="left">
                  <InputIcon className="pi pi-search"> </InputIcon>
                  <InputText
                    value={searchVal}
                    onChange={(e) => searchProjecRiskstDetails(e.target.value)}
                    v-model="value1"
                    placeholder="Search"
                  />
                </IconField>
              </div>
              <div className={styles.btnAndText}>
                <div
                  className={styles.btnBackGround}
                  onClick={() => setFilterBar(!filterBar)}
                >
                  <img
                    src={filterBar ? FilterNoneImage : FilterImage}
                    alt="no image"
                  />
                  Filter
                </div>
              </div>

              <div className={styles.btnAndText}>
                <div
                  onClick={() => {
                    setCurrentPage("form");
                    setSelectedData(null);
                    setFormMode("add");
                  }}
                  className={styles.btnBackGround}
                >
                  <img
                    src={PlusImage}
                    alt="no image"
                    style={{ width: "15px", height: "15px" }}
                  />
                  New Risk
                </div>
              </div>
            </div>
          </div>
          {filterBar ? (
            <div className={styles.filterFields}>
              <div className={styles.filterField}>
                <label>Risk Id</label>
                <InputText
                  value={filterValues?.RiskId}
                  onChange={(e) => handleFilterChange("RiskId", e.target.value)}
                  placeholder="Enter here"
                />
              </div>
              <div className={styles.filterField}>
                <label>Project name</label>
                <InputText
                  value={filterValues?.ProjectName}
                  onChange={(e) =>
                    handleFilterChange("ProjectName", e.target.value)
                  }
                  placeholder="Enter here"
                />
              </div>
              <div className={styles.filterField}>
                <label>Risk title</label>
                <InputText
                  value={filterValues?.RiskTitle}
                  onChange={(e) =>
                    handleFilterChange("RiskTitle", e.target.value)
                  }
                  placeholder="Enter here"
                />
              </div>
              <div className={`${styles.filterField} dropdown`}>
                <label>Status</label>
                <Dropdown
                  options={
                    initialCRMProjectsRisksListDropContainer?.CurrentStatus
                  }
                  optionLabel="name"
                  placeholder="Select a status"
                  value={initialCRMProjectsRisksListDropContainer?.CurrentStatus.find(
                    (item) => item.name === filterValues?.CurrentStatus
                  )}
                  onChange={(e) =>
                    handleFilterChange("CurrentStatus", e.value?.name)
                  }
                />
              </div>
              <div className={`${styles.filterField} dropdown`}>
                <label>Risk occurred</label>
                <Dropdown
                  options={
                    initialCRMProjectsRisksListDropContainer?.RiskOccurred
                  }
                  optionLabel="name"
                  placeholder="Select a risk occurred"
                  value={initialCRMProjectsRisksListDropContainer?.RiskOccurred.find(
                    (item) => item.name === filterValues?.RiskOccurred
                  )}
                  onChange={(e) =>
                    handleFilterChange("RiskOccurred", e.value?.name)
                  }
                />
              </div>
              <div className={styles.filterField} style={{ width: "3%" }}>
                <PrimaryButton
                  styles={RefreshButton}
                  iconProps={{ iconName: "refresh" }}
                  className={styles.refresh}
                  onClick={() => {
                    setSearchVal("");
                    setFilterValues({
                      RiskId: "",
                      ProjectName: "",
                      RiskOccurred: "",
                      RiskTitle: "",
                      CurrentStatus: "",
                    });
                  }}
                />
              </div>
            </div>
          ) : (
            ""
          )}
          <div
            className={`${styles.tableData} tableData
              ${ScreenWidth >= 1536 ? "data_table_1536" : "data_table_1396"}`}
          >
            <DataTable
              value={ProjectRisksDetails}
              paginator={ProjectRisksDetails && ProjectRisksDetails?.length > 8}
              rows={8}
              emptyMessage={<p className={styles.noData}>No data !!!</p>}
              onRowClick={(e: any) => {
                setSelectedData(e.data);
                setFormMode("view");
                setCurrentPage("form");
                setLoader(true);
              }}
            >
              <Column sortable field="RiskId" header="Risk id" />
              <Column
                sortable
                field="ProjectName"
                header="Project name"
              ></Column>
              <Column sortable field="RiskTitle" header="Risk title"></Column>
              <Column
                sortable
                field="RiskCategory"
                header="Risk category"
              ></Column>
              <Column
                sortable
                field="IdentifiedBy"
                header="Identified By"
                body={renderIdentifiedByColumn}
              ></Column>
              <Column
                sortable
                field="DateIdentified"
                header="Date identified"
                body={(rowData) => {
                  return (
                    <div>
                      {rowData?.DateIdentified
                        ? moment(rowData?.DateIdentified).format("DD/MM/YYYY")
                        : ""}
                    </div>
                  );
                }}
              ></Column>
              <Column
                sortable
                field="Probability"
                header="Probability"
              ></Column>
              <Column
                sortable
                field="AssignedTo"
                header="Assigned to"
                body={renderAssignedToColumn}
              ></Column>
              <Column
                sortable
                field="CurrentStatus"
                header="Current status"
              ></Column>
              <Column
                sortable
                field="ResidualRisk"
                header="Residual risk"
              ></Column>
              <Column
                sortable
                field="RiskOccurred"
                header="Risk occurred"
              ></Column>
              <Column
                field="Action"
                header="Actions"
                body={(rowData: IProjectRisksDetails) => {
                  return (
                    <div className={styles.Actions}>
                      <>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedData(rowData);
                            setCurrentPage("form");
                            setFormMode("edit");
                            setLoader(true);
                          }}
                        >
                          <img title="Edit" src={EditImage} alt="no image" />
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <img
                            title="Delete"
                            src={DeleteImage}
                            alt="no image"
                          />
                        </div>
                      </>
                    </div>
                  );
                }}
              ></Column>
            </DataTable>
          </div>
        </div>
      ) : (
        ""
      )}

      {currentPage === "form" ? (
        <RiskForm
          loginUserEmail={props?.loginUserEmail}
          initialCRMProjectsRisksListDropContainer={
            initialCRMProjectsRisksListDropContainer
          }
          data={selectedData}
          setLoader={setLoader}
          isAdd={formMode === "add"}
          isEdit={formMode === "edit"}
          isView={formMode === "view"}
          goBack={() => setCurrentPage("list")}
          spfxContext={props.spfxContext}
          Notify={props.Notify}
          refresh={getAllProjectRisksDetails}
          setCurrentPage={setCurrentPage}
        />
      ) : (
        ""
      )}
    </>
  );
};

export default Risk;
