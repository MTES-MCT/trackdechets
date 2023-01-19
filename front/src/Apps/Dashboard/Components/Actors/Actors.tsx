import React from "react";
import { ActorsProps } from "./actorsTypes";
import "./actors.scss";
import {
  IconDestination,
  IconEmitter,
  IconTransporter,
} from "../../../../common/components/Icons";

function Actors({ emitter, transporter, destination }: ActorsProps) {
  return (
    <div className="actors">
      {emitter?.company?.name && (
        <div className="actors__item">
          <IconEmitter className="actors__emitter-icon" />
          <p className="actors__label"> {emitter.company.name}</p>
        </div>
      )}
      {transporter?.company?.name && (
        <div className="actors__item">
          <IconTransporter className="actors__transporter-icon" />
          <p className="actors__label"> {transporter.company.name}</p>
        </div>
      )}
      {destination?.company?.name && (
        <div className="actors__item">
          <IconDestination className="actors__destination-icon" />
          <p className="actors__label"> {destination.company.name}</p>
        </div>
      )}
    </div>
  );
}

export default Actors;
