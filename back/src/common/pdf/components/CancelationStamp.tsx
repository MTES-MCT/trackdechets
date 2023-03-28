import * as React from "react";

export function CancelationStamp() {
  return (
    <div
      className="Signature"
      style={{ position: "absolute", top: "8px", right: "8px" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 214 60"
        xmlns="http://www.w3.org/2000/svg"
        xmlSpace="preserve"
        fillRule="evenodd"
        clipRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={1.5}
      >
        <path
          d="M211 14.75C211 9.369 204.397 5 196.265 5H24.735C16.603 5 10 9.369 10 14.75v19.5C10 39.631 16.603 44 24.735 44h171.53C204.397 44 211 39.631 211 34.25v-19.5Z"
          fill="none"
          stroke="#d00"
          strokeWidth={4.72}
          //   transform="matrix(.65593 -.0871 .13164 .9913 -5.136 14.891)"
        />
        <text
          x={38}
          y={36.475}
          fontFamily="'Arial-Black','Arial Black',sans-serif"
          fontWeight={900}
          fontSize={30}
          fill="#d00"
          //   transform="rotate(-7.564 104.19 72.382)"
        >
          {"ANNUL\xC9"}
        </text>
      </svg>
    </div>
  );
}
