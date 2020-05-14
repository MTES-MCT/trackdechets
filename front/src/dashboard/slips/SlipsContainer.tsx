import React from "react";
import { Me } from "../../login/model";
import Onboarding from "./onboarding/Onboarding";
import SlipsHeader from "./SlipsHeader";
import SlipsTabs from "./SlipsTabs";
import { User } from "../../generated/graphql/types";

type Props = {
  me: User;
  siret: string;
};

export default function SlipsContainer({ siret }: Props) {
  return (
    <>
      <SlipsHeader />
      <SlipsTabs siret={siret} />
      <Onboarding />
    </>
  );
}
