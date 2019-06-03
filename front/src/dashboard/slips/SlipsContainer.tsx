import React from "react";
import SlipsHeader from "./SlipsHeader";
import SlipsTabs from "./SlipsTabs";
import { Me } from "../../login/model";
import Onboarding from "./onboarding/Onboarding";

type Props = {
  me: Me;
  siret: string;
};

export default function SlipsContainer({ me, siret }: Props) {
  return (
    <React.Fragment>
      <SlipsHeader />
      <SlipsTabs me={me} siret={siret} />
      <Onboarding />
    </React.Fragment>
  );
}
