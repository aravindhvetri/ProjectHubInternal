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
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import * as moment from "moment";
import SPServices from "../../../../External/CommonServices/SPServices";
import { Config } from "../../../../External/CommonServices/Config";
import Loading from "../../../../External/Loader/Loading";
import {
  IBasicDropDown,
  IPeoplePickerDetails,
} from "../../../../External/CommonServices/interface";
import {
  multiPeoplePickerTemplate,
  peoplePickerTemplate,
} from "../../../../External/CommonServices/CommonTemplate";
const styles: any = require("./ApproveRejectScreen.module.scss");

interface IPeople {
  id: number;
  name: string;
  email: string;
}

interface IAllocationApproval {
  ID: number;
  RequestedBy: string;
  EmployeeID: string;
  EmployeeName: string;
  Loading: number | string;
  FromDate: string;
  ToDate: string;
  ProjectName: string;
  ProjectID: string;
  Status: string;
  DeliveryHead: IPeople[];
}

interface IRejectComment {
  ID: number;
  RejectComments: string;
  Created: string;
  AuthorName: string;
}

interface IProps {
  Notify: (
    type: "info" | "success" | "warn" | "error" | "secondary" | "contrast",
    summary: string,
    msg: string,
  ) => void;
  refreshCount?: () => void;
}

