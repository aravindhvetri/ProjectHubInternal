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
import * as moment from "moment";
import "../../../../External/CSS/Style.css";
import Loading from "../../../../External/Loader/Loading";
import { Dialog } from "primereact/dialog";
import { Config } from "../../../../External/CommonServices/Config";

//ChangeLog Interface
interface IVersionColums {
  key: string;
  type: string;
}

interface IVersionDetails {
  id: number;
  listName: string;
  columns: IVersionColums[];
}

interface IVersionHostoryProps {
  context: any;
  handleClose: any;
  isOpen: boolean;
  details: IVersionDetails;
}

const ChangeLog = ({
  context,
  handleClose,
  isOpen,
  details,
}: IVersionHostoryProps) => {
  //Local state:
  const [data, setData] = React.useState<any>([]);
  const [isLoader, setIsLoader] = React.useState(true);

  function areArraysEqual(array1: any[], array2: any[], type: string) {
    // Check if the arrays have the same length
    if (array1.length !== array2.length) {
      return false;
    }

    // Compare each element of the arrays
    for (let i = 0; i < array1.length; i++) {
      if (type === "choice") {
        if (array1[i] !== array2[i]) {
          return false;
        }
      } else {
        if (array1[i][type] !== array2[i][type]) {
          return false;
        }
      }
    }

    // If all elements are equal, return true
    return true;
  }

  const getAllData = () => {
    SPServices.SPReadItemVersionHistory({
      Listname: details?.listName,
      SelectedId: details?.id,
      Select: "*",
      Expand: "",
    })
      .then((res: any) => {
        let tempData: any = [];
        res.forEach((val: any, index: any) => {
          let tempObj = {};
          let changedColumns: any = [];

          details?.columns?.forEach((value: any) => {
            let prevValue: any = res[index + 1] && res[index + 1][value.key];
            let currValue: any = val[value.key];
            let isLastIndex: boolean = index == res.length - 1;

            if (
              value?.type === "Text" ||
              value?.type === "Date" ||
              value?.type === "YesOrNo"
            ) {
              if (prevValue !== currValue || isLastIndex) {
                let newValue = "";

                if (value?.type === "Text") {
                  newValue = currValue || currValue == "0" ? currValue : "";
                } else if (value?.type === "Date") {
                  newValue = currValue
                    ? moment(currValue).format("MM/DD/YYYY")
                    : "";
                } else if (value?.type === "YesOrNo") {
                  newValue =
                    currValue === true
                      ? "Yes"
                      : currValue === false
                      ? "No"
                      : "";
                }

                changedColumns.push({
                  name: value?.name,
                  key: value?.key,
                  value: newValue,
                });
              }
            } else if (value?.type === "PeoplePicker") {
              if (
                prevValue?.LookupValue !== currValue?.LookupValue ||
                isLastIndex
              ) {
                if (currValue?.LookupValue) {
                  changedColumns.push({
                    name: value?.name,
                    key: value?.key,
                    value: currValue?.LookupValue,
                  });
                }
              }
            } else if (value?.type === "PeoplePickerMultiple") {
              let isChanged = !areArraysEqual(
                prevValue ? prevValue : [],
                currValue ? currValue : [],
                "Email"
              );

              if (isChanged || isLastIndex) {
                let names: string[] = currValue?.map(
                  (val: any) => val?.LookupValue
                );

                changedColumns.push({
                  name: value?.name,
                  key: value?.key,
                  value: names,
                });
              }
            } else if (value?.type === "Lookup") {
              if (
                prevValue?.LookupValue !== currValue?.LookupValue ||
                isLastIndex
              ) {
                changedColumns.push({
                  name: value?.name,
                  key: value?.key,
                  value: currValue?.LookupValue,
                });
              }
            } else if (value?.type === "MultipleLookup") {
              let isChanged = !areArraysEqual(
                prevValue ? prevValue : [],
                currValue ? currValue : [],
                "LookupValue"
              );

              if (isChanged || isLastIndex) {
                let lookupIds: string[] = currValue?.map(
                  (val: any) => val?.LookupValue
                );

                if (lookupIds) {
                  changedColumns.push({
                    name: value?.name,
                    key: value?.key,
                    value: lookupIds,
                  });
                }
              }
            } else if (value?.type === "ChoiceMultiple") {
              let isChanged = !areArraysEqual(
                prevValue ? prevValue : [],
                currValue ? currValue : [],
                "choice"
              );

              if (isChanged || isLastIndex) {
                changedColumns.push({
                  name: value?.name,
                  key: value?.key,
                  value: currValue,
                });
              }
            }
          });

          tempObj = {
            ...tempObj,
            Modified: val?.Modified,
            ModifiedBy: val?.Editor?.LookupValue,
            ModifiedByEmail: val?.Editor?.Email,
            Version: "",
            changedColumns,
          };
          if (changedColumns?.length) {
            tempData.push(tempObj);
          }
        });
        tempData = [...tempData]?.map((val: any, index: number) => {
          val.Version = (tempData.length - index)?.toFixed(1);
          return val;
        });
        setData([...tempData]);
        setIsLoader(false);
      })
      .catch((err: any) => {
        setIsLoader(false);
        console.log("Get change log", err);
      });
  };

  React.useEffect(() => {
    if (details?.id) {
      setIsLoader(true);
      getAllData();
    } else {
      setIsLoader(false);
    }
  }, [details?.id]);
  return (
    <>
      <div className="test">
        <Dialog
          className="modal-template change-log-modal"
          header={
            <div className="modal-header">
              <h4 style={{ fontSize: 18, fontWeight: 600 }}>Audit logs</h4>
            </div>
          }
          draggable={false}
          blockScroll={false}
          resizable={false}
          visible={isOpen}
          style={{ width: "70%" }}
          onHide={() => {
            handleClose();
          }}
        >
          {isLoader ? (
            <div
              style={{
                width: "100%",
                height: "80vh",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Loading />
            </div>
          ) : (
            <div className="modal-container">
              <div className="modal-content" style={{ display: "revert" }}>
                <div
                  style={{
                    display: "flex",
                    marginBottom: "10px",
                    backgroundColor: "#f3f7fd",
                    padding: "10px",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      color: "#0a1b39",
                      fontSize: "0.80rem",
                      fontWeight: "600",
                      width: "10%",
                    }}
                  >
                    Version no
                  </div>
                  <div
                    style={{
                      color: "#0a1b39",
                      fontSize: "0.80rem",
                      fontWeight: "600",
                      width: "25%",
                    }}
                  >
                    Modified by
                  </div>
                  <div
                    style={{
                      color: "#0a1b39",
                      fontSize: "0.80rem",
                      fontWeight: "600",
                      width: "15%",
                    }}
                  >
                    Date and time
                  </div>
                  <div
                    style={{
                      color: "#0a1b39",
                      fontSize: "0.80rem",
                      fontWeight: "600",
                      width: "50%",
                    }}
                  >
                    Field changes
                  </div>
                </div>
                <div style={{ maxHeight: "450px" }}>
                  {data?.map((val: any, index: number) => {
                    return (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          marginBottom: "15px",
                          borderBottom: "1px solid #dee2e6",
                          width: "100%",
                        }}
                      >
                        <div
                          style={{
                            width: "11%",
                            fontSize: "14px",
                            paddingLeft: "11px",
                            fontWeight: 500,
                            color: "#061022",
                          }}
                        >
                          {val?.Version}
                        </div>
                        <div
                          style={{
                            fontSize: "0.80rem",
                            width: "24%",
                          }}
                        >
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <img
                              src={`/_layouts/15/userphoto.aspx?size=S&accountname=${val.ModifiedByEmail}`}
                              alt="wait"
                              style={{
                                marginRight: 10,
                                width: 30,
                                height: 30,
                                borderRadius: "50%",
                                objectFit: "fill",
                              }}
                            ></img>
                            <div>{val?.ModifiedBy}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: "0.80rem", width: "16%" }}>
                          <span style={{ color: "#03787c" }}>
                            {val?.Modified
                              ? moment(val?.Modified).format(
                                  "MM/DD/YYYY hh:mm:ss A"
                                )
                              : ""}
                          </span>
                        </div>
                        <div style={{ width: "49%" }}>
                          <div>
                            {val?.changedColumns?.map((row: any, idx: any) => {
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    marginBottom: "5px",
                                    alignItems: "center",
                                  }}
                                >
                                  <p
                                    className="leftSideSection"
                                    style={{
                                      margin: 0,
                                    }}
                                  >
                                    {row?.name}
                                  </p>
                                  <p className="collen">:</p>
                                  <p
                                    style={{ margin: 0 }}
                                    className="rightSideSection"
                                    title={
                                      row?.name === "Project Status"
                                        ? Config.projectStatusMap[row?.value] ||
                                          row?.value
                                        : row?.value?.toString()
                                    }
                                  >
                                    {row?.name === "Project Status"
                                      ? Config.projectStatusMap[row?.value] ||
                                        row?.value
                                      : row?.value?.toString()}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </>
  );
};

export default ChangeLog;
