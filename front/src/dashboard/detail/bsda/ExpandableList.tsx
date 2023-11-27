/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from "react";

const DEFAULT_DISPLAY_NBR = 10;

interface Props {
  elements: any[];
}

const ExpandableList = ({ elements }: Props) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!elements || !elements.length) {
    return null;
  }

  if (elements.length <= DEFAULT_DISPLAY_NBR) {
    return elements.join(", ");
  }

  if (isExpanded) {
    return (
      <>
        {elements.join(", ")}
        <br />
        <a
          href="#"
          onClick={e => {
            setIsExpanded(false);
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          Voir moins...
        </a>
      </>
    );
  }

  return (
    <>
      {elements.slice(0, DEFAULT_DISPLAY_NBR).join(", ")}{" "}
      <i>et {elements.length - DEFAULT_DISPLAY_NBR} autre(s)</i>
      <br />
      <a
        href="#"
        onClick={e => {
          setIsExpanded(true);
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        Voir plus...
      </a>
    </>
  );
};

export default ExpandableList;
