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
import styles from "../CommonStyles/CommonStyle.module.scss";
import selfComponentStyles from "./Projects.module.scss";
import "../../../../External/CSS/Style.css";
import { useState } from "react";
import {
  DatePicker,
  IPersonaProps,
  Modal,
  NormalPeoplePicker,
  PrimaryButton,
} from "@fluentui/react";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import { Label } from "office-ui-fabric-react";
import { Dropdown } from "primereact/dropdown";
import { PeoplePicker } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import {
  Config,
  DatePickerStyles,
  peopleErrorPickerStyles,
  peoplePickerStyles,
} from "../../../../External/CommonServices/Config";
import SPServices from "../../../../External/CommonServices/SPServices";
import {
  IApproveModal,
  IBasicDropDown,
  IDelModal,
  IPeoplePickerDetails,
} from "../../../../External/CommonServices/interface";
import { sp } from "@pnp/sp";
import Billings from "../Billings/Billings";
import { InputTextarea } from "primereact/inputtextarea";
import { FileUpload } from "primereact/fileupload";
import Loading from "../../../../External/Loader/Loading";
import { Dialog } from "primereact/dialog";
import { Web } from "@pnp/sp/webs";

const ProjectFormPage = (props: any) => {
  // const TARGET_SITE_URL = "https://chandrudemo.sharepoint.com/sites/RupuTest";
  const TARGET_SITE_URL =
    "https://technorucs365.sharepoint.com/sites/FinanceActivityPlanner";

  //Local States:
  const [leadOptions, setLeadOptions] = useState<IBasicDropDown[]>([]);
  const [crDetails, setCrDetails] = useState({
    amount: 0,
    hours: "",
  });
  const [formData, setFormData] = useState<any>({});
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [files, setFiles] = useState<File[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<any[]>([]);
  const [loader, setLoader] = useState<boolean>(false);
  const [billingsData, setBillingsData] = useState<any[]>([]);
  const [billingsListData, setBillingsListData] = useState<any[]>([]);
  const [PMOusers, setPMOusers] = useState<IPeoplePickerDetails[]>([]);
  const [DHusers, setDHusers] = useState<IPeoplePickerDetails[]>([]);
  const [BAusers, setBAusers] = useState<IPeoplePickerDetails[]>([]);
  const [isApproval, setIsApproval] = useState<any>({
    boolean: false,
    id: null,
  });
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isDelModal, setIsDelModal] = React.useState<IApproveModal>({
    isOpen: false,
    Id: null,
    projectStatus: "",
  });
  const [isSendApproveModal, setIsSendApproveModal] = React.useState<IDelModal>(
    {
      isOpen: false,
      Id: null,
    },
  );

  //Data refresh and goBack mainPage function:
  const emptyDatas = () => {
    setFormData({
      ProjectID: "",
      AccountManager: "",
      AccountName: "",
      ProjectName: "",
      StartDate: null,
      PlannedEndDate: null,
      ProjectManager: [],
      DeliveryHead: [],
      BA: [],
      ProjectStatus: "0",
      BillingModel: "",
      Hours: "",
      Budget: "",
      ClientName: "",
      Currency: "",
      ProjectType: "",
      CustomerID: "",
      CustomerDisplayName: "",
      BillingContactName: "",
      BillingContactEmail: "",
      BillingContactMobile: "",
      BillingAddress: "",
      Remarks: "",
      Status: "",
      FPMProfit: "",
      FPMMargin: "",
      DealProfit: "",
      DealMargin: "",
    });
    props?.refresh();
    props?.goBack();
  };

  //Get Billings Data:
  const getBillingsAddDetails = (details: any) => {
    setBillingsData(details);
  };

  //GetLeads List Data Only FirstName And ID:
  const getLeads = () => {
    SPServices.getSPGroupMember({
      GroupName: Config.GroupNames.Leads,
    })
      .then((res: any) => {
        const leads: IBasicDropDown[] = res.map((user: any) => ({
          id: user?.Id,
          name: user?.Title,
        }));
        setLeadOptions(leads);
        getPMOGroupUsers();
        getDHGroupMembers();
        getBAGroupUsers();
        getBillingsListDetails();
        getCustomerDisplayName();
        getChangeRequestDetails();
        props?.setLoader(false);
      })
      .catch((err) => {
        console.log("Error fetching Leads group members:", err);
      });
  };

  const getCustomerDisplayName = async () => {
    try {
      const web = Web(TARGET_SITE_URL);
      const res = await web.lists
        .getByTitle("Customer")
        .items.select(
          "Id",
          "Customerdisplayname",
          "Firstname",
          "Emailaddress",
          "Address1",
        )
        .getAll();

      setCustomers(res);
    } catch (err) {
      console.error("Cross site fetch error", err);
    }
  };

  const getChangeRequestDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames?.CRMProjectCRs,
      Select: "*",
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
          FilterValue: `${props?.data?.ID}`,
        },
        {
          FilterKey: "BillingImpact",
          Operator: "eq",
          FilterValue: "Yes",
        },
      ],
    })
      .then((res: any) => {
        let totalAmount = 0;
        let totalHours = 0;
        let totalMinutes = 0;

        res?.forEach((item: any) => {
          totalAmount += Number(item?.BillingDetailsAmount || 0);
          const costImpact = item?.CostImpact?.toString() || "0";
          if (costImpact.includes(":")) {
            const [h, m] = costImpact.split(":");
            totalHours += Number(h || 0);
            totalMinutes += Number(m || 0);
          } else {
            totalHours += Number(costImpact || 0);
          }
        });
        // convert extra minutes → hours
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes = totalMinutes % 60;

        setCrDetails({
          amount: totalAmount,
          hours: `${totalHours}:${totalMinutes.toString().padStart(2, "0")}`,
        });
      })
      .catch((err) => {
        console.error(
          err,
          "Error fetching change request details in projects form page",
        );
      });
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

  //Get DH Group members:
  const getDHGroupMembers = () => {
    SPServices.getSPGroupMember({
      GroupName: Config.GroupNames.DH,
    })
      .then((res) => {
        const tempDHusers: IPeoplePickerDetails[] = [];
        res.forEach((items: any) => {
          tempDHusers.push({
            id: items?.Id,
            email: items?.Email,
            name: items?.Title,
          });
        });
        setDHusers([...tempDHusers]);
      })
      .catch((err) => {
        console.log(err, "Get DH group users errro in projectsFormPage.tsx");
      });
  };

  //Get BA Group members:
  const getBAGroupUsers = () => {
    SPServices.getSPGroupMember({
      GroupName: Config.GroupNames.BA,
    })
      .then((res) => {
        const tempBAusers: IPeoplePickerDetails[] = [];
        res.forEach((items: any) => {
          tempBAusers.push({
            id: items?.Id,
            email: items?.Email,
            name: items?.Title,
          });
        });
        setBAusers([...tempBAusers]);
      })
      .catch((err) => {
        console.log(err, "Get BA group users errro in projectsFormPage.tsx");
      });
  };

  //Get Billings List Details:
  const getBillingsListDetails = () => {
    if (props?.isEdit && props?.data?.ID) {
      SPServices.SPReadItems({
        Listname: Config.ListNames.CRMBillings,
        Select: "*",
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
            FilterValue: props?.data?.ID,
          },
        ],
      })
        .then(async (res: any[]) => {
          setBillingsListData(res);
        })
        .catch((err) => {
          console.error("Error fetching CRMBillings:", err);
        });
    }
  };

  // When binding to PeoplePicker convert into PersonaProps
  const onFilterChanged = (filterText: string): IPersonaProps[] => {
    let filtered = DHusers;
    if (filterText) {
      filtered = DHusers.filter(
        (u) =>
          u.name.toLowerCase().includes(filterText.toLowerCase()) ||
          u.email.toLowerCase().includes(filterText.toLowerCase()),
      );
    }
    return filtered.map((u) => ({
      key: u.id,
      text: u.name,
      secondaryText: u.email,
    }));
  };

  // When binding to PeoplePicker BA users convert into PersonaProps
  const onFilterChangedBA = (filterText: string): IPersonaProps[] => {
    let filtered = BAusers;
    if (filterText) {
      filtered = BAusers.filter(
        (u) =>
          u.name.toLowerCase().includes(filterText.toLowerCase()) ||
          u.email.toLowerCase().includes(filterText.toLowerCase()),
      );
    }
    return filtered.map((u) => ({
      key: u.id,
      text: u.name,
      secondaryText: u.email,
    }));
  };

  // Convert saved value to PersonaProps
  const mapToPersona = (user: any): IPersonaProps => ({
    key: user.id,
    text: user.name,
    secondaryText: user.email,
  });

  //Set default user in peoplepicker:
  const getSelectedEmails = (
    selectedUsers: IPeoplePickerDetails[],
    fallbackUsers: any[],
  ) => {
    let selectedEmails: string[] = [];
    if (selectedUsers?.length) {
      selectedUsers.forEach((user: IPeoplePickerDetails) => {
        selectedEmails.push(user?.email);
      });
    } else if (fallbackUsers?.length) {
      // formData?.ProjectManager case (secondaryText contains email)
      fallbackUsers.forEach((user: any) => {
        if (user?.secondaryText) {
          selectedEmails.push(user.secondaryText);
        }
      });
    }

    return selectedEmails;
  };

  //handleOnChange function:
  const handleOnChange = (field: string, value: any) => {
    setFormData((prevData: any) => ({
      ...prevData,
      [field]: value,
    }));
    // Remove the error once user starts typing
    setErrorMessage((prevErrors) => ({
      ...prevErrors,
      [field]: !isValidField(field, value),
    }));
  };

  //RowData is once comming then data set to the state:
  React.useEffect(() => {
    if (props?.data && leadOptions.length > 0) {
      setFormData((prev: any) => {
        const newForm = { ...props.data };
        if (
          props.data?.AccountManager &&
          typeof props?.data?.AccountManager === "string"
        ) {
          const matchedLead = leadOptions.find(
            (x) => x.name === props?.data?.AccountManager,
          );
          if (matchedLead) {
            newForm.AccountManager = matchedLead;
          }
        }
        return newForm;
      });
      LoadExistingFiles(props?.data?.ID);
    }
  }, [props?.data, leadOptions]);

  //Set selected customer when customers data or formData changes:
  React.useEffect(() => {
    if (customers?.length && formData?.CustomerDisplayName) {
      const matchedCustomer = customers.find(
        (c) => c.Customerdisplayname === formData.CustomerDisplayName,
      );

      if (matchedCustomer) {
        setSelectedCustomer(matchedCustomer);
      }
    }
  }, [customers, formData?.CustomerDisplayName]);

  //LoadExistingFiles in Library:
  const LoadExistingFiles = async (id: number) => {
    const projectId = `${id}`;
    sp.web.lists
      .getByTitle(Config.LibraryNames?.ProjectFiles)
      .items.select(
        "*,FileLeafRef,FileRef,FileDirRef,Author/Id,Author/Title,Author/EMail",
      )
      .filter(`project eq '${projectId}' and IsDelete eq false`)
      .expand("File,Author")
      .orderBy("Modified", false)
      .get()
      .then((res: any) => {
        let tempData: any = [];
        if (res?.length) {
          res?.forEach((val: any) => {
            tempData.push({
              name: val?.File?.Name || "",
              ulr: val?.File?.ServerRelativeUrl || "",
              createdDate: val?.Created ? new Date(val?.Created) : null,
              authorEmail: val?.Author?.EMail || "",
            });
          });
        }
        setFiles([...tempData]);
      })
      .catch((err: any) => {
        console.log(
          err,
          "Get existing files data error in ProjectsFormPage.tsx component",
        );
      });
  };

  //Validations:
  const isValidField = (field: string, value: any): boolean => {
    switch (field) {
      case "ProjectManager":
        return value && value.length > 0;

      case "DeliveryHead":
        return value && value.length > 0;
      case "ProjectStatus":
      case "BillingModel":
      case "Currency":
      case "Budget":
      case "ProjectName":
      case "BillingContactName":
        return value && typeof value === "string" && value.trim() !== "";

      case "Hours":
        if (value) {
          const regex = /^([0-9]+)(:[0-9]{1,2})?$/;
          const match = value.match(regex);
          if (match) {
            const parts = value.split(":");
            if (parts.length === 2) {
              const minutes = Number(parts[1]);
              return minutes >= 0 && minutes < 60;
            }
            return true;
          }
        }
        return false;

      case "BillingContactEmail": {
        // Email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return value && typeof value === "string" && emailRegex.test(value);
      }

      case "StartDate":
      case "PlannedEndDate":
        return value !== null && value !== undefined;

      default:
        return true;
    }
  };

  const Validation = () => {
    let errors: { [key: string]: boolean } = {};

    if (!isValidField("ProjectManager", formData?.ProjectManager))
      errors.ProjectManager = true;
    if (!isValidField("DeliveryHead", formData?.DeliveryHead))
      errors.DeliveryHead = true;
    if (!isValidField("Budget", formData?.Budget)) errors.Budget = true;
    if (!isValidField("ProjectName", formData?.ProjectName))
      errors.ProjectName = true;
    if (!isValidField("StartDate", formData?.StartDate))
      errors.StartDate = true;
    if (!isValidField("PlannedEndDate", formData?.PlannedEndDate))
      errors.PlannedEndDate = true;
    if (!isValidField("ProjectStatus", formData?.ProjectStatus))
      errors.ProjectStatus = true;
    if (!isValidField("BillingModel", formData?.BillingModel))
      errors.BillingModel = true;
    if (!isValidField("Currency", formData?.Currency)) errors.Currency = true;
    if (!isValidField("BillingContactName", formData?.BillingContactName))
      errors.BillingContactName = true;
    if (!isValidField("BillingContactEmail", formData?.BillingContactEmail))
      errors.BillingContactEmail = true;
    if (!isValidField("Hours", formData?.Hours)) errors.Hours = true;

    //Start/End Date validation
    if (formData?.StartDate && formData?.PlannedEndDate) {
      const start = formData.StartDate;
      const end = formData.PlannedEndDate;
      if (end < start) {
        props.Notify(
          "error",
          "Validation Error",
          "Planned End Date cannot be later than Start Date!",
        );
        errors.PlannedEndDate = true;
      }
    }

    //Set all field errors
    setErrorMessage(errors);

    if (Object.keys(errors).length > 0) return;

    if (
      formData?.BillingModel !== "" &&
      (!billingsListData || billingsListData.length === 0) &&
      (billingsData.length === 0 || !billingsData)
    ) {
      props.Notify(
        "error",
        "Validation Error",
        "Please add at least one billing entry before saving!",
      );
      return; // stop save
    }

    //All validations passed
    generateJson();
  };

  //Json Generations:
  const generateJson = () => {
    setLoader(true);
    let ProjectManagerIds: number[] = JSON.parse(
      JSON.stringify(formData?.ProjectManager),
    )
      .map((user: IPeoplePickerDetails) => user.id)
      .sort((a: any, b: any) => a - b);
    let DeliveryHeadIds: number[] = JSON.parse(
      JSON.stringify(formData?.DeliveryHead),
    )
      .map((user: any) => (user.id ? user?.id : user?.key))
      .sort((a: any, b: any) => a - b);

    let BAIds: number[] = JSON.parse(JSON.stringify(formData?.BA))
      .map((user: any) => (user.id ? user?.id : user?.key))
      .sort((a: any, b: any) => a - b);

    let json: any = {
      ProjectID: formData?.ProjectID,
      AccountManager: formData?.AccountManager?.name,
      // AccountName: formData?.AccountName,
      ClientName: formData?.ClientName || "",
      ProjectName: formData?.ProjectName || "",
      StartDate: SPServices.GetDateFormat(formData?.StartDate),
      PlannedEndDate: SPServices.GetDateFormat(formData?.PlannedEndDate),
      ProjectManagerId: { results: ProjectManagerIds },
      DeliveryHeadId: { results: DeliveryHeadIds },
      BAId: { results: BAIds },
      ProjectStatus:
        formData?.ProjectStatus == "0"
          ? "1"
          : Config.projectStatusReverseMap[formData?.ProjectStatus] ||
            formData?.ProjectStatus,
      BillingModel: formData?.BillingModel,
      Status: formData?.Status || "",
      Budget: formData?.Budget,
      Hours: formData?.Hours,
      ProjectType: formData?.ProjectType || "",
      CustomerID: formData?.CustomerID,
      CustomerDisplayName: formData?.CustomerDisplayName,
      Currency: formData?.Currency,
      UpWork: formData?.UpWork,
      BillingContactName: formData?.BillingContactName || "",
      BillingContactEmail: formData?.BillingContactEmail || "",
      BillingContactMobile: formData?.BillingContactMobile,
      BillingAddress: formData?.BillingAddress || "",
      Remarks: formData?.Remarks,
      FPMProfit: formData?.FPMProfit ? formData?.FPMProfit : null,
      FPMMargin: formData?.FPMMargin ? formData?.FPMMargin : null,
      DealProfit: formData?.DealProfit ? formData?.DealProfit : null,
      DealMargin: formData?.DealMargin ? formData?.DealMargin : null,
    };
    if (props?.isEdit) {
      handleUpdate(json);
    } else {
      generateProjectId(json);
    }
  };

  //Update Datas to CRMProjects List:
  const handleUpdate = async (json: any) => {
    try {
      // 1. Update CRMProjects main item
      await SPServices.SPUpdateItem({
        Listname: Config.ListNames.CRMProjects,
        RequestJSON: json,
        ID: formData?.ID,
      });

      // 2. Commit deletes in ProjectFiles library
      if (deletedFiles.length > 0) {
        for (const file of deletedFiles) {
          const items = await sp.web.lists
            .getByTitle(Config.LibraryNames?.ProjectFiles)
            .items.filter(`FileLeafRef eq '${file.name}'`)
            .select("Id", "FileLeafRef")
            .get();

          if (items.length > 0) {
            const itemId = items[0].Id;
            await sp.web.lists
              .getByTitle(Config.LibraryNames?.ProjectFiles)
              .items.getById(itemId)
              .update({
                IsDelete: true,
              });
          }
        }
        setDeletedFiles([]);
      }

      // 3. Add new files to library
      if (files?.length > 0) {
        // filter new files only
        const newFiles = files.filter((f: any) => f.objectURL);

        if (newFiles.length > 0) {
          await addAttachmentsInLibrary(formData?.ID, newFiles);
        }
      }

      props.Notify("success", "Success", "Project updated successfully");
      setLoader(false);
      emptyDatas();
      setIsApproval({
        boolean: true,
        id: formData?.ID,
      });
      sessionStorage.removeItem("billingsData");
    } catch (err) {
      console.log(
        err,
        "Update Datas to CRMProjects err in ProjectsFormPage.tsx component",
      );
    }
  };

  //handle approval process:
  const handleApprovalFunc = async () => {
    try {
      const currObj = {
        ProjectStatus: "2",
      };

      // 1. Update main item
      await SPServices.SPUpdateItem({
        ID: formData?.ID ? formData?.ID : isApproval?.id,
        Listname: Config.ListNames.CRMProjects,
        RequestJSON: currObj,
      });

      // 2. Commit deletes in ProjectFiles library
      if (deletedFiles.length > 0) {
        for (const file of deletedFiles) {
          const items: any = await sp.web.lists
            .getByTitle(Config.LibraryNames?.ProjectFiles)
            .items.filter(`FileLeafRef eq '${file.name}'`)
            .select("Id", "FileLeafRef")
            .get();

          if (items.length > 0) {
            const itemId = items[0].Id;

            await sp.web.lists
              .getByTitle(Config.LibraryNames?.ProjectFiles)
              .items.getById(itemId)
              .update({
                IsDelete: true,
              });
          }
        }

        setDeletedFiles([]);
      }

      // 3. Add new files to library
      if (files?.length > 0) {
        const newFiles = files.filter((f: any) => f.objectURL);

        if (newFiles.length > 0) {
          await addAttachmentsInLibrary(formData?.ID, newFiles);
        }
      }

      props.Notify("success", "Success", "Approval sent successfully");

      setIsApproval({
        boolean: false,
        id: null,
      });

      emptyDatas();
    } catch (err) {
      console.log(err, "Approval send err in projects.tsx component");
    }
  };

  //Generate ProjectId:
  const generateProjectId = (json: any) => {
    sp.web.lists
      .getByTitle(Config.ListNames.CRMProjects)
      .items.orderBy("ID", false)
      .top(1)
      .get()
      .then((res: any) => {
        let format: string = "PRJ-";
        let lastId = res[0]?.ProjectID || "";
        let newId = SPServices.GenerateFormatId(format, lastId, 3);
        // ----- CustomerID Logic -----
        let lastCustomerId = res[0]?.CustomerID;
        let newCustomerId = lastCustomerId ? lastCustomerId + 1 : 1;
        handleAdd({ ...json, ProjectID: newId, CustomerID: newCustomerId });
      })
      .catch((err: any) =>
        console.log(
          err,
          "getDetails from CRMPojects err in ProjectsFormPage.tsx component",
        ),
      );
  };

  //Add datas to CRMProjects List:
  const handleAdd = async (json: any) => {
    try {
      const createItem: any = await SPServices.SPAddItem({
        Listname: Config.ListNames.CRMProjects,
        RequestJSON: json,
      });

      const projectId = createItem?.data?.ID;

      // 1. If files available → wait until uploaded
      if (files?.length > 0) {
        await addAttachmentsInLibrary(projectId, files);
      }

      // 2. Billings add logic
      if (billingsData?.length > 0 && projectId && props?.isAdd) {
        for (const bill of billingsData) {
          const billingJson = {
            ...bill,
            ID: null,
            ProjectId: projectId,
          };
          try {
            await SPServices.SPAddItem({
              Listname: Config.ListNames.CRMBillings,
              RequestJSON: billingJson,
            });
            setIsApproval({
              boolean: true,
              id: projectId,
            });
            sessionStorage.removeItem("billingsData");
          } catch (err) {
            console.error("Error adding billing:", err);
          }
        }
      }

      // 3. Success notify
      props.Notify(
        "success",
        "Success",
        billingsData?.length > 0 &&
          PMOusers?.some(
            (user) =>
              user?.email?.toLowerCase() ===
              props?.loginUserEmail?.toLowerCase(),
          )
          ? "project added successfully"
          : props?.isAdd
            ? "Project added successfully"
            : "",
      );

      // 4. Reset approval + cleanup
      setIsApproval({
        boolean: true,
        id: projectId,
      });
      sessionStorage.removeItem("billingsData");
      setLoader(false);
      emptyDatas();
    } catch (err) {
      console.log(
        err,
        "Add Datas to CRMProjects err in ProjectsFormPage.tsx component",
      );
    }
  };

  //Add attachment to library:
  const addAttachmentsInLibrary = async (
    ProjectID: number,
    uploadFiles: File[],
  ) => {
    debugger;
    try {
      for (const file of uploadFiles) {
        const fileBuffer = await file.arrayBuffer();

        const uploadResult = await sp.web
          .getFolderByServerRelativeUrl(Config.LibraryNames?.ProjectFiles)
          .files.add(file.name, fileBuffer, true);

        const item = await uploadResult.file.listItemAllFields.get();

        await sp.web.lists
          .getByTitle(Config.LibraryNames?.ProjectFiles)
          .items.getById(item.Id)
          .update({
            projectId: ProjectID,
          });
      }
      setFiles([]);
    } catch (error) {
      console.error("Error uploading project files:", error);
    }
  };

  //Project manager status updated funtions :
  const handleStatusUpdate = async (status: string) => {
    try {
      const currentJson = {
        ProjectStatus: status,
      };

      // 1. Update main item
      await SPServices.SPUpdateItem({
        Listname: Config.ListNames.CRMProjects,
        ID: formData?.ID,
        RequestJSON: currentJson,
      });

      // 2. Set success message
      let message = "";
      if (status === "6") {
        message = "Project Approved Successfully";
      } else if (status === "3") {
        message = "Project Updated Successfully!";
      } else if (status === "4" || status === "5") {
        message = "Project Rejected Successfully";
      } else {
        message = "Project Updated Successfully";
      }

      // 3. Commit deletes in ProjectFiles library
      if (deletedFiles.length > 0) {
        for (const file of deletedFiles) {
          const items: any = await sp.web.lists
            .getByTitle(Config.LibraryNames?.ProjectFiles)
            .items.filter(`FileLeafRef eq '${file.name}'`)
            .select("Id", "FileLeafRef")
            .get();

          if (items.length > 0) {
            const itemId = items[0].Id;
            await sp.web.lists
              .getByTitle(Config.LibraryNames?.ProjectFiles)
              .items.getById(itemId)
              .update({
                IsDelete: true,
              });
          }
        }

        setDeletedFiles([]);
      }

      // 4. Add new files (Project Manager only)
      if (isProjectManager) {
        debugger;
        if (files?.length > 0) {
          const newFiles = files.filter((f: any) => f.objectURL);

          if (newFiles.length > 0) {
            await addAttachmentsInLibrary(formData?.ID, newFiles);
          }
        }
      }

      // 5. Show success toast
      props.Notify("success", "Success", message);
      emptyDatas();
    } catch (err) {
      console.error(`Error updating project to ${status}:`, err);
    }
  };

  //handle file selection:
  const handleFileSelection = async (
    e: any,
    files: any,
    setFiles: any,
    Config: any,
  ) => {
    try {
      const allowedExtensions = [
        "pdf",
        "doc",
        "docx",
        "jpg",
        "jpeg",
        "png",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
      ];

      const maxSingleFileSize = 15 * 1024 * 1024; // 15 MB per file
      const maxTotalSize = 25 * 1024 * 1024; // 25 MB total

      const selectedFiles = e.files;

      let totalSize = files.reduce((sum: any, f: any) => sum + f.size, 0);

      // Validate file extensions
      const invalidFiles = selectedFiles.filter((file: any) => {
        const ext = file.name.split(".").pop().toLowerCase();
        return !allowedExtensions.includes(ext);
      });

      if (invalidFiles.length > 0) {
        props.Notify(
          "warn",
          "Invalid File Type",
          "Only PDF, Word, Excel, PPT, JPG and PNG files are allowed!",
        );
        return;
      }

      // Check per-file limit
      for (const file of selectedFiles) {
        if (file.size > maxSingleFileSize) {
          props.Notify(
            "error",
            "Large File",
            `${file.name} exceeds the 15 MB single file limit!`,
          );
          return;
        }
      }

      // Calculate total size
      const newFilesTotal = selectedFiles.reduce(
        (sum: any, f: any) => sum + f.size,
        0,
      );

      if (totalSize + newFilesTotal > maxTotalSize) {
        props.Notify(
          "error",
          "Total Size Exceeded",
          `Total file size cannot exceed 25 MB!`,
        );
        return;
      }

      // Check duplicates inside current state
      const duplicatesInState = selectedFiles.filter((newFile: any) =>
        files.some((existing: any) => existing.name === newFile.name),
      );

      const newFiles = selectedFiles.filter(
        (newFile: any) =>
          !files.some((existing: any) => existing.name === newFile.name),
      );

      if (duplicatesInState.length > 0) {
        props.Notify(
          "info",
          "Duplicate Files",
          "Some file names already exist!",
        );
      }

      // Add new files
      if (newFiles.length > 0) {
        setFiles([...files, ...newFiles]);
      }
    } catch (error) {
      console.error("Error in file selection:", error);
    }
  };

  //DownLoad File Function:
  const downloadFile = (file: any) => {
    const anchortag = document.createElement("a");
    anchortag.setAttribute("href", file?.ulr ? file?.ulr : file?.objectURL);
    anchortag.setAttribute("target", "_blank");
    anchortag.setAttribute("download", "");
    anchortag.click();
    anchortag.remove();
  };

  // Temporary Remove File (state only):
  const removeFile = (fileName: string) => {
    // Find the file that was removed
    const removedFile = files.find((file) => file.name === fileName);

    if (removedFile) {
      setDeletedFiles((prev) => [...prev, removedFile]); // keep track of removed
    }

    // Remove from current UI state
    const updatedFiles = files.filter((file) => file.name !== fileName);
    setFiles(updatedFiles);
  };

  // Handle Reject Dialog Hide with Reason:
  const handleRejectWithReason = () => {
    if (rejectReason.trim() === "") {
      props.Notify("error", "Error", "Please enter a reason for rejection");
    } else {
      const json = {
        Reason: rejectReason,
        ProjectId: props?.data?.ID,
      };

      SPServices.SPAddItem({
        Listname: Config.ListNames.RejectComments,
        RequestJSON: json,
      })
        .then(() => {
          if (isProjectManager) {
            handleStatusUpdate("4");
          } else {
            handleStatusUpdate("5");
          }
          setRejectReason("");
          setShowRejectDialog(false);
        })
        .catch((err) => {
          console.log(err, "Error in adding reject reason");
        });
    }
  };

  //Check user is PMO,BA,Project Manager and Delivery Head:
  const isPMOUser = PMOusers?.some(
    (user) =>
      user?.email?.toLowerCase() === props?.loginUserEmail?.toLowerCase(),
  );

  const isBA = BAusers?.some(
    (user) =>
      user?.email?.toLowerCase() === props?.loginUserEmail?.toLowerCase(),
  );

  const isProjectManager = formData?.ProjectManager?.some(
    (pm: IPeoplePickerDetails) =>
      pm?.email?.toLowerCase() === props?.loginUserEmail?.toLowerCase(),
  );

  const isDeliveryHead = formData?.DeliveryHead?.some(
    (user: IPeoplePickerDetails) =>
      user?.email?.toLowerCase() === props?.loginUserEmail?.toLowerCase(),
  );

  //Initial Render:
  React.useEffect(() => {
    getLeads();
    if (!props?.data) {
      setFormData({
        ProjectID: "",
        AccountManager: "",
        AccountName: "",
        ProjectName: "",
        StartDate: null,
        PlannedEndDate: null,
        ProjectManager: [],
        DeliveryHead: [],
        BA: [],
        ProjectStatus: "0",
        BillingModel: "",
        UpWork: false,
        ProjectType: "",
        Hours: "",
        Budget: "",
        ClientName: "",
        Currency: "",
        CustomerID: "",
        Status: "",
        CustomerDisplayName: "",
        BillingContactName: "",
        BillingContactEmail: "",
        BillingContactMobile: "",
        BillingAddress: "",
        Remarks: "",
        FPMProfit: "",
        FPMMargin: "",
        DealProfit: "",
        DealMargin: "",
      });
    }
  }, []);

  return (
    <>
      {loader ? (
        <Loading />
      ) : (
        <div style={{ overflow: "auto" }} className={styles.viewFormMain}>
          <div className={styles.viewFormNavBar}>
            <div className={styles.backButton} onClick={() => props?.goBack()}>
              <img
                src={require("../../../../External/Images/back.png")}
                alt="no image"
              ></img>
            </div>
            <h2>
              {props?.isAdd
                ? "Add project"
                : props?.isEdit
                  ? "Edit project"
                  : "View project"}
            </h2>
          </div>
          <div
            style={{ height: "auto" }}
            className={selfComponentStyles.formPage}
          >
            <div className={selfComponentStyles.fieldWraps}>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Project id</Label>
                <InputText
                  onChange={(e) => handleOnChange("ProjectID", e.target.value)}
                  value={
                    props?.isView || props?.isEdit
                      ? formData?.ProjectID
                      : "Auto generate"
                  }
                  disabled
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Project name</Label>
                <InputText
                  onChange={(e) =>
                    handleOnChange("ProjectName", e.target.value)
                  }
                  value={formData?.ProjectName}
                  disabled={
                    props?.isView ||
                    // isProjectManager ||
                    (isProjectManager && !isPMOUser) ||
                    (isDeliveryHead && !isPMOUser) ||
                    props?.data?.ProjectStatus == "6"
                  }
                  style={
                    errorMessage["ProjectName"]
                      ? { border: "2px solid #ff0000" }
                      : undefined
                  }
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Account name</Label>
                <InputText
                  onChange={(e) => handleOnChange("ClientName", e.target.value)}
                  value={formData?.ClientName}
                  disabled={
                    props?.isView ||
                    (isProjectManager && !isPMOUser) ||
                    (isDeliveryHead && !isPMOUser) ||
                    props?.data?.ProjectStatus == "6"
                  }
                  // style={
                  //   errorMessage["AccountName"]
                  //     ? { border: "2px solid #ff0000" }
                  //     : undefined
                  // }
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Client Name</Label>
                {/* <InputText
                  onChange={(e) =>
                    handleOnChange("CustomerDisplayName", e.target.value)
                  }
                  value={formData?.CustomerDisplayName}
                  disabled={
                    props?.isView ||
                    // isProjectManager ||
                    (isProjectManager && !isPMOUser) ||
                    (isDeliveryHead && !isPMOUser) ||
                    props?.data?.ProjectStatus == "6"
                  }
                /> */}
                <Dropdown
                  value={selectedCustomer}
                  options={customers}
                  optionLabel="Customerdisplayname"
                  filter
                  filterPlaceholder="Search customer"
                  placeholder="Select Customer"
                  className="w-full"
                  onChange={(e) => {
                    const customer = e.value;
                    setSelectedCustomer(customer);

                    handleOnChange(
                      "CustomerDisplayName",
                      customer.Customerdisplayname,
                    );
                    handleOnChange("BillingContactName", customer?.Firstname);
                    handleOnChange(
                      "BillingContactEmail",
                      customer?.Emailaddress,
                    );
                    handleOnChange("AccountName", customer.Customerdisplayname);
                    handleOnChange("BillingAddress", customer.Address1);
                  }}
                  disabled={
                    props?.isView ||
                    (isProjectManager && !isPMOUser) ||
                    (isDeliveryHead && !isPMOUser) ||
                    props?.data?.ProjectStatus == "6"
                  }
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Account manager</Label>
                <Dropdown
                  value={formData?.AccountManager}
                  options={leadOptions}
                  optionLabel="name"
                  onChange={(e) => handleOnChange("AccountManager", e.value)}
                  disabled={
                    props?.isView ||
                    // isProjectManager ||
                    (isProjectManager && !isPMOUser) ||
                    (isDeliveryHead && !isPMOUser) ||
                    props?.data?.ProjectStatus == "6"
                  }
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Project manager</Label>
                <div
                  className={`${selfComponentStyles.textField} ${selfComponentStyles.peoplePicker}`}
                >
                  <PeoplePicker
                    styles={
                      errorMessage["ProjectManager"]
                        ? peopleErrorPickerStyles
                        : peoplePickerStyles
                    }
                    ensureUser
                    placeholder="Select the Person"
                    personSelectionLimit={1}
                    context={props.spfxContext}
                    defaultSelectedUsers={getSelectedEmails(
                      props?.data?.ProjectManager,
                      formData?.ProjectManager,
                    )}
                    webAbsoluteUrl={
                      props?.spfxContext._pageContext._web.absoluteUrl
                    }
                    resolveDelay={100}
                    onChange={(items: any[]) =>
                      handleOnChange("ProjectManager", items)
                    }
                    disabled={
                      props?.isView ||
                      // isProjectManager ||
                      (isProjectManager && !isPMOUser) ||
                      (isDeliveryHead && !isPMOUser) ||
                      props?.data?.ProjectStatus == "6"
                    }
                  />
                </div>
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Delivery head</Label>
                <div
                  className={`${selfComponentStyles.textField} ${selfComponentStyles.peoplePicker}`}
                >
                  <NormalPeoplePicker
                    styles={{
                      root: {
                        border: errorMessage["DeliveryHead"]
                          ? "2px solid #ff0000"
                          : "1px solid #d9d9d9",
                        borderRadius: "6px",
                      },
                    }}
                    inputProps={{ placeholder: "Select the person" }}
                    onResolveSuggestions={onFilterChanged}
                    pickerSuggestionsProps={{
                      suggestionsHeaderText: "DH Group Members",
                      noResultsFoundText: "No DH member found",
                    }}
                    itemLimit={1}
                    selectedItems={
                      formData?.DeliveryHead
                        ? formData?.DeliveryHead.map((u: any) =>
                            mapToPersona(u),
                          )
                        : []
                    }
                    onChange={(items: IPersonaProps[]) => {
                      const mapped = items.map((i) => ({
                        id: i.key,
                        name: i.text,
                        email: i.secondaryText,
                      }));
                      setFormData({
                        ...formData,
                        DeliveryHead: mapped,
                      });

                      // Clear error if user selected a value
                      if (mapped.length > 0) {
                        setErrorMessage((prev: any) => ({
                          ...prev,
                          DeliveryHead: "",
                        }));
                      }
                    }}
                    disabled={
                      props?.isView ||
                      // isProjectManager ||
                      (isProjectManager && !isPMOUser) ||
                      (isDeliveryHead && !isPMOUser) ||
                      props?.data?.ProjectStatus == "6"
                    }
                  />
                </div>
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>APM/BA</Label>
                <div
                  className={`${selfComponentStyles.textField} ${selfComponentStyles.peoplePicker}`}
                >
                  <NormalPeoplePicker
                    onResolveSuggestions={onFilterChangedBA}
                    inputProps={{ placeholder: "Select the person" }}
                    pickerSuggestionsProps={{
                      suggestionsHeaderText: "BA Group Members",
                      noResultsFoundText: "No BA member found",
                    }}
                    itemLimit={1}
                    selectedItems={
                      formData?.BA
                        ? formData?.BA.map((u: any) => mapToPersona(u))
                        : []
                    }
                    onChange={(items: IPersonaProps[]) => {
                      const mapped = items.map((i) => ({
                        id: i.key,
                        name: i.text,
                        email: i.secondaryText,
                      }));
                      setFormData({
                        ...formData,
                        BA: mapped,
                      });
                    }}
                    disabled={
                      props?.isView ||
                      (isProjectManager && !isPMOUser) ||
                      (isDeliveryHead && !isPMOUser)
                    }
                  />
                </div>
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Start date</Label>
                <DatePicker
                  value={
                    formData?.StartDate
                      ? new Date(formData.StartDate)
                      : undefined
                  }
                  styles={
                    errorMessage["StartDate"]
                      ? {
                          root: {
                            border: "2px solid #ff0000",
                            height: "35px",
                            borderRadius: "4px",
                          },
                        }
                      : DatePickerStyles
                  }
                  onSelectDate={(date) => {
                    handleOnChange("StartDate", date);
                  }}
                  disabled={
                    props?.isView ||
                    // isProjectManager ||
                    (isProjectManager && !isPMOUser) ||
                    (isDeliveryHead && !isPMOUser)
                  }
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>End date</Label>
                <DatePicker
                  value={
                    formData?.PlannedEndDate
                      ? new Date(formData?.PlannedEndDate)
                      : undefined
                  }
                  styles={
                    errorMessage["PlannedEndDate"]
                      ? {
                          root: {
                            border: "2px solid #ff0000",
                            height: "35px",
                            borderRadius: "4px",
                          },
                        }
                      : DatePickerStyles
                  }
                  onSelectDate={(date) => {
                    handleOnChange("PlannedEndDate", date);
                  }}
                  disabled={
                    props?.isView ||
                    // isProjectManager ||
                    (isProjectManager && !isPMOUser) ||
                    (isDeliveryHead && !isPMOUser)
                  }
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Approval status</Label>
                <Dropdown
                  options={
                    props?.initialCRMProjectsListDropContainer?.projectStaus
                  }
                  optionLabel="name"
                  value={props?.initialCRMProjectsListDropContainer?.projectStaus.find(
                    (item: any) =>
                      item.name ===
                      (Config.projectStatusMap[formData?.ProjectStatus] ||
                        formData?.ProjectStatus),
                  )}
                  onChange={(e) =>
                    handleOnChange("ProjectStatus", e?.value?.name)
                  }
                  disabled
                  style={
                    errorMessage["ProjectStatus"]
                      ? { border: "2px solid #ff0000", borderRadius: "4px" }
                      : undefined
                  }
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Billing model</Label>
                <Dropdown
                  options={
                    props?.initialCRMProjectsListDropContainer?.BillingModel
                  }
                  optionLabel="name"
                  value={props?.initialCRMProjectsListDropContainer?.BillingModel.find(
                    (item: any) => item.name === formData?.BillingModel,
                  )}
                  onChange={(e) =>
                    handleOnChange("BillingModel", e?.value?.name)
                  }
                  disabled={
                    props?.isView ||
                    billingsData?.length > 0 ||
                    billingsListData?.length > 0 ||
                    // isProjectManager ||
                    (isProjectManager && !isPMOUser) ||
                    (isDeliveryHead && !isPMOUser)
                  }
                  style={
                    errorMessage["BillingModel"]
                      ? { border: "2px solid #ff0000", borderRadius: "4px" }
                      : undefined
                  }
                />
              </div>
              {!isBA && (
                <div className={`${selfComponentStyles.allField} dealFormPage`}>
                  <Label>Budget</Label>
                  <InputText
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits
                      if (/^\d*$/.test(value)) {
                        handleOnChange("Budget", value);
                      }
                    }}
                    value={formData?.Budget}
                    disabled={
                      props?.isView ||
                      // isProjectManager ||
                      (isProjectManager && !isPMOUser) ||
                      (isDeliveryHead && !isPMOUser)
                    }
                    style={
                      errorMessage["Budget"]
                        ? { border: "2px solid #ff0000" }
                        : undefined
                    }
                  />
                </div>
              )}

              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Hours</Label>
                <InputText
                  value={formData?.Hours || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Allow only digits and colon
                    const regex = /^[0-9:]*$/;
                    if (regex.test(val)) {
                      handleOnChange("Hours", val);
                    }
                  }}
                  placeholder="Enter Hours (e.g. 90:20)"
                  style={
                    errorMessage["Hours"]
                      ? { border: "2px solid #ff0000" }
                      : undefined
                  }
                  disabled={
                    props?.isView ||
                    // isProjectManager ||
                    (isProjectManager && !isPMOUser) ||
                    (isDeliveryHead && !isPMOUser)
                  }
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>ProjectType</Label>
                <Dropdown
                  options={
                    props?.initialCRMProjectsListDropContainer?.ProjectType
                  }
                  optionLabel="name"
                  value={props?.initialCRMProjectsListDropContainer?.ProjectType.find(
                    (item: any) => item.name === formData?.ProjectType,
                  )}
                  onChange={(e) =>
                    handleOnChange("ProjectType", e?.value?.name)
                  }
                  disabled={
                    props?.isView ||
                    (isProjectManager && !isPMOUser) ||
                    (isDeliveryHead && !isPMOUser) ||
                    props?.data?.ProjectStatus == "6"
                  }
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Currency</Label>
                <Dropdown
                  options={props?.initialCRMProjectsListDropContainer?.Currency}
                  optionLabel="name"
                  value={props?.initialCRMProjectsListDropContainer?.Currency.find(
                    (item: any) => item.name === formData?.Currency,
                  )}
                  onChange={(e) => handleOnChange("Currency", e?.value?.name)}
                  disabled={
                    props?.isView ||
                    // isProjectManager ||
                    (isProjectManager && !isPMOUser) ||
                    (isDeliveryHead && !isPMOUser) ||
                    props?.data?.ProjectStatus == "6"
                  }
                  style={
                    errorMessage["Currency"]
                      ? { border: "2px solid #ff0000", borderRadius: "4px" }
                      : undefined
                  }
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Billing contact name</Label>
                <InputText value={formData?.BillingContactName} disabled />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Billing contact email</Label>
                <InputText
                  value={formData?.BillingContactEmail}
                  disabled
                  placeholder="e.g., abc@gmail.com"
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Billing contact mobile</Label>
                <InputText
                  keyfilter="int"
                  onChange={(e) => {
                    const value = e.target.value;
                    // allow only digits, and restrict length between 2–16
                    if (/^\d{0,16}$/.test(value)) {
                      handleOnChange("BillingContactMobile", value);
                    }
                  }}
                  value={formData?.BillingContactMobile}
                  disabled={
                    props?.isView ||
                    // isProjectManager ||
                    (isProjectManager && !isPMOUser) ||
                    (isDeliveryHead && !isPMOUser) ||
                    props?.data?.ProjectStatus == "6"
                  }
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Billing address</Label>
                <InputTextarea
                  value={formData?.BillingAddress}
                  disabled
                  maxLength={500}
                  autoResize
                />
              </div>
              {!isBA && (
                <>
                  <div
                    className={`${selfComponentStyles.allField} dealFormPage`}
                  >
                    <Label>Deal profit</Label>
                    <div className={selfComponentStyles.dealProfitWrapper}>
                      <div className={selfComponentStyles.dealProfitInput}>
                        <InputText
                          onChange={(e) => {
                            const value = e.target.value;
                            // Only allow digits
                            if (/^\d*$/.test(value)) {
                              handleOnChange("DealProfit", value);
                            }
                          }}
                          value={formData?.DealProfit}
                          disabled={
                            props?.isView ||
                            (isProjectManager && !isPMOUser) ||
                            (isDeliveryHead && !isPMOUser)
                          }
                        />
                      </div>
                      <div>
                        <img
                          src={require("../../../../External/Images/AddDealSheet.png")}
                          onClick={() => props?.setCurrentPage("DealSheet")}
                        ></img>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`${selfComponentStyles.allField} dealFormPage`}
                  >
                    <Label>Deal margin(%)</Label>
                    <InputText
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow digits
                        if (/^\d*$/.test(value)) {
                          handleOnChange("DealMargin", value);
                        }
                      }}
                      value={formData?.DealMargin}
                      disabled={
                        props?.isView ||
                        (isProjectManager && !isPMOUser) ||
                        (isDeliveryHead && !isPMOUser)
                      }
                    />
                  </div>
                  <div
                    className={`${selfComponentStyles.allField} dealFormPage`}
                  >
                    <Label>FPM profit</Label>
                    <InputText
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow digits
                        if (/^\d*$/.test(value)) {
                          handleOnChange("FPMProfit", value);
                        }
                      }}
                      value={formData?.FPMProfit}
                      disabled={
                        props?.isView ||
                        (isProjectManager && !isPMOUser) ||
                        (isDeliveryHead && !isPMOUser)
                      }
                    />
                  </div>
                  <div
                    className={`${selfComponentStyles.allField} dealFormPage`}
                  >
                    <Label>FPM margin(%)</Label>
                    <InputText
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow digits
                        if (/^\d*$/.test(value)) {
                          handleOnChange("FPMMargin", value);
                        }
                      }}
                      value={formData?.FPMMargin}
                      disabled={
                        props?.isView ||
                        (isProjectManager && !isPMOUser) ||
                        (isDeliveryHead && !isPMOUser)
                      }
                    />
                  </div>
                </>
              )}

              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Remarks</Label>
                <InputTextarea
                  onChange={(e) => handleOnChange("Remarks", e.target.value)}
                  value={formData?.Remarks}
                  disabled={
                    props?.isView ||
                    // isProjectManager ||
                    (isProjectManager && !isPMOUser) ||
                    (isDeliveryHead && !isPMOUser) ||
                    props?.data?.ProjectStatus == "6"
                  }
                  maxLength={500}
                  autoResize
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Upwork project</Label>
                <Checkbox
                  inputId="upwork"
                  checked={formData?.UpWork === true}
                  onChange={(e) => handleOnChange("UpWork", e.checked)}
                  disabled={
                    props?.isView ||
                    (isProjectManager && !isPMOUser) ||
                    (isDeliveryHead && !isPMOUser) ||
                    props?.data?.ProjectStatus == "6"
                  }
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>Project Status</Label>
                <Dropdown
                  options={props?.initialCRMProjectsListDropContainer?.Status}
                  optionLabel="name"
                  value={props?.initialCRMProjectsListDropContainer?.Status.find(
                    (item: any) => item.name === formData?.Status,
                  )}
                  onChange={(e) => handleOnChange("Status", e?.value?.name)}
                  disabled={
                    props?.isView ||
                    (isProjectManager && !isPMOUser) ||
                    (isDeliveryHead && !isPMOUser)
                  }
                />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>CR amount</Label>
                <InputText value={crDetails.amount?.toString()} disabled />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                <Label>CR Hours</Label>
                <InputText value={crDetails.hours} disabled />
              </div>
              <div className={`${selfComponentStyles.allField} dealFormPage`}>
                {files.length > 0 ||
                (isPMOUser &&
                  (files.length > 0 || props?.data?.ProjectStatus !== "6")) ||
                (isProjectManager &&
                  (files.length > 0 || props?.data?.ProjectStatus == "2")) ? (
                  <Label>Attachment</Label>
                ) : (
                  ""
                )}
                {(!props?.isView &&
                  isPMOUser &&
                  props?.data?.ProjectStatus !== "6") ||
                (!props?.isView && isProjectManager) ? (
                  <>
                    <FileUpload
                      className="addFileButton"
                      name="demo[]"
                      mode="basic"
                      onSelect={(e) =>
                        handleFileSelection(e, files, setFiles, Config)
                      }
                      url="/api/upload"
                      auto
                      multiple
                      maxFileSize={15 * 1024 * 1024}
                      style={{ width: "14%" }}
                      chooseLabel="Browse"
                      chooseOptions={{ icon: "pi pi-upload" }}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.ppt,.pptx"
                    />
                  </>
                ) : (
                  ""
                )}
              </div>
              {files.length > 0 && (
                <ul className="fileContainer">
                  {files.map((file: any, index) => (
                    <li className={selfComponentStyles?.fileList} key={index}>
                      <div className={selfComponentStyles.filNameTag}>
                        <div
                          onClick={() => downloadFile(file)}
                          style={{
                            cursor: "pointer",
                          }}
                          title={file?.name}
                        >
                          {file?.name.length > 23
                            ? `${file?.name.slice(0, 23)}...`
                            : file?.name}
                        </div>
                        {!props?.isView &&
                        (file?.objectURL ||
                          file?.authorEmail === props?.loginUserEmail) ? (
                          <div className={selfComponentStyles.filesIconDiv}>
                            <i
                              className="pi pi-times"
                              onClick={() => removeFile(file?.name)}
                            ></i>
                          </div>
                        ) : (
                          ""
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {formData.BillingModel && !isBA && (
            <Billings
              ProjectsFormData={formData}
              isPMOUser={isPMOUser}
              isProjectManager={isProjectManager}
              loginUserEmail={props?.loginUserEmail}
              getBillingsAddDetails={getBillingsAddDetails}
              isAdd={props?.isAdd}
              isView={props?.isView}
              isEdit={props?.isEdit}
              BillingModel={formData?.BillingModel}
              isDeliveryHead={isDeliveryHead}
              data={props?.data}
              goBack={props?.goBack}
              spfxContext={props.spfxContext}
              Notify={props.Notify}
              setCurrentPage={props?.setCurrentPage}
            />
          )}
          <div
            style={props?.isAdd ? { padding: "20px 20px 0px 0px" } : {}}
            className={styles.addUpdateBtns}
          >
            <PrimaryButton
              className={styles.cancelBtn}
              iconProps={{ iconName: "cancel" }}
              onClick={() => {
                // emptyDatas();
                setFormData({
                  ProjectID: "",
                  AccountManager: "",
                  AccountName: "",
                  ProjectName: "",
                  StartDate: null,
                  PlannedEndDate: null,
                  ProjectManager: [],
                  DeliveryHead: [],
                  BA: [],
                  ProjectStatus: "0",
                  BillingModel: "",
                  Hours: "",
                  Budget: "",
                  ClientName: "",
                  Currency: "",
                  ProjectType: "",
                  CustomerID: "",
                  CustomerDisplayName: "",
                  BillingContactName: "",
                  BillingContactEmail: "",
                  BillingContactMobile: "",
                  BillingAddress: "",
                  Remarks: "",
                  FPMProfit: "",
                  Status: "",
                  FPMMargin: "",
                  DealProfit: "",
                  DealMargin: "",
                });
                props?.goBack();
                sessionStorage.removeItem("billingsData");
              }}
            >
              Cancel
            </PrimaryButton>
            {props?.isView == false &&
            (isPMOUser ||
              (isProjectManager && formData?.ProjectStatus === "6")) ? (
              <PrimaryButton
                className={styles.updateBtn}
                iconProps={{ iconName: "Save" }}
                onClick={() => {
                  Validation();
                }}
              >
                {props?.isEdit ? "Update" : "Save"}
              </PrimaryButton>
            ) : (
              ""
            )}

            {(formData?.ProjectStatus == "1" ||
              formData?.ProjectStatus === "4" ||
              formData?.ProjectStatus === "5") &&
              isPMOUser &&
              props?.isEdit && (
                <PrimaryButton
                  onClick={() => {
                    setIsSendApproveModal((pre) => ({
                      ...pre,
                      isOpen: true,
                    }));
                  }}
                  style={{ borderRadius: "5px" }}
                >
                  {formData?.ProjectStatus === "4" ||
                  formData?.ProjectStatus === "5"
                    ? "Resubmit"
                    : "Send approval"}
                </PrimaryButton>
              )}
            {((isProjectManager && formData?.ProjectStatus == "2") ||
              (isDeliveryHead && formData?.ProjectStatus == "3")) &&
              props?.isEdit && (
                <>
                  <PrimaryButton
                    onClick={() => {
                      setIsDelModal((pre) => ({
                        ...pre,
                        isOpen: true,
                        projectStatus: formData?.ProjectStatus,
                      }));
                    }}
                    style={{ borderRadius: "5px" }}
                    className={styles.updateBtn}
                  >
                    Approve
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => setShowRejectDialog(true)}
                    className={styles.cancelBtn}
                  >
                    Reject
                  </PrimaryButton>
                </>
              )}
          </div>
        </div>
      )}
      <Dialog
        header="Enter Rejection Reason"
        visible={showRejectDialog}
        style={{ width: "400px" }}
        modal
        onHide={() => setShowRejectDialog(false)}
      >
        <div className="p-fluid">
          <div className="p-field">
            <Label>Reason</Label>
            <InputTextarea
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={5}
              autoResize
            />
          </div>
        </div>

        <div className={selfComponentStyles.reasonButtonContainer}>
          <PrimaryButton
            className={styles.cancelBtn}
            style={{
              backgroundColor: "#aa1f1f",
              color: "#fff",
              borderRadius: "4px",
            }}
            iconProps={{ iconName: "cancel" }}
            onClick={() => setShowRejectDialog(false)}
          >
            Cancel
          </PrimaryButton>
          <PrimaryButton
            style={{
              backgroundColor: "#0d900d",
              color: "#fff",
              borderRadius: "4px",
            }}
            className={styles.updateBtn}
            iconProps={{ iconName: "Save" }}
            onClick={handleRejectWithReason}
          >
            OK
          </PrimaryButton>
        </div>
      </Dialog>
      {/*Approve button modal popup........................................................*/}
      <Modal isOpen={isDelModal.isOpen} styles={Config.delModalStyle}>
        <p className={styles.delmsg}>
          Are you sure, you want to approve this project?
        </p>
        <div className={styles.modalBtnSec}>
          <PrimaryButton
            text="No"
            className={styles.cancelBtn}
            onClick={() => {
              setIsDelModal({ isOpen: false, Id: null, projectStatus: "" });
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
              if (isProjectManager && isDelModal.projectStatus === "2") {
                handleStatusUpdate("3");
              } else {
                handleStatusUpdate("6");
              }
            }}
          />
        </div>
      </Modal>

      {/*Send approval button modal popup........................................................*/}
      <Modal isOpen={isSendApproveModal.isOpen} styles={Config.delModalStyle}>
        <p className={styles.delmsg}>
          Are you sure, you want to{" "}
          {formData?.ProjectStatus === "4" || formData?.ProjectStatus === "5"
            ? "Resubmit"
            : "Send approval"}{" "}
          this project?
        </p>
        <div className={styles.modalBtnSec}>
          <PrimaryButton
            text="No"
            className={styles.cancelBtn}
            onClick={() => {
              setIsSendApproveModal({ isOpen: false, Id: null });
            }}
          />
          <PrimaryButton
            text="Yes"
            className={styles.addBtn}
            onClick={() => {
              setIsSendApproveModal((pre) => ({
                ...pre,
                isOpen: false,
              }));
              handleApprovalFunc();
            }}
          />
        </div>
      </Modal>
    </>
  );
};
export default ProjectFormPage;
