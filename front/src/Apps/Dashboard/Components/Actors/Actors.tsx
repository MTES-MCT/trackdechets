import React from "react";
import { ActorsProps } from "./actorsTypes";
import "./actors.scss";
import {
  IconDestination,
  IconEmitter,
  IconTransporter,
} from "../../../../common/components/Icons";

function Actors({
  emitterName,
  transporterName,
  destinationName,
}: ActorsProps) {
  return (
    <div className="actors">
      {emitterName && (
        <div className="actors__item">
          <IconEmitter className="actors__emitter-icon" />
          <p className="actors__label"> {emitterName}</p>
        </div>
      )}
      {transporterName && (
        <div className="actors__item">
          <IconTransporter className="actors__transporter-icon" />
          <p className="actors__label"> {transporterName}</p>
        </div>
      )}
      {destinationName && (
        <div className="actors__item">
          <IconDestination className="actors__destination-icon" />
          <p className="actors__label"> {destinationName}</p>
        </div>
      )}
    </div>
  );
}

export default Actors;
