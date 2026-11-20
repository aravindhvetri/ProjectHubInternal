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
  const LoginUserName: string =
    props?.spfxContext?._pageContext?._user?.displayName;

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
    // PrimeReact shares one z-index stack. A dialog opened after an earlier
    // toast is placed above that toast. Lift this toast above any open mask
    // after ZIndexUtils has written its inline z-index.
    window.setTimeout(() => {
      const toastEl = document.querySelector(".p-toast") as HTMLElement | null;
      if (!toastEl) return;
      let maxDialogZ = 0;
      document.querySelectorAll(".p-dialog-mask").forEach((node) => {
        const z = parseInt(window.getComputedStyle(node).zIndex, 10);
        if (!Number.isNaN(z) && z > maxDialogZ) maxDialogZ = z;
      });
      const toastZ = parseInt(window.getComputedStyle(toastEl).zIndex, 10) || 0;
      if (maxDialogZ >= toastZ) {
        toastEl.style.setProperty("z-index", String(maxDialogZ + 2), "important");
      }
    }, 0);
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
          <Toast
            ref={toast}
            position="top-right"
            appendTo={typeof document !== "undefined" ? document.body : null}
          />
          {pageName === "Projects" ? (
            <div>
              <Projects
                LoginUserName={LoginUserName}
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
