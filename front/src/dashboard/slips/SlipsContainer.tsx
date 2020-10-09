import React from "react";
import Onboarding from "./onboarding/Onboarding";
import SlipsHeader from "./SlipsHeader";
import SlipsContent from "./SlipsContent";

export default function SlipsContainer() {
  return (
    <>
      <SlipsHeader />
      <SlipsContent />
      <Onboarding />
    </>
  );
}
