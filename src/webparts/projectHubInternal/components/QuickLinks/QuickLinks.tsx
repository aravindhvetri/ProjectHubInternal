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
import styles from "./QuickLinks.module.scss";
import Loading from "../../../../External/Loader/Loading";
import { InputText } from "primereact/inputtext";
import { PrimaryButton } from "@fluentui/react";

const QuickLinks = (props: any) => {
  const [projectQuickLinksData, setProjectQuickLinksData] = useState<any>([]);
  const [searchText, setSearchText] = useState("");
  const [loader, setLoader] = React.useState<boolean>(false);
  const downloadImage: string = require("../../../../External/Images/download.png");

  //Get Project Quick links datas function:
  const getProjectQuickLinksDatas = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames?.QuickLinks,
      Select: "*,Project/Id",
      Expand: "Project",
      Orderby: "Modified",
      Orderbydecorasc: true,
      Filter: [
        {
          FilterKey: "IsActive",
          Operator: "eq",
          FilterValue: "1",
        },
        // {
        //   FilterKey: "ProjectId",
        //   Operator: "eq",
        //   FilterValue: `${props?.rowDataID}`,
        // },
      ],
    })
      .then((res: any) => {
        console.log("res", res);
        let projectQuickLinksDatas: any = [];
        res?.forEach((items: any) => {
          projectQuickLinksDatas.push({
            ID: items?.ID,
            DisplayName: items?.Title,
            Link: items?.Link?.Url,
          });
        });
        setProjectQuickLinksData([...projectQuickLinksDatas]);
        setLoader(false);
      })
      .catch((err) => {
        console.log(err, "Get Project Quick Links err in Quicklinks.tsx");
      });
  };

  //handle file download function:
  // const handleFileDownload = (url: string, fileName: string) => {
  //   const finalUrl = getDirectDownloadUrl(url);

  //   const a = document.createElement("a");
  //   a.href = finalUrl;
  //   a.download = fileName;
  //   a.style.display = "none";
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  // };

  // const getDirectDownloadUrl = (url: string) => {
  //   if (url.includes("download=1")) return url;

  //   // If already has query string
  //   if (url.includes("?")) {p '
  //     return url + "&download=1";
  //   } else {
  //     return url + "?download=1";
  //   }
  // };

  //handle search functionality :
  const filteredLinks = projectQuickLinksData?.filter((item: any) =>
    item.DisplayName?.toLowerCase().includes(searchText.toLowerCase()),
  );

  //Initial render:
  useEffect(() => {
    getProjectQuickLinksDatas();
    setLoader(true);
  }, []);
  return (
    <>
      {loader ? (
        <Loading />
      ) : (
        <div>
          <div className={styles.searchContainer}>
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
              <InputText
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="search here"
              />
            </div>
            <div>
              <PrimaryButton
                styles={RefreshButton}
                style={{
                  width: "30px",
                  minWidth: "0px",
                  height: "30px",
                  minHeight: "0px",
                }}
                iconProps={{ iconName: "refresh" }}
                className={styles.refresh}
                onClick={() => {
                  setLoader(true);
                  setSearchText("");
                  getProjectQuickLinksDatas();
                }}
              />
            </div>
          </div>
          <div className={styles.quicklinksContainer}>
            {filteredLinks?.length > 0 ? (
              filteredLinks.map((item: any) => (
                <div className={styles?.quicklinksChild} key={item.ID}>
                  <div className={styles.contentContainer}>
                    <div>
                      <span>{item.DisplayName}</span>
                    </div>
                    <div>
                      <img
                        src={downloadImage}
                        alt="no image"
                        style={{ width: "20px", height: "20px" }}
                        // onClick={() =>
                        //   handleFileDownload(item.Link, item.DisplayName)
                        // }
                        onClick={() => window.open(item.Link, "_blank")}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noRecords}>No records found !</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default QuickLinks;
