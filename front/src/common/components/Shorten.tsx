import React from "react";
import Tooltip from "@reach/tooltip";
import "@reach/tooltip/styles.css";
type Props = {
  content: string;
  maxLength?: number;
};

/**
 *
 * Shorten strings longer than maxLength chars and display an hoverable toolitp to read full string
 */
export default function Shorten({ content, maxLength = 20 }: Props) {
  const mustShorten = content.length >= maxLength;
  if (!mustShorten) {
    return <span>{content}</span>;
  }
  return (
    <Tooltip
      label={content}
      aria-label={content}
      style={{
        background: "hsla(0, 0%, 0%, 0.75)",
        color: "white",
        border: "none",
        borderRadius: "3px",
        padding: "0.5em 1em",
      }}
    >
      <span style={{ cursor: "pointer" }}>
        {`${content.substring(0, maxLength).trim()}…`}
      </span>
    </Tooltip>
  );
}
