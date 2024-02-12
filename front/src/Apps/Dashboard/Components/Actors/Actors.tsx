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
  const split = label => {
    const maxVisible = 40;
    const maxSubstract = 9;
    return label.length > maxVisible
      ? {
          firstPart: label.slice(0, label.length - maxSubstract),
          secondPart: label.slice(label.length - maxSubstract, label.length)
        }
      : {
          firstPart: label
        };
  };

  return (
    <div className="actors">
      {emitterName && (
        <div className="actors__item">
          <IconEmitter className="actors__emitter-icon" />
          <p className="actors__label" aria-label={emitterName}>
            <span className="actors__label--first">
              {split(emitterName).firstPart}
            </span>
            {split(emitterName).secondPart && (
              <span className="actors__label--second">
                {split(emitterName).secondPart}
              </span>
            )}
          </p>
        </div>
      )}
      {workerCompanyName && (
        <div className="actors__item">
          <IconWorker className="actors__worker-icon" />
          <p className="actors__label" aria-label={workerCompanyName}>
            <span className="actors__label--first">
              {split(workerCompanyName).firstPart}
            </span>
            {split(workerCompanyName).secondPart && (
              <span className="actors__label--second">
                {split(workerCompanyName).secondPart}
              </span>
            )}
          </p>
        </div>
      )}
      {transporterName && (
        <div className="actors__item">
          <IconTransporter className="actors__transporter-icon" />
          <p className="actors__label" aria-label={transporterName}>
            <span className="actors__label--first">
              {split(transporterName).firstPart}
            </span>
            {split(transporterName).secondPart && (
              <span className="actors__label--second">
                {split(transporterName).secondPart}
              </span>
            )}
          </p>
        </div>
      )}
      {destinationName && (
        <div className="actors__item">
          <IconDestination className="actors__destination-icon" />
          <p className="actors__label" aria-label={destinationName}>
            <span className="actors__label--first">
              {split(destinationName).firstPart}
            </span>
            {split(destinationName).secondPart && (
              <span className="actors__label--second">
                {split(destinationName).secondPart}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default Actors;
