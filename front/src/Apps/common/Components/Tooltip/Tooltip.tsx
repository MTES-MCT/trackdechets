import React, { useId } from "react";

type TooltipProps = {
  title?: string;
  type?: "click" | "hover";
  className?: string;
  children?: React.ReactNode;
};

export const Tooltip = ({
  title,
  type = "hover",
  className = "",
  children
}: TooltipProps) => {
  const id = useId();

  if (!title) {
    return null;
  }

  const TooltipSpan = () => (
    <span
      className={"fr-tooltip fr-placement"}
      id={id}
      role="tooltip"
      aria-hidden="true"
    >
      {title}
    </span>
  );

  return (
    <>
      {type === "click" ? (
        <button
          className={`fr-btn--tooltip fr-btn ${className}`}
          aria-describedby={id}
          id={`tooltip-owner-${id}`}
          type="button"
        >
          Informations contextuelles
        </button>
      ) : typeof children === "undefined" ? (
        <i
          className={`fr-icon--sm fr-icon-question-line ${className}`}
          style={{ color: "var(--text-action-high-blue-france)" }}
          aria-describedby={id}
          id={`tooltip-owner-${id}`}
        ></i>
      ) : (
        <span aria-describedby={id} id={`tooltip-owner-${id}`}>
          {children}
        </span>
      )}
      <TooltipSpan />
    </>
  );
};

export default Tooltip;
