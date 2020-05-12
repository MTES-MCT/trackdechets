import React from "react";
import SlipsHeader from "./SlipsHeader";
import SlipsTabs from "./SlipsTabs";
import Onboarding from "./onboarding/Onboarding";
import { User } from "../../generated/graphql/types";

type Props = {
  me: User;
  siret: string;
};

export default function SlipsContainer({ me, siret }: Props) {
  return (
    <>
      <SlipsHeader />
      <SlipsTabs me={me} siret={siret} />
      <Onboarding />
    </>
  );
}
