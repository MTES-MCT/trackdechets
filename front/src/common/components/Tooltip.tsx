import React from "react";
import { IconQuestionCircle } from "common/components/Icons";
import { Tooltip } from "@reach/tooltip";
import style from "./Tooltip.module.scss";

type Props = {
  msg?: string;
};

/**
 * Icon displaying help text when hovered
 * @param msg string
 */

const TdTooltip = ({ msg }: Props) => {
  return !!msg ? (
    <Tooltip
      label={msg}
      aria-label={msg}
      style={{
        background: "hsla(0, 0%, 0%, 0.75)",
        color: "white",
        border: "none",
        borderRadius: "3px",
        padding: "0.5em 1em",
        whiteSpace: "pre-wrap",
        zIndex: 999,
      }}
    >
      <button className={style.tdTooltip} type="button">
        <IconQuestionCircle color="blue" size="20px" />
      </button>
    </Tooltip>
  ) : null;
};

export default TdTooltip;