const ApproveRejectScreen = (props: IProps) => {
  const [allRecords, setAllRecords] = React.useState<IAllocationApproval[]>([]);
  const [statusOptions, setStatusOptions] = React.useState<IBasicDropDown[]>(
    [],
  );
  const [selectedStatus, setSelectedStatus] = React.useState<string>("Open");
  const [loader, setLoader] = React.useState<boolean>(false);
  const [actionLoader, setActionLoader] = React.useState<boolean>(false);
  const [selectedItem, setSelectedItem] =
    React.useState<IAllocationApproval | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] =
    React.useState<boolean>(false);
  const [rejectComments, setRejectComments] = React.useState<string>("");
  const [isCommentsModalOpen, setIsCommentsModalOpen] =
    React.useState<boolean>(false);
  const [commentsLoader, setCommentsLoader] = React.useState<boolean>(false);
  const [commentsData, setCommentsData] = React.useState<IRejectComment[]>([]);

  const getAllocationsApproval = () => {
    setLoader(true);
    SPServices.SPReadItems({
      Listname: Config.ListNames.AllocationsApproval,
      Select: "*,DeliveryHead/Id,DeliveryHead/Title,DeliveryHead/EMail",
      Expand: "DeliveryHead",
      Orderby: "Modified",
      Orderbydecorasc: false,
    })
      .then((res: any[]) => {
        const tempData: IAllocationApproval[] = [];
        res?.forEach((item: any) => {
          const deliveryHead: IPeople[] = [];
          if (item?.DeliveryHead?.length) {
            item?.DeliveryHead?.forEach((user: any) => {
              deliveryHead.push({
                id: user?.Id,
                name: user?.Title,
                email: user?.EMail,
              });
            });
          }

          tempData.push({
            ID: item?.ID,
            RequestedBy: item?.RequestedBy || "-",
            EmployeeID: item?.EmployeeID || "-",
            EmployeeName: item?.EmployeeName || "-",
            Loading: item?.Loading ?? "-",
            FromDate: item?.FromDate || "",
            ToDate: item?.ToDate || "",
            ProjectName: item?.ProjectName || "-",
            ProjectID: item?.ProjectID || "-",
            Status: item?.Status || "-",
            DeliveryHead: deliveryHead,
          });
        });
        setAllRecords([...tempData]);
        setLoader(false);
      })
      .catch((err: any) => {
        setLoader(false);
        console.log("Error fetching allocation approvals", err);
      });
  };

  const getStatusChoices = () => {
    SPServices.SPGetChoices({
      Listname: Config.ListNames.AllocationsApproval,
      FieldName: "Status",
    })
      .then((res: any) => {
        const tempChoices: IBasicDropDown[] = [];
        if (res?.Choices?.length) {
          res.Choices.forEach((val: string) => {
            tempChoices.push({ name: val });
          });
        }
        setStatusOptions(tempChoices);
      })
      .catch((err: any) => {
        console.log("Error fetching allocation approval status choices", err);
      });
  };

  const filteredRecords = React.useMemo(() => {
    if (!selectedStatus) return allRecords;
    return allRecords.filter(
      (record) =>
        record?.Status?.toLowerCase() === selectedStatus.toLowerCase(),
    );
  }, [allRecords, selectedStatus]);

  React.useEffect(() => {
    getAllocationsApproval();
    getStatusChoices();
  }, []);

  const updateApprovalStatus = (id: number, status: "Approved" | "Reject") => {
    setActionLoader(true);
    SPServices.SPUpdateItem({
      ID: id,
      Listname: Config.ListNames.AllocationsApproval,
      RequestJSON: {
        Status: status,
      },
    })
      .then(() => {
        props.Notify(
          "success",
          "Success",
          `Request ${status.toLowerCase()}d successfully`,
        );
        getAllocationsApproval();
        props.refreshCount && props.refreshCount();
        setActionLoader(false);
      })
      .catch((err: any) => {
        setActionLoader(false);
        console.log("Error while updating allocation approval status", err);
      });
  };

  const openRejectModal = (rowData: IAllocationApproval) => {
    setSelectedItem(rowData);
    setRejectComments("");
    setIsRejectModalOpen(true);
  };

  const saveRejectComments = () => {
    if (!selectedItem?.ID) return;
    if (!rejectComments?.trim()) {
      props.Notify("warn", "Validation", "Please enter reject comments");
      return;
    }
    setActionLoader(true);
    SPServices.SPAddItem({
      Listname: Config.ListNames.AllocationsApprovalRejectComments,
      RequestJSON: {
        RejectComments: rejectComments?.trim(),
        AllocationsApprovalId: selectedItem?.ID,
      },
    })
      .then(() => {
        updateApprovalStatus(selectedItem.ID, "Reject");
        setIsRejectModalOpen(false);
        setRejectComments("");
      })
      .catch((err: any) => {
        setActionLoader(false);
        console.log("Error while saving reject comments", err);
      });
  };

  const getRejectComments = (rowData: IAllocationApproval) => {
    setCommentsLoader(true);
    setSelectedItem(rowData);
    setIsCommentsModalOpen(true);
    SPServices.SPReadItems({
      Listname: Config.ListNames.AllocationsApprovalRejectComments,
      Select: "*,Author/Title,AllocationsApproval/ID",
      Expand: "Author,AllocationsApproval",
      Filter: [
        {
          FilterKey: "AllocationsApproval/ID",
          Operator: "eq",
          FilterValue: rowData.ID.toString(),
        },
      ],
      Orderby: "Modified",
      Orderbydecorasc: false,
    })
      .then((res: any[]) => {
        const tempComments: IRejectComment[] = [];
        res?.forEach((item: any) => {
          tempComments.push({
            ID: item?.ID,
            RejectComments: item?.RejectComments || "-",
            Created: item?.Created || "",
            AuthorName: item?.Author?.Title || "-",
          });
        });
        setCommentsData(tempComments);
        setCommentsLoader(false);
      })
      .catch((err: any) => {
        setCommentsLoader(false);
        console.log("Error while fetching reject comments", err);
      });
  };

  const renderStatus = (rowData: IAllocationApproval) => {
    const statusKey = rowData?.Status?.toLowerCase();
    const statusClass =
      statusKey === "approve"
        ? styles.approve
        : statusKey === "reject"
          ? styles.reject
          : styles.open;
    return (
      <span className={`${styles.statusBadge} ${statusClass}`}>
        {rowData?.Status || "-"}
      </span>
    );
  };

  const renderLoading = (rowData: IAllocationApproval) => {
    const num = Number(rowData?.Loading);
    if (isNaN(num)) return <span>-</span>;
    return <span>{`${Math.round(num * 100)}%`}</span>;
  };

  const renderDate = (date: string) => {
    return <span>{date ? moment(date).format("DD-MMM-YYYY") : "-"}</span>;
  };

  const renderDeliveryHead = (rowData: IAllocationApproval) => {
    if (!rowData?.DeliveryHead?.length) return <span>-</span>;
    const deliveryHeads: IPeoplePickerDetails[] = rowData?.DeliveryHead;
    return (
      <div>
        {rowData?.DeliveryHead?.length > 1
          ? multiPeoplePickerTemplate(deliveryHeads)
          : peoplePickerTemplate(deliveryHeads[0])}
      </div>
    );
  };

  const actionsTemplate = (rowData: IAllocationApproval) => {
    const isOpen = rowData?.Status?.toLowerCase() === "open";
    const isReject = rowData?.Status?.toLowerCase() === "reject";
    return (
      <div className={styles.actionsCell}>
        <button
          className={`${styles.actionIconBtn} ${styles.approveBtn}`}
          disabled={!isOpen || actionLoader}
          onClick={() => updateApprovalStatus(rowData.ID, "Approved")}
          title="Approve request"
          aria-label="Approve request"
        >
          <i className="pi pi-check" />
        </button>
        <button
          className={`${styles.actionIconBtn} ${styles.rejectBtn}`}
          disabled={!isOpen || actionLoader}
          onClick={() => openRejectModal(rowData)}
          title="Reject request"
          aria-label="Reject request"
        >
          <i className="pi pi-times" />
        </button>
        {isReject && (
          <button
            className={`${styles.actionIconBtn} ${styles.viewBtn}`}
            onClick={() => getRejectComments(rowData)}
            title="View rejection comments"
            aria-label="View rejection comments"
          >
            <i className="pi pi-comments" />
          </button>
        )}
      </div>
    );
  };

  const commentsDialogHeader = (
    <div className={styles.popupHeader}>
      <h3>Rejection Comments</h3>
      <span>
        {selectedItem
          ? `${selectedItem.EmployeeName} (${selectedItem.ProjectID})`
          : ""}
      </span>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.titleRow}>
        <div className={styles.titleRowRight}>
          <Dropdown
            className={styles.statusFilter}
            options={statusOptions}
            optionLabel="name"
            placeholder="Select status"
            value={statusOptions.find(
              (item) =>
                item.name?.toLowerCase() === selectedStatus.toLowerCase(),
            )}
            onChange={(e) => setSelectedStatus(e.value?.name || "")}
          />
          <span className={styles.countPill}>
            {filteredRecords?.length} Total
          </span>
        </div>
      </div>
      <div className={styles.tableWrap}>
        {loader ? (
          <Loading />
        ) : (
          <DataTable
            value={filteredRecords}
            paginator={filteredRecords?.length > 8}
            rows={8}
            stripedRows
            emptyMessage={
              <p className={styles.emptyData}>No approval requests found</p>
            }
          >
            <Column
              header="Actions"
              body={actionsTemplate}
              style={{ minWidth: "10rem" }}
            />
            <Column
              field="Status"
              header="Status"
              body={renderStatus}
              style={{ minWidth: "8rem" }}
            />
            <Column
              field="RequestedBy"
              header="Requested By"
              style={{ minWidth: "8rem" }}
            />
            <Column
              field="EmployeeID"
              header="Employee ID"
              style={{ minWidth: "8rem" }}
            />
            <Column
              field="EmployeeName"
              header="Employee Name"
              style={{ minWidth: "10rem" }}
            />
            <Column
              field="Loading"
              header="Loading"
              body={renderLoading}
              style={{ minWidth: "7rem" }}
            />
            <Column
              field="FromDate"
              header="From Date"
              body={(rowData: IAllocationApproval) =>
                renderDate(rowData?.FromDate)
              }
              style={{ minWidth: "9rem" }}
            />
            <Column
              field="ToDate"
              header="To Date"
              body={(rowData: IAllocationApproval) =>
                renderDate(rowData?.ToDate)
              }
              style={{ minWidth: "9rem" }}
            />
            <Column
              field="ProjectName"
              header="Project Name"
              style={{ minWidth: "12rem" }}
            />
            <Column
              field="ProjectID"
              header="Project ID"
              style={{ minWidth: "8rem" }}
            />
            <Column
              field="DeliveryHead"
              header="Delivery Head"
              body={renderDeliveryHead}
              style={{ minWidth: "14rem" }}
            />
          </DataTable>
        )}
      </div>

      <Dialog
        visible={isRejectModalOpen}
        className={styles.rejectDialog}
        style={{ width: "35vw" }}
        draggable={false}
        resizable={false}
        onHide={() => {
          setIsRejectModalOpen(false);
          setRejectComments("");
        }}
        header="Reject Request"
      >
        <div className={styles.rejectDialogBody}>
          <label>Comments</label>
          <InputTextarea
            autoResize
            rows={4}
            value={rejectComments}
            onChange={(e) => setRejectComments(e.target.value)}
            placeholder="Enter rejection comments"
            className={styles.rejectTextArea}
          />
          <div className={styles.dialogFooter}>
            <button
              className={`${styles.actionBtn} ${styles.cancelBtn}`}
              onClick={() => {
                setIsRejectModalOpen(false);
                setRejectComments("");
              }}
            >
              Cancel
            </button>
            <button
              className={`${styles.actionBtn} ${styles.rejectBtn}`}
              onClick={saveRejectComments}
              disabled={actionLoader}
            >
              Save
            </button>
          </div>
        </div>
      </Dialog>

      <Dialog
        visible={isCommentsModalOpen}
        className={styles.commentsDialog}
        style={{ width: "50vw" }}
        draggable={false}
        resizable={false}
        onHide={() => {
          setIsCommentsModalOpen(false);
          setCommentsData([]);
        }}
        header={commentsDialogHeader}
      >
        {commentsLoader ? (
          <Loading />
        ) : (
          <DataTable
            value={commentsData}
            paginator={commentsData?.length > 5}
            rows={5}
            stripedRows
            emptyMessage={
              <p className={styles.emptyData}>No rejection comments found</p>
            }
          >
            <Column
              field="AuthorName"
              header="Rejected By"
              style={{ width: "25%" }}
            />
            <Column
              field="Created"
              header="Date"
              style={{ width: "25%" }}
              body={(rowData: IRejectComment) =>
                rowData?.Created
                  ? moment(rowData.Created).format("DD-MMM-YYYY hh:mm A")
                  : "-"
              }
            />
            <Column
              field="RejectComments"
              header="Comments"
              style={{ width: "50%" }}
            />
          </DataTable>
        )}
      </Dialog>
    </div>
  );
};

export default ApproveRejectScreen;
