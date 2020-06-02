import React from "react";
import Onboarding from "./onboarding/Onboarding";
import SlipsHeader from "./SlipsHeader";
import SlipsTabs from "./SlipsTabs";

export default function SlipsContainer() {
  return (
    <>
      <SlipsHeader />
      <SlipsTabs />
      <Onboarding />
    </>
  );
}
