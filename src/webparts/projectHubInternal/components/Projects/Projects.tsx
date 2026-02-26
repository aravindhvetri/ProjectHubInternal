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
import styles from "./Projects.module.scss";
import SPServices from "../../../../External/CommonServices/SPServices";
import {
  Config,
  RefreshButton,
} from "../../../../External/CommonServices/Config";
import "../../../../External/CSS/Style.css";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import * as moment from "moment";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  multiPeoplePickerTemplate,
  peoplePickerTemplate,
  textTemplate,
} from "../../../../External/CommonServices/CommonTemplate";
import {
  IBasicDropDown,
  ICRMProjectsListDrop,
  IDelModal,
  IPeoplePickerDetails,
  IProjectData,
} from "../../../../External/CommonServices/interface";
// import ProjectFormPage from "./ProjectsFormPage";
import { Modal, PrimaryButton } from "@fluentui/react";
import Billings from "../Billings/Billings";
import { Dropdown } from "primereact/dropdown";
import Loading from "../../../../External/Loader/Loading";
import ChangeLog from "../ChangeLog/ChangeLog";
import { Dialog } from "primereact/dialog";
import { sp } from "@pnp/sp";
import ProjectFormAndTabs from "../ProjectFormAndTabsModule/ProjectFormAndTabs";
import DealSheet from "../DealSheet/DealSheet";
interface IProps {
  Notify: (
    type: "info" | "success" | "warn" | "error" | "secondary" | "contrast",
    summary: string,
    msg: string,
  ) => void;
  spfxContext: any;
  pageName: string;
  loginUserEmail: string;
  PageNavigation: (pageName: string, data?: IProjectData) => void;
}
//Global Image Variables:
const PlusImage: string = require("../../../../External/Images/plus.png");
const commentsImage: string = require("../../../../External/Images/comment.png");
const DeleteImage: string = require("../../../../External/Images/trashcan.png");
const EditImage: string = require("../../../../External/Images/Edit.png");
const VersionHistoryImage: string = require("../../../../External/Images/versionHistory.png");
const FolderImage: string = require("../../../../External/Images/folder.png");
const FilterImage: string = require("../../../../External/Images/filter.png");
const FilterNoneImage: string = require("../../../../External/Images/filternone.png");

