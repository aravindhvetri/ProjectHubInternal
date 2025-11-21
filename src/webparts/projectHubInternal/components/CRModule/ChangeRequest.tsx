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
  IChangeRequestDetails,
  ICRMProjectCRsListDrop,
  IDelModal,
  IPeoplePickerDetails,
} from "../../../../External/CommonServices/interface";
import styles from "../Projects/Projects.module.scss";
import Loading from "../../../../External/Loader/Loading";
import { Modal, PrimaryButton } from "@fluentui/react";
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
import CRForm from "./CRForm";

const ChangeRequest = (props: any) => {
  //Local variables:
  const ScreenWidth: number = window.innerWidth;
  const PlusImage: string = require("../../../../External/Images/plus.png");
  const DeleteImage: string = require("../../../../External/Images/trashcan.png");
  const EditImage: string = require("../../../../External/Images/Edit.png");
  const FilterImage: string = require("../../../../External/Images/filter.png");
  const FilterNoneImage: string = require("../../../../External/Images/filternone.png");
  const isProjectManager = props?.Projectdata?.ProjectManager?.some(
    (pm: IPeoplePickerDetails) =>
      pm?.email?.toLowerCase() === props?.loginUserEmail?.toLowerCase()
  );

  //Local states:
  const [loader, setLoader] = React.useState<boolean>(false);
  const [projectChangeRequestDetails, setProjectChangeRequestDetails] =
    useState<IChangeRequestDetails[]>([]);
  const [
    masterProjectChangeRequestDetails,
    setMasterProjectChangeRequestDetails,
  ] = useState<IChangeRequestDetails[]>([]);
  const [
    initialCRMProjectCRsListDropContainer,
    setinitialCRMProjectCRsListDropContainer,
  ] = React.useState<ICRMProjectCRsListDrop>({
    ...Config.CRMProjectCRsDropDown,
  });
  const [currentPage, setCurrentPage] = React.useState<"list" | "form">("list");
  const [searchVal, setSearchVal] = React.useState<string>("");
  const [filterBar, setFilterBar] = React.useState<boolean>(false);
  const [filterValues, setFilterValues] = React.useState({
    CRId: "",
    CRTitle: "",
    ChangeType: "",
    CRDescription: "",
    Severity: "",
  });
  const [selectedData, setSelectedData] =
    React.useState<IChangeRequestDetails | null>(null);
  const [formMode, setFormMode] = React.useState<"add" | "edit" | "view">(
    "add"
  );
  const [isDelModal, setIsDelModal] = React.useState<IDelModal>({
    isOpen: false,
    Id: null,
  });

  //Get all project changes request details:
  const getAllChangeRequestDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames?.CRMProjectCRs,
      Select:
        "*,RequestedBy/Title,RequestedBy/Id,RequestedBy/EMail,AssignedTo/Title,AssignedTo/Id,AssignedTo/EMail,Author/Id,Author/Title,Author/EMail,Editor/Id,Editor/EMail,Editor/Title,Project/Id,Project/ProjectID",
      Expand: "RequestedBy,AssignedTo,Project,Author,Editor",
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
        console.log(res, "res");
        let projectChangeRequestDatas: IChangeRequestDetails[] = [];
        res?.forEach((items: any) => {
          let _RequestedBy: IPeoplePickerDetails[] = [];
          if (items?.RequestedBy) {
            items?.RequestedBy.forEach((user: any) => {
              _RequestedBy.push({
                id: user?.Id,
                name: user?.Title,
                email: user?.EMail,
              });
            });
          }
          let _AssignedTo: IPeoplePickerDetails[] = [];
          if (items?.AssignedTo) {
            items?.AssignedTo.forEach((user: any) => {
              _AssignedTo.push({
                id: user?.Id,
                name: user?.Title,
                email: user?.EMail,
              });
            });
          }
          let _CreatedBy: IPeoplePickerDetails[] = [];
          if (items?.Author) {
            _CreatedBy.push({
              id: items?.Author?.Id,
              name: items?.Author?.EMail,
              email: items?.Author?.Title,
            });
          }
          let _LastUpdatedBy: IPeoplePickerDetails[] = [];
          if (items?.Editor) {
            _LastUpdatedBy.push({
              id: items?.Editor?.Id,
              name: items?.Editor?.EMail,
              email: items?.Editor?.Title,
            });
          }
          projectChangeRequestDatas.push({
            ID: items?.ID,
            CRId: items?.CRID,
            ProjectId: items?.Project?.ProjectID,
            CRTitle: items?.CRTitle,
            CRDescription: items?.CRDescription,
            RequestedBy: _RequestedBy,
            RequestDate: items?.RequestDate,
            ChangeType: items?.ChangeType,
            Severity: items?.Severity,
            Priority: items?.Priority,
            EffortEstimate: items?.EffortEstimate,
            EstimatedStartDate: items?.EstimatedStartDate,
            EstimatedEndDate: items?.EstimatedEndDate,
            ActualStartDate: items?.ActualStartDate,
            ActualEndDate: items?.ActualEndDate,
            AssignedTo: _AssignedTo,
            ApprovalStatus: items?.ApprovalStatus,
            ApprovalComments: items?.ApprovalComments,
            ImplementationStatus: items?.ImplementationStatus,
            ChangeImpactedModules: items?.ChangeImpactedModules,
            ChangeImpactDescription: items?.ChangeImpactDescription,
            CostImpact: items?.CostImpact,
            BillingImpact: items?.BillingImpact,
            BillingDetailsAmount: items?.BillingDetailsAmount,
            Remarsk: items?.Remarks,
            CreatedBy: _CreatedBy,
            CreatedDate: items?.Created,
            LastUpdatedBy: _LastUpdatedBy,
            LastUpdatedDate: items?.Modified,
          });
        });
        setProjectChangeRequestDetails([...projectChangeRequestDatas]);
        setMasterProjectChangeRequestDetails([...projectChangeRequestDatas]);
        getAllChoices();
      })
      .catch((err) => {
        console.log(
          err,
          "Get All change request details error in ChangeRequest.tsx"
        );
      });
  };

  //Get all choice from CRMProjectCRs list:
  const getAllChoices = () => {
    SPServices.SPGetChoices({
      Listname: Config.ListNames.CRMProjectCRs,
      FieldName: "ChangeType",
    })
      .then((res: any) => {
        let tempChangeType: IBasicDropDown[] = [];
        if (res?.Choices?.length) {
          res?.Choices?.forEach((val: any) => {
            tempChangeType.push({
              name: val,
            });
          });
        }
        setinitialCRMProjectCRsListDropContainer(
          (prev: ICRMProjectCRsListDrop) => ({
            ...prev,
            ChangeType: tempChangeType,
          })
        );

        SPServices.SPGetChoices({
          Listname: Config.ListNames.CRMProjectCRs,
          FieldName: "Severity",
        })
          .then((res: any) => {
            let tempSeverity: IBasicDropDown[] = [];
            if (res?.Choices?.length) {
              res?.Choices?.forEach((val: any) => {
                tempSeverity.push({
                  name: val,
                });
              });
            }
            setinitialCRMProjectCRsListDropContainer(
              (prev: ICRMProjectCRsListDrop) => ({
                ...prev,
                Severity: tempSeverity,
              })
            );

            SPServices.SPGetChoices({
              Listname: Config.ListNames.CRMProjectCRs,
              FieldName: "Priority",
            })
              .then((res: any) => {
                let tempPriority: IBasicDropDown[] = [];
                if (res?.Choices?.length) {
                  res?.Choices?.forEach((val: any) => {
                    tempPriority.push({
                      name: val,
                    });
                  });
                }
                setinitialCRMProjectCRsListDropContainer(
                  (prev: ICRMProjectCRsListDrop) => ({
                    ...prev,
                    Priority: tempPriority,
                  })
                );

                SPServices.SPGetChoices({
                  Listname: Config.ListNames.CRMProjectCRs,
                  FieldName: "ApprovalStatus",
                })
                  .then((res: any) => {
                    let tempApprovalStatus: IBasicDropDown[] = [];
                    if (res?.Choices?.length) {
                      res?.Choices?.forEach((val: any) => {
                        tempApprovalStatus.push({
                          name: val,
                        });
                      });
                    }
                    setinitialCRMProjectCRsListDropContainer(
                      (prev: ICRMProjectCRsListDrop) => ({
                        ...prev,
                        ApprovalStatus: tempApprovalStatus,
                      })
                    );

                    SPServices.SPGetChoices({
                      Listname: Config.ListNames.CRMProjectCRs,
                      FieldName: "ImplementationStatus",
                    })
                      .then((res: any) => {
                        let tempImplementationStatus: IBasicDropDown[] = [];
                        if (res?.Choices?.length) {
                          res?.Choices?.forEach((val: any) => {
                            tempImplementationStatus.push({
                              name: val,
                            });
                          });
                        }
                        setinitialCRMProjectCRsListDropContainer(
                          (prev: ICRMProjectCRsListDrop) => ({
                            ...prev,
                            ImplementationStatus: tempImplementationStatus,
                          })
                        );

                        SPServices.SPGetChoices({
                          Listname: Config.ListNames.CRMProjectCRs,
                          FieldName: "BillingImpact",
                        })
                          .then((res: any) => {
                            let tempBillingImpact: IBasicDropDown[] = [];
                            if (res?.Choices?.length) {
                              res?.Choices?.forEach((val: any) => {
                                tempBillingImpact.push({
                                  name: val,
                                });
                              });
                            }
                            setinitialCRMProjectCRsListDropContainer(
                              (prev: ICRMProjectCRsListDrop) => ({
                                ...prev,
                                BillingImpact: tempBillingImpact,
                              })
                            );
                            setLoader(false);
                          })
                          .catch((err) => {
                            console.log(
                              err,
                              "Get CRMProjectCRs Choices err in ChangeRequest.tsx"
                            );
                          });
                      })
                      .catch((err) => {
                        console.log(
                          err,
                          "Get CRMProjectCRs Choices err in ChangeRequest.tsx"
                        );
                      });
                  })
                  .catch((err) => {
                    console.log(
                      err,
                      "Get CRMProjectCRs Choices err in ChangeRequest.tsx"
                    );
                  });
              })
              .catch((err) => {
                console.log(
                  err,
                  "Get CRMProjectCRs Choices err in ChangeRequest.tsx"
                );
              });
          })
          .catch((err) => {
            console.log(
              err,
              "Get CRMProjectCRs Choices err in ChangeRequest.tsx"
            );
          });
      })
      .catch((err) => {
        console.log(err, "Get CRMProjectCRs Choices err in ChangeRequest.tsx");
      });
  };

  //Handle Filter change:
  const handleFilterChange = (field: string, value: string) => {
    setFilterValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  //Delete Particular Item:
  const TrashItem = () => {
    const currObj = {
      IsDelete: true,
    };
    SPServices.SPUpdateItem({
      ID: isDelModal.Id ?? 0,
      Listname: Config.ListNames.CRMProjectCRs,
      RequestJSON: currObj,
    })
      .then(() => {
        props.Notify("success", "Success", "CR Deleted successfully");
        getAllChangeRequestDetails();
      })
      .catch((err) => {
        console.log(err, "rowData deleted err in changeRequest.tsx component");
      });
  };

  //Render Identified By Column:
  const renderRequestedByColumn = (rowData: IChangeRequestDetails) => {
    const requestedBy: IPeoplePickerDetails[] = rowData?.RequestedBy || [];
    return (
      <div>
        {rowData?.RequestedBy?.length > 1
          ? multiPeoplePickerTemplate(requestedBy)
          : peoplePickerTemplate(requestedBy[0])}
      </div>
    );
  };

  //Render Assigned To Column:
  const renderAssignedToColumn = (rowData: IChangeRequestDetails) => {
    const assignedTo: IPeoplePickerDetails[] = rowData?.AssignedTo || [];
    return (
      <div>
        {rowData?.AssignedTo?.length > 1
          ? multiPeoplePickerTemplate(assignedTo)
          : peoplePickerTemplate(assignedTo[0])}
      </div>
    );
  };

  //Global Search functionalities:
  const searchProjectChangeRequestsDetails = (val: string) => {
    setSearchVal(val);
    if (!val) {
      applyFilters();
      return;
    }

    const filtered = masterProjectChangeRequestDetails.filter((item) => {
      const assignedToNames =
        item?.AssignedTo?.map((pm) => pm.name?.toLowerCase()).join(" ") || "";
      const RequestedByNames =
        item?.RequestedBy?.map((dh) => dh.name?.toLowerCase()).join(" ") || "";
      return (
        item.CRId?.toLowerCase().includes(val.toLowerCase()) ||
        item.CRTitle?.toLowerCase().includes(val.toLowerCase()) ||
        item.CRDescription?.toLowerCase().includes(val.toLowerCase()) ||
        item.Severity?.toLowerCase().includes(val.toLowerCase()) ||
        item.ApprovalStatus?.toLowerCase().includes(val.toLowerCase()) ||
        item.ChangeType?.toLowerCase().includes(val.toLowerCase()) ||
        assignedToNames.includes(val.toLowerCase()) ||
        RequestedByNames.includes(val.toLowerCase())
      );
    });
    setProjectChangeRequestDetails(filtered);
  };

  //Apply Filters:
  const applyFilters = () => {
    const filtered = masterProjectChangeRequestDetails.filter((item) => {
      const matchCRID = item?.CRId?.toLowerCase().includes(
        filterValues.CRId.toLowerCase()
      );
      const matchCRDescription = item?.CRDescription?.toLowerCase().includes(
        filterValues.CRDescription.toLowerCase()
      );
      const matchCRTitle = item?.CRTitle?.toLowerCase().includes(
        filterValues.CRTitle.toLowerCase()
      );
      const matchChangeType = filterValues.ChangeType
        ? item?.ChangeType === filterValues.ChangeType
        : true;
      const matchSeverity = filterValues.Severity
        ? item?.Severity === filterValues.Severity
        : true;

      return (
        matchCRID &&
        matchCRDescription &&
        matchCRTitle &&
        matchChangeType &&
        matchSeverity
      );
    });

    setProjectChangeRequestDetails(filtered);
  };

  //initialize data on component load:
  useEffect(() => {
    setLoader(true);
    getAllChangeRequestDetails();
  }, []);

  //Filter changes render:
  React.useEffect(() => {
    applyFilters();
  }, [filterValues]);

  return (
    <>
      {loader ? (
        <Loading />
      ) : currentPage == "list" ? (
        <div className={styles.lcaBody}>
          <div
            className={`${styles.filterBarAndTableBorder} 
              ${
                ScreenWidth >= 1536
                  ? styles.filterBar_1536
                  : styles.filterBar_1396
              }
              `}
          >
            <div className={styles.filterBar}>
              <h2>Change Requests</h2>
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
                      CRId: "",
                      CRTitle: "",
                      ChangeType: "",
                      CRDescription: "",
                      Severity: "",
                    });
                    setLoader(true);
                    getAllChangeRequestDetails();
                  }}
                />
              </div>
              <div className="all_search">
                <IconField iconPosition="left">
                  <InputIcon className="pi pi-search"> </InputIcon>
                  <InputText
                    value={searchVal}
                    onChange={(e) =>
                      searchProjectChangeRequestsDetails(e.target.value)
                    }
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
              {isProjectManager ? (
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
                    New CR
                  </div>
                </div>
              ) : (
                ""
              )}
            </div>
          </div>
          {filterBar ? (
            <div className={styles.filterFields}>
              <div className={styles.filterField}>
                <label>CR Id</label>
                <InputText
                  value={filterValues?.CRId}
                  onChange={(e) => handleFilterChange("CRId", e.target.value)}
                  placeholder="Enter here"
                />
              </div>
              <div className={styles.filterField}>
                <label>CR Description</label>
                <InputText
                  value={filterValues?.CRDescription}
                  onChange={(e) =>
                    handleFilterChange("CRDescription", e.target.value)
                  }
                  placeholder="Enter here"
                />
              </div>
              <div className={styles.filterField}>
                <label>CR title</label>
                <InputText
                  value={filterValues?.CRTitle}
                  onChange={(e) =>
                    handleFilterChange("CRTitle", e.target.value)
                  }
                  placeholder="Enter here"
                />
              </div>
              <div className={`${styles.filterField} dropdown`}>
                <label>Change type</label>
                <Dropdown
                  options={initialCRMProjectCRsListDropContainer?.ChangeType}
                  optionLabel="name"
                  placeholder="Select a status"
                  value={initialCRMProjectCRsListDropContainer?.ChangeType.find(
                    (item) => item.name === filterValues?.ChangeType
                  )}
                  onChange={(e) =>
                    handleFilterChange("ChangeType", e.value?.name)
                  }
                />
              </div>
              <div className={`${styles.filterField} dropdown`}>
                <label>Severity/Impact</label>
                <Dropdown
                  options={initialCRMProjectCRsListDropContainer?.Severity}
                  optionLabel="name"
                  placeholder="Select a risk occurred"
                  value={initialCRMProjectCRsListDropContainer?.Severity.find(
                    (item) => item.name === filterValues?.Severity
                  )}
                  onChange={(e) =>
                    handleFilterChange("Severity", e.value?.name)
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
                      CRId: "",
                      CRTitle: "",
                      ChangeType: "",
                      CRDescription: "",
                      Severity: "",
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
                  ${
                    ScreenWidth >= 1536 ? "data_table_1536" : "data_table_1396"
                  }`}
          >
            <DataTable
              value={projectChangeRequestDetails}
              paginator={
                projectChangeRequestDetails &&
                projectChangeRequestDetails?.length > 8
              }
              rows={8}
              emptyMessage={<p className={styles.noData}>No data !!!</p>}
              onRowClick={(e: any) => {
                setSelectedData(e.data);
                setFormMode("view");
                setCurrentPage("form");
                setLoader(true);
              }}
            >
              <Column sortable field="CRId" header="CR id" />
              <Column sortable field="ProjectId" header="Project Id"></Column>
              <Column sortable field="CRTitle" header="CR title"></Column>
              <Column
                sortable
                field="CRDescription"
                header="CR description"
              ></Column>
              <Column
                sortable
                field="RequestedBy"
                header="Requested By"
                body={renderRequestedByColumn}
              ></Column>
              <Column
                sortable
                field="RequestDate"
                header="Request date"
                body={(rowData) => {
                  return (
                    <div>
                      {rowData?.RequestDate
                        ? moment(rowData?.RequestDate).format("DD/MM/YYYY")
                        : ""}
                    </div>
                  );
                }}
              ></Column>
              <Column
                sortable
                field="EffortEstimate"
                header="Effort estimate"
              ></Column>
              <Column
                sortable
                field="AssignedTo"
                header="Assigned to"
                body={renderAssignedToColumn}
              ></Column>
              <Column sortable field="ChangeType" header="Change type"></Column>
              <Column sortable field="Severity" header="Severity"></Column>
              <Column
                sortable
                field="ApprovalStatus"
                header="Approval status"
              ></Column>
              {isProjectManager ? (
                <Column
                  field="Action"
                  header="Actions"
                  body={(rowData: IChangeRequestDetails) => {
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
                              setIsDelModal({ Id: rowData?.ID, isOpen: true });
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
              ) : (
                ""
              )}
            </DataTable>
          </div>
        </div>
      ) : (
        ""
      )}

      {currentPage === "form" ? (
        <CRForm
          loginUserEmail={props?.loginUserEmail}
          initialCRMProjectCRsListDropContainer={
            initialCRMProjectCRsListDropContainer
          }
          data={selectedData}
          setLoader={setLoader}
          isAdd={formMode === "add"}
          isEdit={formMode === "edit"}
          isView={formMode === "view"}
          goBack={() => setCurrentPage("list")}
          spfxContext={props.spfxContext}
          Notify={props.Notify}
          refresh={getAllChangeRequestDetails}
          setCurrentPage={setCurrentPage}
          projectData={props?.Projectdata}
        />
      ) : (
        ""
      )}

      <Modal isOpen={isDelModal.isOpen} styles={Config.delModalStyle}>
        <p className={styles.delmsg}>
          Are you sure, you want to delete this CR?
        </p>
        <div className={styles.modalBtnSec}>
          <PrimaryButton
            text="No"
            className={styles.cancelBtn}
            onClick={() => {
              setIsDelModal({ isOpen: false, Id: null });
            }}
          />
          <PrimaryButton
            text="Yes"
            className={styles.addBtn}
            onClick={() => {
              setIsDelModal((pre) => ({
                ...pre,
                isOpen: false,
              }));
              TrashItem();
            }}
          />
        </div>
      </Modal>
    </>
  );
};

export default ChangeRequest;
