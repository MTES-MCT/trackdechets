import React from "react";
import SlipsHeader from "./SlipsHeader";
import SlipsTabs from "./SlipsTabs";
import { Me } from "../../login/model";

type Props = {
  me: Me;
};

export default function SlipsContainer({ me }: Props) {
  return (
    <React.Fragment>
      <SlipsHeader />
      <SlipsTabs me={me} />
    </React.Fragment>
  );
}
