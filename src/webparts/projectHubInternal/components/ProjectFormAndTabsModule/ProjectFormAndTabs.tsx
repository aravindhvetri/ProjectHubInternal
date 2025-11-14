import * as React from "react";
import ProjectFormPage from "../Projects/ProjectsFormPage";
import ChildTabs from "../Childtabs/ChildTabs";
import styles from "./ProjectFormAndTabs.module.scss";

const ProjectFormAndTabs = (props: any) => {
  const [tabContentLoaded, setTabContentLoaded] = React.useState(false);
  const getTabContent = (boolean: any) => {
    setTabContentLoaded(boolean);
  };
  return (
    <div>
      <div className={styles.childTabsSection}>
        {props?.data?.ProjectStatus == "6" &&
        (props?.isView || props?.isEdit) ? (
          <ChildTabs
            Notify={props.Notify}
            loginUserEmail={props?.loginUserEmail}
            rowData={props?.data}
            getTabContent={getTabContent}
            spfxContext={props.spfxContext}
          />
        ) : (
          ""
        )}
      </div>
      <div>
        {tabContentLoaded == false ? (
          <ProjectFormPage
            loginUserEmail={props?.loginUserEmail}
            initialCRMProjectsListDropContainer={
              props.initialCRMProjectsListDropContainer
            }
            data={props.data}
            setLoader={props.setLoader}
            isAdd={props?.isAdd}
            isEdit={props?.isEdit}
            isView={props?.isView}
            goBack={() => props.goBack()}
            spfxContext={props.spfxContext}
            Notify={props.Notify}
            refresh={props?.refresh}
            setCurrentPage={props.setCurrentPage}
          />
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default ProjectFormAndTabs;
