import React from "react";

type ButtonProps = {
  onClick?: Function;
  caption?: string;
};
export const NextButton = ({ onClick, caption = "Suivant" }: ButtonProps) => (
  <button className="btn btn--primary" onClick={() => !!onClick && onClick()}>
    <span>{caption}</span>
    <span className="tw-ml-3">›</span>
  </button>
);
export const PreviousButton = ({
  onClick,
  caption = "Précédent"
}: ButtonProps) => (
  <button
    className="btn btn--outline-primary"
    onClick={() => !!onClick && onClick()}
  >
    <span className="tw-mr-1">‹</span>
    <span>{caption}</span>
  </button>
);
