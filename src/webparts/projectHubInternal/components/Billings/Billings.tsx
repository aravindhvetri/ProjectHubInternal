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
import SPServices from "../../../../External/CommonServices/SPServices";
import { Config } from "../../../../External/CommonServices/Config";
import * as moment from "moment";
import {
  IBillingsDetails,
  IDelModal,
} from "../../../../External/CommonServices/interface";
import styles from "../Projects/Projects.module.scss";
import "../../../../External/CSS/Style.css";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import BillingsForm from "./BillingsForm";
import { Modal, PrimaryButton } from "@fluentui/react";
import Loading from "../../../../External/Loader/Loading";
import { Dialog } from "primereact/dialog";

const Billings = (props: any) => {
  console.log(props?.isPMOUser, "isPMOuser");
  //Local variables:
  const ScreenWidth: number = window.innerWidth;
  const BillingModel: string = props?.BillingModel;
  const PlusImage: string = require("../../../../External/Images/plus.png");
  const DeleteImage: string = require("../../../../External/Images/trashcan.png");
  const EditImage: string = require("../../../../External/Images/Edit.png");
  const invoiceImage: string = require("../../../../External/Images/invoice.png");

  //Local States:
  const [billingsDetails, setBillingDetails] = React.useState<
    IBillingsDetails[]
  >([]);
  const [masterBillingsDetails, setMasterBillingDetails] = React.useState<
    IBillingsDetails[]
  >([]);
  const [formBooleansMode, setFormBooleansMode] = React.useState<
    "add" | "edit" | "view"
  >("add");
  const [selectedCRMBillingsRowData, setSelectedCRMBillingsRowData] =
    React.useState<IBillingsDetails | null>(null);
  const [isDelModal, setIsDelModal] = React.useState<IDelModal>({
    isOpen: false,
    Id: null,
  });
  const [isInvoiceRaiseModal, setIsInvoiceRaiseModal] = React.useState<any>({
    isOpen: false,
    Id: null,
    hours: "",
  });
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [loader, setLoader] = React.useState<boolean>(false);
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);

  //Get BillingsListDetails:
  const getBillingsListDetails = () => {
    SPServices.SPReadItems({
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
        {
          FilterKey: "ProjectId",
          Operator: "eq",
          FilterValue: `${props?.data?.ID}`,
        },
      ],
    })
      .then((res) => {
        let BillingDetails: IBillingsDetails[] = [];
        res.forEach((items: any) => {
          BillingDetails.push({
            ID: items?.ID,
            MileStoneName: items?.MileStoneName,
            MileStoneDescription: items?.MileStoneDescription,
            CompletionPercentage: items?.CompletionPercentage
              ? items?.CompletionPercentage
              : "",
            DueDate: items?.DueDate,
            Amount: items?.Amount,
            TMAmount: items?.TMAmount,
            Status: items?.Status,
            InvoiceID: items?.InvoiceID || "",
            ReminderDaysBeforeDue: items?.ReminderDaysBeforeDue
              ? items?.ReminderDaysBeforeDue
              : 7,
            Notes: items?.Notes,
            Currency: items?.Currency,
            MonthlyAmount: items?.MonthlyAmount,
            StartMonth: items?.StartMonth,
            EndMonth: items?.EndMonth,
            BillingFrequency: items?.BillingFrequency,
            ResourceType: items?.ResourceType,
            Rate: items?.Rate,
            Hours: items?.Hours,
            ProjectId: items?.ProjectId,
          });
        });

        BillingDetails.sort((a, b) => {
          const dateA = new Date(a?.DueDate);
          const dateB = new Date(b?.DueDate);
          return dateA.getTime() - dateB.getTime();
        });

        setMasterBillingDetails([...BillingDetails]);
        setBillingDetails([...BillingDetails]);
        setLoader(false);
      })
      .catch((err) => {
        console.log(
          err,
          "Get CRMBillings details error in Billings.tsx component"
        );
      });
  };

  //Get BillingsForm Details:
  const getBillingFormDetails = (details: any) => {
    const sortedDetails = [...details].sort((a, b) => {
      const dateA = new Date(a?.DueDate);
      const dateB = new Date(b?.DueDate);
      return dateA.getTime() - dateB.getTime();
    });

    setBillingDetails(sortedDetails);
    setMasterBillingDetails(sortedDetails);
  };

  //Delete Particular Item:
  const TrashItem = () => {
    if (props?.isAdd) {
      setBillingDetails((prev) => {
        const sessionData = sessionStorage.getItem("billingsData");
        if (sessionData) {
          const updated = prev.filter((item) => item?.ID !== isDelModal?.Id);
          sessionStorage.setItem("billingsData", JSON.stringify(updated));
          return updated;
        }
        return prev;
      });

      setMasterBillingDetails((prev) =>
        prev.filter((item) => item?.ID !== isDelModal?.Id)
      );
    } else {
      const currObj = {
        IsDelete: true,
      };

      SPServices.SPUpdateItem({
        ID: isDelModal.Id ?? 0,
        Listname: Config.ListNames.CRMBillings,
        RequestJSON: currObj,
      })
        .then(() => {
          props.Notify("success", "Success", "Milestone deleted successfully");
          getBillingsListDetails();
        })
        .catch((err) => {
          console.log(err, "rowData deleted err in Billings.tsx component");
        });
    }
  };

  //Render status column with proper label
  const renderStatus = (rowData: IBillingsDetails) => {
    return (
      <div>{Config.statusLabelMap[rowData?.Status] || rowData?.Status}</div>
    );
  };

  //Render InvoiceID column
  const renderInvoiceIDTemplate = (rowData: IBillingsDetails) => {
    return <div>{rowData?.InvoiceID || "-"}</div>;
  };

  //Function to check whether to show invoice icon or not:
  const shouldShowInvoiceIcon = (
    dueDateStr: string,
    reminderDays: string
  ): boolean => {
    if (!dueDateStr) return false;

    const today = new Date();
    const dueDate = new Date(dueDateStr);
    const startDate = new Date(dueDate);

    startDate.setDate(dueDate.getDate() - parseInt(reminderDays));

    return today >= startDate && today <= dueDate;
  };

  //Handle Invoice Trigger function:
  const handleInvoiceTrigger = (Id: number) => {
    SPServices.SPUpdateItem({
      Listname: Config.ListNames?.CRMBillings,
      ID: Id,
      RequestJSON: {
        InvoiceTrigger: true,
        Status: "1",
      },
    })
      .then(() => {
        props?.Notify("success", "Success", "Invoice raised successfully");
        getBillingsListDetails();
      })
      .catch((err: any) => {
        console.log(err, "Invoice trigger error in Billings.tsx component");
      });
  };

  //Open BillingsForm popup:
  const openForm = (
    mode: "add" | "edit" | "view",
    data: IBillingsDetails | null = null
  ) => {
    setFormBooleansMode(mode);
    setSelectedCRMBillingsRowData(data);
    setIsFormModalOpen(true);
  };

  //handle search Functionalities:
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (!value) {
      setBillingDetails(masterBillingsDetails);
    } else {
      const lowerValue = value.toLowerCase();
      const filtered = masterBillingsDetails.filter((item) =>
        Object.values(item).some((field) =>
          typeof field === "string"
            ? field.toLowerCase().includes(lowerValue)
            : typeof field === "number"
            ? field.toString().includes(lowerValue)
            : false
        )
      );
      setBillingDetails(filtered);
    }
  };

  //Check whether the row is editable or not:
  const isBillingRowEditable = (rowData: IBillingsDetails) => {
    return props?.ProjectsFormData?.ProjectStatus !== "6";
  };

  //Initial Render:
  React.useEffect(() => {
    setLoader(true);
    getBillingsListDetails();
  }, []);

  return (
    <>
      {loader ? (
        <Loading />
      ) : (
        <div className={styles.lcaBody}>
          <div
            className={`${styles.filterBarAndTableBorder} 
          ${ScreenWidth >= 1536 ? styles.filterBar_1536 : styles.filterBar_1396}
          `}
          >
            <div className={styles.filterBar}>
              <h2>Invoices ({props?.BillingModel})</h2>
            </div>
            <div className={styles.filterBtns}>
              <div className="all_search">
                <IconField iconPosition="left">
                  <InputIcon className="pi pi-search"> </InputIcon>
                  <InputText
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search"
                    v-model="value1"
                  />
                </IconField>
              </div>
              {!props?.isView &&
              (!props?.isDeliveryHead || props?.isPMOUser) &&
              props?.data?.ProjectStatus !== "6" ? (
                <div className={styles.btnAndText}>
                  <div
                    onClick={() => openForm("add")}
                    className={styles.btnBackGround}
                  >
                    <img
                      src={PlusImage}
                      alt="no image"
                      style={{ width: "15px", height: "15px" }}
                    />
                    New milestone
                  </div>
                </div>
              ) : (
                ""
              )}
            </div>
          </div>
          <div
            className={`${styles.tableData} tableData tableDatas
                    ${
                      ScreenWidth >= 1536
                        ? "data_table_1536"
                        : "data_table_1396"
                    }`}
          >
            <DataTable
              value={billingsDetails}
              paginator={billingsDetails && billingsDetails?.length > 8}
              rows={8}
              onRowClick={(e: any) => {
                if (
                  !props?.isView &&
                  !props?.isDeliveryHead &&
                  isBillingRowEditable(e.data)
                ) {
                  openForm("edit", e?.data);
                } else {
                  openForm("view", e?.data);
                }
              }}
              emptyMessage={<p className={styles.noData}>No data !!!</p>}
            >
              {BillingModel == "Milestone" && (
                <Column
                  sortable
                  field="MileStoneName"
                  header="MileStone name"
                />
              )}
              {BillingModel == "Milestone" && (
                <Column
                  sortable
                  field="MileStoneDescription"
                  header="MileStone description"
                ></Column>
              )}
              {BillingModel == "Milestone" && (
                <Column
                  sortable
                  field="CompletionPercentage"
                  header="Completion percentage"
                  body={(rowData) => {
                    return (
                      <div>
                        {rowData?.CompletionPercentage
                          ? `${rowData?.CompletionPercentage} %`
                          : ""}
                      </div>
                    );
                  }}
                />
              )}
              {BillingModel == "Milestone" && (
                <Column sortable field="Amount" header="Amount"></Column>
              )}
              {BillingModel == "FixedMonthly" && (
                <Column
                  sortable
                  field="StartMonth"
                  header="Start month"
                  body={(rowData) => {
                    return (
                      <div>
                        {moment(rowData?.StartMonth).format("MMM/YYYY")}
                      </div>
                    );
                  }}
                ></Column>
              )}
              {BillingModel == "FixedMonthly" && (
                <Column
                  sortable
                  field="EndMonth"
                  header="End month"
                  body={(rowData) => {
                    return (
                      <div>{moment(rowData?.EndMonth).format("MMM/YYYY")}</div>
                    );
                  }}
                ></Column>
              )}
              {BillingModel == "FixedMonthly" && (
                <Column
                  sortable
                  field="MonthlyAmount"
                  header="Monthly amount"
                ></Column>
              )}
              {BillingModel == "T&M" && (
                <Column
                  sortable
                  field="ResourceType"
                  header="Resource type"
                ></Column>
              )}
              {BillingModel == "T&M" && (
                <Column
                  sortable
                  field="BillingFrequency"
                  header="Billing frequency"
                ></Column>
              )}

              {BillingModel == "T&M" && (
                <Column sortable field="Rate" header="Rate"></Column>
              )}
              {BillingModel == "T&M" && (
                <Column sortable field="Hours" header="Hours"></Column>
              )}
              <Column sortable field="Currency" header=" Currency"></Column>
              <Column
                sortable
                field="DueDate"
                header="Due date"
                body={(rowData) => {
                  return (
                    <div>{moment(rowData?.DueDate).format("DD/MM/YYYY")}</div>
                  );
                }}
              ></Column>
              {/* <Column
                sortable
                field="ReminderDaysBeforeDue"
                header="Reminder days before due"
              ></Column> */}
              <Column
                sortable
                field="Status"
                header="Status"
                body={renderStatus}
              ></Column>
              <Column
                sortable
                field="InvoiceID"
                header="Invoice id"
                body={renderInvoiceIDTemplate}
              ></Column>
              <Column sortable field="Notes" header="Notes"></Column>

              {!props?.isView &&
                (!props?.isDeliveryHead ||
                  props?.isPMOUser ||
                  props?.data?.ProjectManager?.some(
                    (user: any) => user?.email == props?.loginUserEmail
                  )) && (
                  <Column
                    field="Action"
                    header="Actions"
                    body={(rowData: IBillingsDetails) => {
                      return (
                        <div className={styles.Actions}>
                          {props?.ProjectsFormData?.ProjectStatus !== "6" ||
                          ((props?.data?.ProjectManager?.some(
                            (user: any) => user?.email == props?.loginUserEmail
                          ) ||
                            props?.isPMOUser) &&
                            props?.data?.BillingModel == "T&M" &&
                            (rowData?.Status == "0" ||
                              rowData?.Status == "4")) ? (
                            <>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openForm("edit", rowData);
                                }}
                              >
                                <img
                                  title="Edit"
                                  src={EditImage}
                                  alt="no image"
                                ></img>
                              </div>
                              {props?.isPMOUser &&
                              props?.ProjectsFormData?.ProjectStatus !== "6" ? (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsDelModal({
                                      Id: rowData?.ID,
                                      isOpen: true,
                                    });
                                  }}
                                >
                                  <img
                                    title="Delete"
                                    src={DeleteImage}
                                    alt="no image"
                                  ></img>
                                </div>
                              ) : (
                                ""
                              )}
                            </>
                          ) : (
                            ""
                          )}
                          {(props?.data?.ProjectStatus == "6" &&
                            (props?.data?.ProjectManager?.some(
                              (user: any) =>
                                user?.email == props?.loginUserEmail
                            ) ||
                              props?.isPMOUser) &&
                            rowData?.Status == "0" &&
                            shouldShowInvoiceIcon(
                              rowData?.DueDate,
                              rowData?.ReminderDaysBeforeDue
                            )) ||
                          ((props?.data?.ProjectManager?.some(
                            (user: any) => user?.email == props?.loginUserEmail
                          ) ||
                            props?.isPMOUser) &&
                            rowData?.Status == "4") ||
                          (props?.data?.ProjectManager?.some(
                            (user: any) => user?.email == props?.loginUserEmail
                          ) &&
                            new Date(rowData?.DueDate) < new Date() &&
                            props?.data?.ProjectStatus == "6" &&
                            rowData?.Status == "0") ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                // handleInvoiceTrigger(rowData?.ID);
                                setIsInvoiceRaiseModal({
                                  Id: rowData?.ID,
                                  isOpen: true,
                                  hours: rowData?.Hours ? rowData?.Hours : "",
                                });
                              }}
                            >
                              <img
                                title="Raise Invoice"
                                src={invoiceImage}
                                alt="no image"
                              />
                            </div>
                          ) : (
                            ""
                          )}
                        </div>
                      );
                    }}
                  ></Column>
                )}
            </DataTable>
          </div>
        </div>
      )}
      <Dialog
        visible={isFormModalOpen}
        style={{ width: "80vw" }}
        modal
        draggable={false}
        resizable={false}
        onHide={() => setIsFormModalOpen(false)}
      >
        <BillingsForm
          ProjectsFormData={props?.ProjectsFormData}
          getBillingsAddDetails={props?.getBillingsAddDetails}
          projectsFormAdd={props?.isAdd}
          getBillingFormDetails={getBillingFormDetails}
          selectedProjectsData={props?.data}
          selectedCRMBillingsRowData={selectedCRMBillingsRowData}
          BillingModel={BillingModel}
          isAdd={formBooleansMode === "add"}
          isEdit={formBooleansMode === "edit"}
          isView={formBooleansMode === "view"}
          goBackBiilingsDashboard={() => setIsFormModalOpen(false)}
          Notify={props.Notify}
          refresh={() => {
            getBillingsListDetails();
            setIsFormModalOpen(false);
          }}
        />
      </Dialog>

      <Modal isOpen={isDelModal.isOpen} styles={Config.delModalStyle}>
        <p className={styles.delmsg}>
          Are you sure, you want to delete this milestone?
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
      {/*Invoice trigger Model popup...................................................*/}
      <Modal isOpen={isInvoiceRaiseModal.isOpen} styles={Config.delModalStyle}>
        <p className={styles.delmsg}>
          {props?.data?.BillingModel == "T&M"
            ? `According to your T&M, the total hours are ${isInvoiceRaiseModal.hours}. Do you want to raise an invoice for this milestone?`
            : "Are you sure you want to raise an invoice for this milestone?"}
        </p>
        <div className={styles.modalBtnSec}>
          <PrimaryButton
            text="No"
            className={styles.cancelBtn}
            onClick={() => {
              setIsInvoiceRaiseModal({ isOpen: false, Id: null, hours: "" });
            }}
          />
          <PrimaryButton
            text="Yes"
            className={styles.addBtn}
            onClick={() => {
              setIsInvoiceRaiseModal((pre: any) => ({
                ...pre,
                isOpen: false,
              }));
              if (isInvoiceRaiseModal?.Id !== null) {
                handleInvoiceTrigger(isInvoiceRaiseModal.Id);
              }
            }}
          />
        </div>
      </Modal>
    </>
  );
};

export default Billings;
