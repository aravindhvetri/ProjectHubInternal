/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
// import styles from "./ProjectHubInternal.module.scss";
import type { IProjectHubInternalProps } from "./IProjectHubInternalProps";
import { sp } from "@pnp/sp/presets/all";
import { graph } from "@pnp/graph/presets/all";
import MainComponent from "./MainComponent";

export default class ProjectHubInternal extends React.Component<
  IProjectHubInternalProps,
  {}
> {
  constructor(prop: IProjectHubInternalProps, state: {}) {
    super(prop);
    sp.setup({
      spfxContext: this.props.context as unknown as undefined,
    });

    graph.setup({
      spfxContext: this.props.context as unknown as undefined,
    });
  }

  public render(): React.ReactElement<IProjectHubInternalProps> {
    return <MainComponent spfxContext={this.props.context} spContext={sp} />;
  }
}
