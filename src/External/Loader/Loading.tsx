/* eslint-disable react/self-closing-comp */
import * as React from "react";
import "../Loader/Loading.css";

const Loading = (): JSX.Element => {
  return (
    <div className="shapeCenter">
      {/* <div className="shape">
        <div className="shapes-7"></div>
      </div> */}
      <div className="spinner">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
};

export default Loading;
