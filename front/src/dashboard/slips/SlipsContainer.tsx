import React from "react";
import Slips from "./Slips";
import SlipsHeader from "./SlipsHeader";

export default function SlipsContainer() {
  return (
    <React.Fragment>
      <SlipsHeader />
      <Slips />
    </React.Fragment>
  );
}
