import * as React from "react";
// import styles from './Reports.module.scss';
import type { IReportsProps } from "./IReportsProps";
import { sp } from "@pnp/sp";
import MainComponent from "./MainComponent";

export default class Reports extends React.Component<IReportsProps, {}> {
  constructor(prop: IReportsProps, state: {}) {
    super(prop);
    sp.setup({
      spfxContext: this.props.context as any,
    });
  }

  public render(): React.ReactElement<IReportsProps> {
    return <MainComponent context={this.props.context} />;
  }
}
