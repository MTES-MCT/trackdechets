import React from "react";
import { usePopperTooltip } from "react-popper-tooltip";
import { IconQuestionCircle } from "common/components/Icons";
import style from "./Tooltip.module.scss";

type Props = {
  msg?: string;
};

/**
 * Icon displaying help text when hovered
 * @param msg string
 */

const TdTooltip = ({ msg }: Props) => {
  const {
    getArrowProps,
    getTooltipProps,
    setTooltipRef,
    setTriggerRef,
    visible,
  } = usePopperTooltip({
    offset: [0, 10],
    placement: "top",
  });

  return !!msg ? (
    <>
      <span className={style.button} role="tooltip" ref={setTriggerRef}>
        <IconQuestionCircle color="blue" size="20px" />
      </span>
      {visible && (
        <div
          ref={setTooltipRef}
          {...getTooltipProps({ className: style.tooltip })}
        >
          <div {...getArrowProps({ className: style.arrow })} />
          {msg}
        </div>
      )}
    </>
  ) : null;
};

export default TdTooltip;