const Projects = (props: IProps): JSX.Element => {
  const loginEmail = props?.loginUserEmail?.toLowerCase();
  const adminUsers = [
    "sreedhar.sk@technorucs.com",
    "Chandru@technorucs.com",
    "Chandru@technorucs365.onmicrosoft.com",
    "v.aravinthan@technorucs.com",
    "Finance@technorucs.com",
  ];
  //Local variables:
  const ScreenWidth: number = window.innerWidth;

  //Local States:
  const [projectDetails, setProjectDetails] = React.useState<IProjectData[]>(
    [],
  );
  const [PMOusers, setPMOusers] = React.useState<IPeoplePickerDetails[]>([]);
  const [masterProjectDetails, setMasterProjectDetails] = React.useState<
    IProjectData[]
  >([]);
  const [currentPage, setCurrentPage] = React.useState<
    "list" | "form" | "BillingList" | "DealSheet"
  >("list");
  const [selectedData, setSelectedData] = React.useState<IProjectData | null>(
    null,
  );
  const [billingsDetails, setBillingDetails] = React.useState<any>([]);
  const [formMode, setFormMode] = React.useState<"add" | "edit" | "view">(
    "add",
  );
  const [isDelModal, setIsDelModal] = React.useState<IDelModal>({
    isOpen: false,
    Id: null,
  });
  const [searchVal, setSearchVal] = React.useState<string>("");
  const [filterBar, setFilterBar] = React.useState<boolean>(false);
  const [filterValues, setFilterValues] = React.useState({
    CustomerDisplayName: "",
    AccountManager: "",
    AccountName: "",
    ProjectStatus: "",
    BillingModel: "",
    Status: "",
    Upwork: "",
    ProjectManager: "",
  });
  const [
    initialCRMProjectsListDropContainer,
    setinitialCRMProjectsListDropContainer,
  ] = React.useState<ICRMProjectsListDrop>({
    ...Config.CRMProjectsDropDown,
  });
  const [loader, setLoader] = React.useState<boolean>(false);
  const [isChangeLogOpen, setIsChangeLogOpen] = React.useState<boolean>(false);
  const [eventID, setEventID] = React.useState<any>(null);
  const [rejectComments, setRejectComments] = React.useState<any[]>([]);
  const [isCommentsModal, setIsCommentsModal] = React.useState<IDelModal>({
    ...Config.initialModal,
  });
  const [isCmtsLoader, setIsCmtsLoader] = React.useState(false);

  //Get Project Details:
  const getProjectDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.CRMProjects,
      Select:
        "*,ProjectManager/Id,ProjectManager/EMail,ProjectManager/Title,DeliveryHead/Id,DeliveryHead/EMail,DeliveryHead/Title,BA/Id,BA/EMail,BA/Title",
      Expand: "ProjectManager,DeliveryHead,BA",
      Orderby: "Modified",
      Orderbydecorasc: true,
      Filter: [
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
    })
      .then((res: any) => {
        let projectDetails: IProjectData[] = [];
        res?.forEach((items: any) => {
          let _ProjectManager: IPeoplePickerDetails[] = [];
          if (items?.ProjectManager) {
            items?.ProjectManager.forEach((user: any) => {
              _ProjectManager.push({
                id: user?.Id,
                name: user?.Title,
                email: user?.EMail,
              });
            });
          }
          let _DeliveryHead: IPeoplePickerDetails[] = [];
          if (items?.DeliveryHead) {
            items?.DeliveryHead.forEach((user: any) => {
              _DeliveryHead.push({
                id: user?.Id,
                name: user?.Title,
                email: user?.EMail,
              });
            });
          }
          let _BA: IPeoplePickerDetails[] = [];
          if (items?.BA) {
            items?.BA.forEach((user: any) => {
              _BA.push({
                id: user?.Id,
                name: user?.Title,
                email: user?.EMail,
              });
            });
          }
          projectDetails.push({
            ID: items?.ID,
            ProjectID: items?.ProjectID,
            AccountManager: items?.AccountManager,
            AccountName: items?.AccountName,
            ProjectName: items?.ProjectName,
            StartDate: items?.StartDate,
            PlannedEndDate: items?.PlannedEndDate,
            ProjectManager: _ProjectManager ? _ProjectManager : [],
            DeliveryHead: _DeliveryHead ? _DeliveryHead : [],
            BA: _BA ? _BA : [],
            ProjectStatus: items?.ProjectStatus,
            BillingModel: items?.BillingModel,
            Budget: items?.Budget,
            Hours: items?.Hours,
            Currency: items?.Currency,
            ClientName: items?.ClientName,
            UpWork: items?.UpWork,
            ProjectType: items?.ProjectType,
            CustomerID: items?.CustomerID,
            CustomerDisplayName: items?.CustomerDisplayName,
            BillingContactName: items?.BillingContactName,
            BillingContactEmail: items?.BillingContactEmail,
            BillingContactMobile: items?.BillingContactMobile,
            BillingAddress: items?.BillingAddress,
            Remarks: items?.Remarks,
            Status: items?.Status,
            DealProfit: items?.DealProfit,
            DealMargin: items?.DealMargin,
            FPMProfit: items?.FPMProfit,
            FPMMargin: items?.FPMMargin,
          });
        });
        const filteredProjects = adminUsers.includes(loginEmail)
          ? projectDetails
          : projectDetails.filter(
              (project) =>
                project.ProjectManager?.some(
                  (u) => u.email?.toLowerCase() === loginEmail,
                ) ||
                project.DeliveryHead?.some(
                  (u) => u.email?.toLowerCase() === loginEmail,
                ) ||
                project.BA?.some((u) => u.email?.toLowerCase() === loginEmail),
            );
        setProjectDetails([...filteredProjects]);
        setMasterProjectDetails([...filteredProjects]);
        getAllChoices();
      })
      .catch((err) => {
        console.log(err, "getProjectDetails Error in Projects.tsx component");
      });
  };

  //get Billings List Details:
  const getBillingsListDetails = async () => {
    const res = await SPServices.SPReadItems({
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
      ],
    });

    let BillingDetails: any[] = res.map((items: any) => ({
      ProjectId: items?.Project?.Id,
      Status: items?.Status,
    }));

    setBillingDetails(BillingDetails);
  };

  //Get Group Members:
  const getPMOGroupUsers = () => {
    SPServices.getSPGroupMember({
      GroupName: Config.GroupNames.PMO,
    })
      .then((res: any) => {
        const tempUsers: IPeoplePickerDetails[] = [];
        res.forEach((items: any) => {
          tempUsers.push({
            id: items?.Id,
            email: items?.Email,
            name: items?.Title,
          });
        });
        setPMOusers([...tempUsers]);
      })
      .catch((err) => {
        console.log(err, "Get PMO group users error in projectsFormPage.tsx");
      });
  };

  //Get All Choices in CRMProjects list:
  const getAllChoices = () => {
    SPServices.SPGetChoices({
      Listname: Config.ListNames.CRMProjects,
      FieldName: "ProjectStatus",
    })
      .then((res: any) => {
        let tempProjectStatus: IBasicDropDown[] = [];
        if (res?.Choices?.length) {
          res?.Choices?.forEach((val: any) => {
            tempProjectStatus.push({
              name: Config.projectStatusMap[val] || val,
            });
          });
        }
        setinitialCRMProjectsListDropContainer(
          (prev: ICRMProjectsListDrop) => ({
            ...prev,
            projectStaus: tempProjectStatus,
          }),
        );
        SPServices.SPGetChoices({
          Listname: Config.ListNames.CRMProjects,
          FieldName: "BillingModel",
        })
          .then((res: any) => {
            let tempBillingModel: IBasicDropDown[] = [];
            if (res?.Choices?.length) {
              res?.Choices?.forEach((val: any) => {
                tempBillingModel.push({
                  name: val,
                });
              });
            }
            setinitialCRMProjectsListDropContainer(
              (prev: ICRMProjectsListDrop) => ({
                ...prev,
                BillingModel: tempBillingModel,
              }),
            );
            SPServices.SPGetChoices({
              Listname: Config.ListNames.CRMProjects,
              FieldName: "Currency",
            })
              .then((res: any) => {
                let tempCurrency: IBasicDropDown[] = [];
                if (res?.Choices?.length) {
                  res?.Choices?.forEach((val: any) => {
                    tempCurrency.push({
                      name: val,
                    });
                  });
                }
                setinitialCRMProjectsListDropContainer(
                  (prev: ICRMProjectsListDrop) => ({
                    ...prev,
                    Currency: tempCurrency,
                  }),
                );
                SPServices.SPGetChoices({
                  Listname: Config.ListNames.CRMProjects,
                  FieldName: "ProjectType",
                })
                  .then((res: any) => {
                    let tempProjectType: IBasicDropDown[] = [];
                    if (res?.Choices?.length) {
                      res?.Choices?.forEach((val: any) => {
                        tempProjectType.push({
                          name: val,
                        });
                      });
                    }
                    setinitialCRMProjectsListDropContainer(
                      (prev: ICRMProjectsListDrop) => ({
                        ...prev,
                        ProjectType: tempProjectType,
                      }),
                    );
                    SPServices.SPGetChoices({
                      Listname: Config.ListNames.CRMProjects,
                      FieldName: "Status",
                    })
                      .then((res: any) => {
                        let Status: IBasicDropDown[] = [];
                        if (res?.Choices?.length) {
                          res?.Choices?.forEach((val: any) => {
                            Status.push({
                              name: val,
                            });
                          });
                        }
                        setinitialCRMProjectsListDropContainer(
                          (prev: ICRMProjectsListDrop) => ({
                            ...prev,
                            Status: Status,
                          }),
                        );
                        setLoader(false);
                        getPMOGroupUsers();
                        getBillingsListDetails();
                      })
                      .catch((err) => {
                        console.log(
                          err,
                          "Get choice error from CRMProjects list",
                        );
                      });
                  })
                  .catch((err) => {
                    console.log(err, "Get choice error from CRMProjects list");
                  });
              })
              .catch((err) => {
                console.log(err, "Get choice error from CRMProjects list");
              });
          })
          .catch((err) => {
            console.log(err, "Get choice error from CRMProjects list");
          });
      })
      .catch((err) => {
        console.log(err, "Get choice error from CRMProjects list");
      });
  };

  //Get RejectComments Details:
  const getAllRejectComments = (ID: number) => {
    SPServices.SPReadItems({
      Listname: Config.ListNames?.RejectComments,
      Select: "*,Project/ID,Author/Title,Author/EMail,Author/ID",
      Expand: "Project,Author",
      Filter: [
        {
          FilterKey: "ProjectId",
          Operator: "eq",
          FilterValue: ID.toString(),
        },
      ],
      Orderby: "Modified",
      Orderbydecorasc: false,
    })
      .then((res) => {
        let tempRejectComments: any[] = [];
        if (res?.length) {
          res?.forEach((val: any) => {
            tempRejectComments.push({
              reason: val?.Reason,
              reasonUser: {
                name: val?.Author?.Title,
                email: val?.Author?.EMail,
                id: val?.Author?.ID,
              },
              created: val?.Created ? new Date(val?.Created) : null,
            });
          });
        }
        setRejectComments([...tempRejectComments]);
        setIsCmtsLoader(false);
      })
      .catch((err) => {
        setIsCmtsLoader(false);
        console.log("get ActionRegister Details", err);
      });
  };

  //Render Manager Column function:
  const renderManagersColumn = (rowData: IProjectData) => {
    const projectManagers: IPeoplePickerDetails[] = rowData?.ProjectManager;
    return (
      <div>
        {rowData?.ProjectManager?.length > 1
          ? multiPeoplePickerTemplate(projectManagers)
          : peoplePickerTemplate(projectManagers[0])}
      </div>
    );
  };

  //Render Account Manager Column function:
  // const renderAccountManagerColumn = (rowData: IProjectData) => {
  //   return <div>{rowData?.AccountManager ? rowData?.AccountManager : "-"}</div>;
  // };

  //Render Delivery Heads Column function:
  const renderDeliveryHeadsColumn = (rowData: IProjectData) => {
    const deliveryHeads: IPeoplePickerDetails[] = rowData?.DeliveryHead;
    return (
      <div>
        {rowData?.DeliveryHead?.length > 1
          ? multiPeoplePickerTemplate(deliveryHeads)
          : peoplePickerTemplate(deliveryHeads[0])}
      </div>
    );
  };

  //Render Status:
  const renderStatus = (rowData: any) => {
    return (
      <div>
        {Config.projectStatusMap[rowData?.ProjectStatus] ||
          rowData?.ProjectStatus}
      </div>
    );
  };

  //Render Upwork Column function:
  const UpworkTemplate = (rowData: IProjectData) => {
    return <div>{rowData?.UpWork ? "Yes" : "No"}</div>;
  };

  //handle all filters:
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
      Listname: Config.ListNames.CRMProjects,
      RequestJSON: currObj,
    })
      .then(() => {
        props.Notify("success", "Success", "Project Deleted successfully");
        getProjectDetails();
      })
      .catch((err) => {
        console.log(err, "rowData deleted err in projects.tsx component");
      });
  };

  //apply filters in purticular columns:
  const applyFilters = () => {
    const filtered = masterProjectDetails.filter((item) => {
      const managerNames =
        item?.ProjectManager?.map((pm: IPeoplePickerDetails) =>
          pm.name?.toLowerCase(),
        ).join(" ") || "";

      const matchCustomerName =
        item?.CustomerDisplayName?.toLowerCase().includes(
          filterValues.CustomerDisplayName.toLowerCase(),
        );
      const matchLead = item?.AccountManager?.toLowerCase().includes(
        filterValues.AccountManager.toLowerCase(),
      );
      const matchAccount = item?.ClientName?.toLowerCase().includes(
        filterValues.AccountName.toLowerCase(),
      );
      const matchStatus = filterValues.ProjectStatus
        ? (Config.projectStatusMap[item?.ProjectStatus] ||
            item?.ProjectStatus) === filterValues.ProjectStatus
        : true;
      const matchProjectStatus = filterValues.Status
        ? item?.Status === filterValues.Status
        : true;
      const matchBilling = filterValues.BillingModel
        ? item?.BillingModel === filterValues.BillingModel
        : true;
      const matchProjectManager = filterValues.ProjectManager
        ? managerNames.includes(filterValues.ProjectManager.toLowerCase())
        : true;
      const matchUpwork =
        filterValues.Upwork === "" || filterValues.Upwork === null
          ? true
          : String(item?.UpWork).toLowerCase() ===
            String(filterValues.Upwork).toLowerCase();

      return (
        matchCustomerName &&
        matchLead &&
        matchAccount &&
        matchStatus &&
        matchBilling &&
        matchProjectManager &&
        matchProjectStatus &&
        matchUpwork
      );
    });

    setProjectDetails(filtered);
  };

  //Global Search functionalities:
  const searchProjectDetails = (val: string) => {
    setSearchVal(val);
    if (!val) {
      applyFilters();
      return;
    }

    const filtered = masterProjectDetails.filter((item) => {
      const managerNames =
        item?.ProjectManager?.map((pm) => pm.name?.toLowerCase()).join(" ") ||
        "";
      const deliveryHeadNames =
        item?.DeliveryHead?.map((dh) => dh.name?.toLowerCase()).join(" ") || "";
      return (
        item.ProjectID?.toLowerCase().includes(val.toLowerCase()) ||
        item.CustomerDisplayName?.toLowerCase().includes(val.toLowerCase()) ||
        item.AccountManager?.toLowerCase().includes(val.toLowerCase()) ||
        item.AccountName?.toLowerCase().includes(val.toLowerCase()) ||
        item.ClientName?.toLowerCase().includes(val.toLowerCase()) ||
        item.ProjectName?.toLowerCase().includes(val.toLowerCase()) ||
        item.ProjectStatus?.toLowerCase().includes(val.toLowerCase()) ||
        item?.Status?.toLowerCase().includes(val.toLowerCase()) ||
        item.BillingModel?.toLowerCase().includes(val.toLowerCase()) ||
        managerNames.includes(val.toLowerCase()) ||
        deliveryHeadNames.includes(val.toLowerCase())
      );
    });
    setProjectDetails(filtered);
  };

  //ChangeLog Details:
  let changeLogDetails: any = {
    id: eventID,
    listName: Config.ListNames?.CRMProjects,
    columns: [
      {
        key: "ProjectID",
        type: "Text",
        name: "Project ID",
      },
      {
        key: "ProjectName",
        type: "Text",
        name: "Project Name",
      },
      {
        key: "AccountName",
        type: "Text",
        name: "Account Name",
      },
      {
        key: "AccountManager",
        type: "Text",
        name: "Account manager",
      },
      {
        key: "ProjectManager",
        type: "PeoplePickerMultiple",
        name: "Project Manager",
      },

      {
        key: "StartDate",
        type: "Date",
        name: "Start Date",
      },
      {
        key: "PlannedEndDate",
        type: "Date",
        name: "Planned End Date",
      },
      {
        key: "ProjectStatus",
        type: "Text",
        name: "Project Status",
      },
      {
        key: "BillingModel",
        type: "Text",
        name: "Billing Model",
      },
      {
        key: "BillingContactName",
        type: "Text",
        name: "Billing Contact Name",
      },
      {
        key: "BillingContactEmail",
        type: "Text",
        name: "Billing Contact Email",
      },
      {
        key: "BillingContactMobile",
        type: "Text",
        name: "Billing Contact Mobile",
      },
      {
        key: "BillingAddress",
        type: "Text",
        name: "Billing Address",
      },
      {
        key: "Remarks",
        type: "Text",
        name: "Remarks",
      },
    ],
  };

  //Render Reject Reason Created Date function:
  const rejectReasonCreatedDate = (date: Date) => {
    return (
      <>
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
          className="displayText"
        >
          {date ? moment(date).format("DD-MM-YYYY") : ""}
        </div>
      </>
    );
  };

  //Check whether the user is editable or not:
  const isEditable = (rowData: IProjectData) => {
    const isPMOUser = PMOusers?.some(
      (user) =>
        user?.email?.toLowerCase() === props?.loginUserEmail?.toLowerCase(),
    );

    const isProjectManager = rowData?.ProjectManager?.some(
      (pm: IPeoplePickerDetails) =>
        pm?.email?.toLowerCase() === props?.loginUserEmail?.toLowerCase(),
    );

    const isDeliveryHead = rowData?.DeliveryHead?.some(
      (dh: IPeoplePickerDetails) =>
        dh?.email?.toLowerCase() === props?.loginUserEmail?.toLowerCase(),
    );

    return (
      (isPMOUser &&
        (rowData?.ProjectStatus == "0" ||
          rowData?.ProjectStatus == "4" ||
          rowData?.ProjectStatus == "5" ||
          rowData?.ProjectStatus == "1")) ||
      (isPMOUser &&
        rowData?.ProjectStatus == "6" &&
        billingsDetails?.some(
          (bill: any) =>
            bill?.ProjectId === rowData?.ID &&
            (bill?.Status == "0" || bill?.Status == "4") &&
            rowData?.BillingModel == "T&M",
        )) ||
      (isProjectManager &&
        (rowData?.ProjectStatus == "2" ||
          (rowData?.ProjectStatus == "6" &&
            billingsDetails?.some(
              (bill: any) =>
                bill?.ProjectId === rowData?.ID &&
                (bill?.Status == "0" || bill?.Status == "4"),
            )) ||
          rowData?.ProjectStatus == "6")) ||
      (isDeliveryHead && rowData?.ProjectStatus == "3")
    );
  };

  //Open Project Folder function:
  const handleOpenProjectFolder = async (rowData: any, spfxContext: any) => {
    try {
      const accountName = rowData?.ClientName?.trim();
      const libraryName = Config.LibraryNames.ProjectFolderStructure;
      const siteUrl = spfxContext?.pageContext?.web?.absoluteUrl;
      const serverRelativeUrl =
        spfxContext?.pageContext?.web?.serverRelativeUrl;

      const folderServerRelativeUrl = `${serverRelativeUrl}/${libraryName}/${accountName}`;

      //Check if folder exists
      const folderExists = await sp.web
        .getFolderByServerRelativePath(folderServerRelativeUrl)
        .select("Exists")
        .get()
        .then((res) => res?.Exists)
        .catch(() => false);

      //Open the folder or library based on existence
      if (folderExists) {
        window.open(`${siteUrl}/${libraryName}/${accountName}`, "_blank");
      } else {
        window.open(`${siteUrl}/${libraryName}/Forms/AllItems.aspx`, "_blank");
      }
    } catch (err) {
      console.error("Error opening project folder:", err);
      window.open(
        `${spfxContext?.pageContext?.web?.absoluteUrl}/ProjectFolderStructure/Forms/AllItems.aspx`,
        "_blank",
      );
    }
  };

  //ChangeLog Cancel function:
  const handleClose = () => {
    setIsChangeLogOpen(false);
  };

  //Initial Render:
  React.useEffect(() => {
    setLoader(true);
    getProjectDetails();
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
              <h2>Projects</h2>
            </div>
            <div className={styles.filterBtns}>
              <div className={styles.btnAndText}>
                <div
                  className={styles.btnBackGround}
                  onClick={() => {
                    window.open(
                      `${props?.spfxContext?.pageContext?.web?.absoluteUrl}//SitePages/Reports.aspx`,
                      "_blank",
                    );
                  }}
                >
                  Reports
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
                      CustomerDisplayName: "",
                      AccountManager: "",
                      AccountName: "",
                      ProjectStatus: "",
                      Status: "",
                      BillingModel: "",
                      Upwork: "",
                      ProjectManager: "",
                    });
                    setLoader(true);
                    getProjectDetails();
                  }}
                />
              </div>
              <div className="all_search">
                <IconField iconPosition="left">
                  <InputIcon className="pi pi-search"> </InputIcon>
                  <InputText
                    value={searchVal}
                    onChange={(e) => searchProjectDetails(e.target.value)}
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
              {PMOusers?.some(
                (user) =>
                  user?.email?.toLowerCase() ===
                  props?.loginUserEmail?.toLowerCase(),
              ) && (
                <div className={styles.btnAndText}>
                  <div
                    onClick={() => {
                      setSelectedData(null);
                      setFormMode("add");
                      setCurrentPage("form");
                      sessionStorage.removeItem("billingsData");
                    }}
                    className={styles.btnBackGround}
                  >
                    <img
                      src={PlusImage}
                      alt="no image"
                      style={{ width: "15px", height: "15px" }}
                    />
                    New project
                  </div>
                </div>
              )}
            </div>
          </div>
          {filterBar ? (
            <div className={styles.filterFields}>
              <div className={styles.filterField}>
                <label>Client name</label>
                <InputText
                  value={filterValues?.CustomerDisplayName}
                  onChange={(e) =>
                    handleFilterChange("CustomerDisplayName", e.target.value)
                  }
                  placeholder="Enter here"
                />
              </div>
              {/* <div className={styles.filterField}>
                <label>Account manager</label>
                <InputText
                  value={filterValues?.AccountManager}
                  onChange={(e) =>
                    handleFilterChange("AccountManager", e.target.value)
                  }
                  placeholder="Enter here"
                />
              </div> */}
              <div className={styles.filterField}>
                <label>Account name</label>
                <InputText
                  value={filterValues?.AccountName}
                  onChange={(e) =>
                    handleFilterChange("AccountName", e.target.value)
                  }
                  placeholder="Enter here"
                />
              </div>
              <div className={styles.filterField}>
                <label>Project Manager</label>
                <InputText
                  value={filterValues?.ProjectManager}
                  onChange={(e) =>
                    handleFilterChange("ProjectManager", e.target.value)
                  }
                  placeholder="Enter project manager name"
                />
              </div>

              <div className={`${styles.filterField} dropdown`}>
                <label>Approval status</label>
                <Dropdown
                  options={initialCRMProjectsListDropContainer?.projectStaus}
                  optionLabel="name"
                  placeholder="Select a status"
                  value={initialCRMProjectsListDropContainer?.projectStaus.find(
                    (item) => item.name === filterValues?.ProjectStatus,
                  )}
                  onChange={(e) =>
                    handleFilterChange("ProjectStatus", e.value?.name)
                  }
                />
              </div>
              <div className={`${styles.filterField} dropdown`}>
                <label>Project status</label>
                <Dropdown
                  options={initialCRMProjectsListDropContainer?.Status}
                  optionLabel="name"
                  placeholder="Select a status"
                  value={initialCRMProjectsListDropContainer?.Status.find(
                    (item) => item.name === filterValues?.Status,
                  )}
                  onChange={(e) => handleFilterChange("Status", e.value?.name)}
                />
              </div>
              <div className={`${styles.filterField} dropdown`}>
                <label>Billing model</label>
                <Dropdown
                  options={initialCRMProjectsListDropContainer?.BillingModel}
                  optionLabel="name"
                  placeholder="Select a billing model"
                  value={initialCRMProjectsListDropContainer?.BillingModel.find(
                    (item) => item.name === filterValues?.BillingModel,
                  )}
                  onChange={(e) =>
                    handleFilterChange("BillingModel", e.value?.name)
                  }
                />
              </div>
              <div className={`${styles.filterField} dropdown`}>
                <label>Upwork</label>
                <Dropdown
                  options={[
                    { label: "Yes", value: true },
                    { label: "No", value: false },
                  ]}
                  optionLabel="label"
                  placeholder="Select"
                  value={filterValues.Upwork}
                  onChange={(e) => handleFilterChange("Upwork", e.value)}
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
                      CustomerDisplayName: "",
                      AccountManager: "",
                      AccountName: "",
                      ProjectStatus: "",
                      Status: "",
                      BillingModel: "",
                      Upwork: "",
                      ProjectManager: "",
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
              value={projectDetails}
              paginator={projectDetails && projectDetails?.length > 8}
              rows={8}
              onRowClick={(e: any) => {
                setSelectedData(e.data);
                if (isEditable(e.data)) {
                  setFormMode("edit");
                } else {
                  setFormMode("view");
                }
                setCurrentPage("form");
                setLoader(true);
              }}
              emptyMessage={<p className={styles.noData}>No data !!!</p>}
            >
              <Column
                style={{ width: "8%" }}
                sortable
                field="ProjectID"
                header="Project id"
              />
              <Column
                style={{ width: "14%" }}
                sortable
                field="ProjectName"
                header="Project name"
              ></Column>
              <Column
                style={{ width: "11%" }}
                sortable
                field="ClientName"
                header="Account name"
              ></Column>
              {/* <Column
                style={{ width: "12%" }}
                sortable
                field="AccountManager"
                header="Account manager"
                body={renderAccountManagerColumn}
              ></Column> */}
              <Column
                style={{ width: "12%" }}
                sortable
                field="CustomerDisplayName"
                header="Client name"
              ></Column>
              <Column
                style={{ width: "12%" }}
                sortable
                field="ProjectManager"
                header="Project manager"
                body={renderManagersColumn}
              ></Column>
              <Column
                style={{ width: "10%" }}
                sortable
                field="DeliveryHead"
                header="Delivery head"
                body={renderDeliveryHeadsColumn}
              ></Column>
              {/* <Column
                sortable
                field="StartDate"
                header="Start date"
                body={(rowData) => {
                  return (
                    <div>
                      {rowData?.StartDate
                        ? moment(rowData?.StartDate).format("DD/MM/YYYY")
                        : ""}
                    </div>
                  );
                }}
              ></Column> */}
              {/* <Column
                sortable
                field="PlannedEndDate"
                header="End date"
                body={(rowData) => {
                  return (
                    <div>
                      {rowData?.PlannedEndDate
                        ? moment(rowData?.PlannedEndDate).format("DD/MM/YYYY")
                        : ""}
                    </div>
                  );
                }}
              ></Column> */}
              <Column
                style={{ width: "11%" }}
                sortable
                field="ProjectStatus"
                header="Approval status"
                body={(rowData) => renderStatus(rowData)}
              ></Column>
              <Column
                style={{ width: "10%" }}
                sortable
                field="Status"
                header="Project status"
              ></Column>
              <Column
                style={{ width: "10%" }}
                sortable
                field="BillingModel"
                header="Billing model"
              ></Column>
              <Column
                style={{ width: "8%" }}
                sortable
                field="UpWork"
                header="Upwork"
                body={UpworkTemplate}
              />
              {/* <Column sortable field="Budget" header="Budget"></Column>
              <Column sortable field="Hours" header="Hours"></Column>
              <Column sortable field="Currency" header="Currency"></Column> */}
              <Column
                field="Action"
                header="Actions"
                body={(rowData: IProjectData) => {
                  return (
                    <div className={styles.Actions}>
                      {isEditable(rowData) ? (
                        <>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedData(rowData);
                              setFormMode("edit");
                              setCurrentPage("form");
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
                      ) : (
                        ""
                      )}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setEventID(rowData?.ID);
                          setIsChangeLogOpen(true);
                        }}
                      >
                        <img
                          title="Audit Logs"
                          src={VersionHistoryImage}
                          alt="no image"
                        ></img>
                      </div>
                      {rowData?.ProjectStatus == "6" && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProjectFolder(
                              rowData,
                              props?.spfxContext,
                            );
                          }}
                        >
                          <img
                            title="Project Folder Structure"
                            src={FolderImage}
                            alt="no image"
                          />
                        </div>
                      )}
                      {(rowData?.ProjectStatus == "4" ||
                        rowData?.ProjectStatus == "5") && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCmtsLoader(true);
                            setIsCommentsModal({
                              isOpen: true,
                              Id: rowData?.ID,
                            });
                            getAllRejectComments(rowData?.ID);
                          }}
                        >
                          <img
                            title="Reject Comments"
                            src={commentsImage}
                            alt="no image"
                          ></img>
                        </div>
                      )}
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

      {currentPage === "form" && (
        <>
          <ProjectFormAndTabs
            loginUserEmail={props?.loginUserEmail}
            initialCRMProjectsListDropContainer={
              initialCRMProjectsListDropContainer
            }
            data={selectedData}
            setLoader={setLoader}
            isAdd={formMode === "add"}
            isEdit={formMode === "edit"}
            isView={formMode === "view"}
            goBack={() => setCurrentPage("list")}
            spfxContext={props.spfxContext}
            Notify={props.Notify}
            refresh={getProjectDetails}
            setCurrentPage={setCurrentPage}
          />
        </>
      )}
      {currentPage === "BillingList" && (
        <Billings
          data={selectedData}
          goBack={() => setCurrentPage("list")}
          goProjectFormPage={() => setCurrentPage("form")}
          spfxContext={props.spfxContext}
          Notify={props.Notify}
        />
      )}
      {currentPage == "DealSheet" && (
        <DealSheet
          data={selectedData}
          goProjectFormPage={() => setCurrentPage("form")}
          spfxContext={props.spfxContext}
          Notify={props.Notify}
        />
      )}
      <Modal isOpen={isDelModal.isOpen} styles={Config.delModalStyle}>
        <p className={styles.delmsg}>
          Are you sure, you want to delete this project?
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
      <ChangeLog
        context={props.spfxContext}
        handleClose={handleClose}
        isOpen={isChangeLogOpen}
        details={changeLogDetails}
      />

      <Dialog
        className="modal-template"
        header={
          <div className="modal-header">
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>Rejected Reasons</h3>
          </div>
        }
        draggable={false}
        blockScroll={false}
        resizable={false}
        visible={isCommentsModal.isOpen}
        style={{ width: "50%" }}
        onHide={() => {
          setIsCommentsModal({ isOpen: false, Id: null });
        }}
      >
        {isCmtsLoader ? (
          <div
            style={{
              width: "100%",
              height: "30vh",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Loading />
          </div>
        ) : (
          <div className={`template-table-content`}>
            <div
              className={`template-table-data`}
              style={{ padding: "0px 10px" }}
            >
              <DataTable
                value={rejectComments}
                tableStyle={{ width: "100%" }}
                stripedRows
                paginator
                rows={5}
                emptyMessage={
                  <>
                    <p style={{ textAlign: "center" }}>No Comments Found</p>
                  </>
                }
              >
                <Column
                  field="Reason"
                  header="Created by"
                  style={{ width: "33.3%" }}
                  body={(row: any) => peoplePickerTemplate(row?.reasonUser)}
                ></Column>
                <Column
                  field="Reason"
                  header="Date"
                  body={(row: any) => rejectReasonCreatedDate(row?.created)}
                  style={{ width: "33.3%" }}
                ></Column>
                <Column
                  field="reason"
                  header="Reason"
                  style={{ width: "33.3%" }}
                  body={(row: any) => textTemplate(row?.reason)}
                ></Column>
              </DataTable>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
};

export default Projects;
