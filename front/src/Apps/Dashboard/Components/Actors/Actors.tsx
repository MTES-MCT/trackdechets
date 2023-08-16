import React from "react";
import { useMedia } from "use-media";
import { ActorsProps } from "./actorsTypes";
import {
  IconDestination,
  IconEmitter,
  IconTransporter,
} from "../../../common/Components/Icons/Icons";
import { MEDIA_QUERIES } from "../../../../common/config";

import "./actors.scss";

function Actors({
  emitterName,
  transporterName,
  destinationName,
}: ActorsProps) {
  const isMobile = useMedia({ maxWidth: MEDIA_QUERIES.handHeld });

  const truncate = label => {
    const maxVisible = 30;
    const maxSubstract = isMobile ? 10 : 9;
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
