import * as React from "react";
import "../../../External/CSS/Style.css";
import Loading from "../../../External/Loader/Loading";
import Projects from "./Projects/Projects";
import { useEffect, useState, useRef } from "react";
import { Toast } from "primereact/toast";
import ProjectsFormPage from "./Projects/ProjectsFormPage";
import DealSheet from "./DealSheet/DealSheet";

const MainComponent = (props: any) => {
  // States Variables
  const [pageName, setPageName] = useState<string>("Projects");
  const [loader, setLoader] = useState<boolean>(true);
  const toast = useRef<Toast>(null);

  // Logged in User Email
  const loginUserEmail: string = props?.spfxContext?._pageContext?._user?.email;

  // Notification Function
  const Notify = (
    type: "info" | "success" | "warn" | "error" | "secondary" | "contrast",
    summary: string,
    msg: string,
  ) => {
    toast.current?.show({
      severity: type,
      summary: summary,
      detail: msg,
      life: 3000,
    });
  };

  const PageNavigation = (pageName: string) => {
    setPageName(pageName);
    setLoader(false);
  };

  useEffect(() => {
    setLoader(true);
    PageNavigation("Projects");
  }, []);

  return (
    <>
      {loader ? (
        <Loading />
      ) : (
        <div>
          <Toast ref={toast} />
          {pageName === "Projects" ? (
            <div>
              <Projects
                loginUserEmail={loginUserEmail}
                spfxContext={props.spfxContext}
                pageName={pageName}
                PageNavigation={PageNavigation}
                Notify={Notify}
              />
            </div>
          ) : pageName === "AddProject" ? (
            <div>
              <ProjectsFormPage
                spfxContext={props.spfxContext}
                pageName={pageName}
                PageNavigation={PageNavigation}
                Notify={Notify}
              />
            </div>
          ) : (
            ""
          )}
        </div>
      )}
    </>
  );
};

export default MainComponent;
