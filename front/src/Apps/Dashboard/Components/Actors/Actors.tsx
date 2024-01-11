import React from "react";
import { ActorsProps } from "./actorsTypes";
import {
  IconDestination,
  IconEmitter,
  IconTransporter,
  IconWorker
} from "../../../common/Components/Icons/Icons";

import "./actors.scss";

function Actors({
  emitterName,
  transporterName,
  destinationName,
  workerCompanyName
}: ActorsProps) {
  const truncate = label => {
    const maxVisible = 40;
    const maxSubstract = 9;
    return label.length > maxVisible
      ? label.substring(label.length - maxSubstract, label.length)
      : "";
  };
  return (
    <div className="actors">
      {emitterName && (
        <div className="actors__item">
          <IconEmitter className="actors__emitter-icon" />
          <p className="actors__label" data-truncate={truncate(emitterName)}>
            <span>{emitterName}</span>
          </p>
        </div>
      )}
      {workerCompanyName && (
        <div className="actors__item">
          <IconWorker className="actors__worker-icon" />
          <p
            className="actors__label"
            data-truncate={truncate(workerCompanyName)}
          >
            <span>{workerCompanyName}</span>
          </p>
        </div>
      )}
      {transporterName && (
        <div className="actors__item">
          <IconTransporter className="actors__transporter-icon" />
          <p
            className="actors__label"
            data-truncate={truncate(transporterName)}
          >
            <span>{transporterName}</span>
          </p>
        </div>
      )}
      {destinationName && (
        <div className="actors__item">
          <IconDestination className="actors__destination-icon" />
          <p
            className="actors__label"
            data-truncate={truncate(destinationName)}
          >
            <span>{destinationName}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default Actors;
