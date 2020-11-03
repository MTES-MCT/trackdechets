import React from "react";
import { Question } from "common/components/Icons";
import { COLORS } from "common/config";
import Tooltip from "@reach/tooltip";
import "@reach/tooltip/styles.css";
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
      }}
    >
      <button className={style.tdTooltip} type="button">
        <Question color={COLORS.blue} size={20} />
      </button>
    </Tooltip>
  ) : null;
};

export default TdTooltip;
