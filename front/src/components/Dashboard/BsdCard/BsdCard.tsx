import React from "react";
import { createBsd } from "../../../mapper/bsdMapper";
import { BsdCardProps } from "./bsdCardTypes";

function BsdCard({ bsd }: BsdCardProps): JSX.Element {
  const bsdDisplay = createBsd(bsd);

  return (
    <div className="bsd-card">
      <p>id: {bsdDisplay?.id}</p>
    </div>
  );
}

export default BsdCard;
