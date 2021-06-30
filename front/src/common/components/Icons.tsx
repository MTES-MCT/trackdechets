import * as React from "react";
import classNames from "classnames";
import styles from "./Icons.module.scss";

/*
 * The following icons come from https://streamlineicons.com/,
 * for which we have a license.
 * To learn more about adding/updating the icons, see the guide in contributing.md.
 *
 * Also, you can preview the full list of icons by running the storybook.
 */

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  /**
   * The icon's color, which is inherited from the font color by default.
   */
  color?: "currentColor" | "blue" | "blueLight" | "white";

  /**
   * The icon's size, which is inherited from the font size by default.
   */
  size?: string;
}

export const IconChevronDown = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="square"
    strokeLinejoin="round"
    strokeMiterlimit="1.5"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor" strokeWidth="20">
      <path d="M19.569 41.569l44.862 44.862M108.431 42.569L64.569 86.431" />
    </g>
  </svg>
);

export const IconChevronUp = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="square"
    strokeLinejoin="round"
    strokeMiterlimit="1.5"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor" strokeWidth="20">
      <path d="M108.431 86.431L63.569 41.569M19.569 85.431l43.862-43.862" />
    </g>
  </svg>
);

export const IconDuplicateFile = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <path
      d="M2 6.4c0-.494.406-.9.9-.9h9.178a.997.997 0 0 1 .717.3l2.922 3.006a1 1 0 0 1 .283.7V22.6c0 .494-.406.9-.9.9H2.9a.904.904 0 0 1-.9-.9V6.4z"
      fill="none"
      stroke="currentColor"
    />
    <path
      d="M8 5.5V1.4c0-.494.406-.9.9-.9h9.178a1 1 0 0 1 .722.3l2.922 3.006a1 1 0 0 1 .283.7V17.6c0 .494-.406.9-.9.9H16"
      fill="none"
      stroke="currentColor"
    />
  </svg>
);

export const IconView = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 5.251C7.969 5.183 3.8 8 1.179 10.885a1.67 1.67 0 0 0 0 2.226C3.743 15.935 7.9 18.817 12 18.748c4.1.069 8.258-2.813 10.824-5.637a1.67 1.67 0 0 0 0-2.226C20.2 8 16.031 5.183 12 5.251z" />
      <path d="M15.75 12A3.768 3.768 0 0 1 12 15.749a3.768 3.768 0 0 1-3.75-3.75A3.768 3.768 0 0 1 12 8.249h.001a3.766 3.766 0 0 1 3.749 3.749V12z" />
    </g>
  </svg>
);

export const IconPdf = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 21 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor">
      <path d="M15.5 23.503H.5v-23h20v18l-5 5z" />
      <path d="M15.5 23.503v-5h5M4 6.503l2 2.5 4-5.5M4 14.503l2 2.5 4-5.5M11.5 7.503h6M11.5 15.503h6" />
    </g>
  </svg>
);

export const IconRefresh = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <path
      d="M.5 8.997l3 4.5 3.5-4m-3.469 3.937a9.806 9.806 0 0 1-.162-1.777c0-5.396 4.44-9.836 9.836-9.836s9.836 4.44 9.836 9.836-4.44 9.836-9.836 9.836a9.849 9.849 0 0 1-8.83-5.503"
      fill="none"
      stroke="currentColor"
    />
  </svg>
);

export const IconShipmentSignSmartphone = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20.25 18.04V21A2.25 2.25 0 0 1 18 23.25h-4.519a2.25 2.25 0 0 1-2.25-2.25v-8.96a2.25 2.25 0 0 1 2.25-2.25h3.769M11.231 20.25h9" />
      <path d="M20.747 10.066l-6.34 4.794-.926 2.661 2.812-.168 6.339-4.8a1.559 1.559 0 0 0 .3-2.182l-.005-.008a1.558 1.558 0 0 0-2.18-.297zM12.75 6.75V4.5a1.5 1.5 0 0 0-.829-1.342l-4.5-2.25a1.502 1.502 0 0 0-1.342 0l-4.5 2.25A1.5 1.5 0 0 0 .75 4.5v4.9a1.5 1.5 0 0 0 .829 1.342l4.5 2.249c.422.211.92.211 1.342 0l.758-.379" />
      <path d="M12.513 3.692L6.75 6.573.987 3.692M6.75 6.573v6.573" />
    </g>
  </svg>
);

export const IconPaperWrite = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13.045 18.636l-3.712.53.53-3.712 9.546-9.546a2.25 2.25 0 1 1 3.182 3.182l-9.546 9.546zM12.75 1.499a.75.75 0 0 0-.75-.75H6a.75.75 0 0 0-.75.75v1.5c0 .414.336.75.75.75h6a.75.75 0 0 0 .75-.75v-1.5zM12.75 2.249h3a1.5 1.5 0 0 1 1.5 1.5" />
      <path d="M17.25 18.749v3a1.5 1.5 0 0 1-1.5 1.5H2.25a1.5 1.5 0 0 1-1.5-1.5v-18a1.5 1.5 0 0 1 1.5-1.5h3M5.25 8.249h7.5M5.25 12.749h3" />
    </g>
  </svg>
);

export const IconTrash = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <path
      d="M23 28H9c-1.097 0-2-.903-2-2V8h18v18c0 1.097-.903 2-2 2zm-10-6v-8m6 8v-8M3 8h26M19 4h-6c-1.097 0-2 .903-2 2v2h10V6c0-1.097-.903-2-2-2z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

export const IconWarehouseDelivery = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor">
      <path
        d="M10 18.667V20M10 14.667V16M10 22.667V24M10 27.333c0 .732.601 1.334 1.333 1.334M16 19.333h10.667a.67.67 0 0 1 .666.667v8.667H16a.67.67 0 0 1-.667-.667v-8a.67.67 0 0 1 .667-.667z"
        strokeWidth="1.33333"
      />
      <path
        d="M31.333 28a.67.67 0 0 1-.666.667h-3.334v-7.271l2.162.72a2.692 2.692 0 0 1 1.838 2.55V28zM15.333 14V8a.67.67 0 0 0-.666-.667h-8A.67.67 0 0 0 6 8v6M.667 6.667l10-6 10 6M18 14V5.067M3.333 5.067L3.336 14M16.667 28.667v.666c0 1.098.902 2 2 2 1.097 0 2-.902 2-2v-.666M25.333 28.667v.666c0 1.098.903 2 2 2 1.098 0 2-.902 2-2v-.666"
        strokeWidth="1.33333"
      />
    </g>
  </svg>
);

export const IconWarehouseStorage = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor">
      <path
        d="M16 2.667c-8.897 0-13.43 3.548-14.444 4.457a.666.666 0 0 0-.223.496V10a.67.67 0 0 0 .667.667h28a.67.67 0 0 0 .667-.667V7.62c0-.19-.082-.37-.223-.496-1.015-.91-5.547-4.457-14.444-4.457zM2.667 10.667v18.666M29.333 10.667v18.666M7.333 21.333H16v8H7.333a.67.67 0 0 1-.666-.666V22a.67.67 0 0 1 .666-.667zM16 21.333h8.667a.67.67 0 0 1 .666.667v6.667a.67.67 0 0 1-.666.666H16v-8zM11.333 13.333h8A.67.67 0 0 1 20 14v7.333h-9.333V14a.67.67 0 0 1 .666-.667z"
        strokeWidth="1.33333"
      />
      <path
        d="M13.333 13.333h4v4h-4zM9.333 21.333h4v3.334a.67.67 0 0 1-.666.666H10a.67.67 0 0 1-.667-.666v-3.334zM18.667 21.333h4v3.334a.67.67 0 0 1-.667.666h-2.667a.67.67 0 0 1-.666-.666v-3.334zM13.667 6.667h4.666"
        strokeWidth="1.33333"
      />
    </g>
  </svg>
);

export const IconWaterDam = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M20 18l6.553-3.276a1 1 0 0 1 1.447.895v13.38c0 1.098-.903 2-2 2H4c-1.097 0-2-.902-2-2V18L4.83 4.79c.1-.458.509-.79.978-.79h2.384c.47 0 .879.332.977.79L12 18l6.553-3.276a1 1 0 0 1 1.447.895V18M12 23h4M12 27h4M20 23h4M20 27h4M12.007 1.159A9.265 9.265 0 0 1 16 1.988C25.905 6.216 30 1 30 1"
        strokeWidth="1.9999949999999997"
      />
    </g>
  </svg>
);

export const IconRenewableEnergyEarth = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor">
      <path
        d="M19.2.752c-2.655.241-4.525 1.75-2.17 5.553-1.631 4.164.203 5.334 3.135 5.067 2.698-.245 6.918-3.459 8.378-6.648a.668.668 0 0 0-.493-.933C24.492 3.176 22.292.472 19.2.752zM9.667 9.532S18.933 4.215 24 5.436"
        strokeWidth="1.33333"
      />
      <path
        d="M1.333 31.268a.67.67 0 0 1-.666-.667v-9.725L2.503 7.843a.669.669 0 0 1 .66-.575h2.072c.316 0 .59.224.653.533l2.445 11.775 5.971-3.879a.67.67 0 0 1 1.03.56v3.319l7.03-3.956a.667.667 0 0 1 .993.58v3.407l6.978-4a.67.67 0 0 1 .999.577v14.417a.67.67 0 0 1-.667.667H1.333z"
        strokeWidth="1.33333"
      />
    </g>
  </svg>
);

export const IconWarehousePackage = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M7.007 6.95v8c0 .549.452 1 1 1h16c.548 0 1-.451 1-1v-8"
        strokeWidth="1.3"
      />
      <path
        d="M25.007 6.95h-18s0-5.9 9-5.9c8.357 0 9 5.9 9 5.9zM11.007 30.35a.64.64 0 0 1-.667.6H3.673a.64.64 0 0 1-.666-.6v-4.8a.64.64 0 0 1 .666-.6h6.667a.637.637 0 0 1 .667.6v4.8zM7.007 24.95v2M29.007 30.35a.64.64 0 0 1-.667.6h-6.667a.64.64 0 0 1-.666-.6v-4.8a.64.64 0 0 1 .666-.6h6.667a.637.637 0 0 1 .667.6v4.8zM25.007 24.95v2M12.007 10.95h8v5h-8zM7.007 21.9v-1.3a.655.655 0 0 1 .65-.65h16.7c.356 0 .65.294.65.65v1.3M16.007 19.95v-4"
        strokeWidth="1.3"
      />
    </g>
  </svg>
);

export const IconSearch = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <path
      d="M1.963 17.81c2.593 6.1 9.746 8.987 15.847 6.394 6.102-2.593 8.988-9.746 6.395-15.848-2.593-6.1-9.746-8.987-15.847-6.394C2.256 4.554-.63 11.708 1.963 17.809zM21.628 21.627L31 31"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9999949999999997"
    />
  </svg>
);

export const IconTriangleDown = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <path d="M61.5 119.422l-32-50h64l-32 50z" fill="currentColor" />
  </svg>
);

export const IconTriangleUp = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <path d="M61.5 10.422l32 50h-64l32-50z" fill="currentColor" />
  </svg>
);

export const IconTriangleUpAndDown = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <path
      d="M61.5 10.422l32 50h-64l32-50zM61.5 119.422l-32-50h64l-32 50z"
      fill="currentColor"
    />
  </svg>
);

export const IconLeftArrow = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M31 16H1M15 2L1 16l14 14" strokeWidth="1.9999949999999997" />
    </g>
  </svg>
);

export const IconClose = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M1 30.999l30-30M31 30.999l-30-30"
        strokeWidth="1.9999949999999997"
      />
    </g>
  </svg>
);

export const IconLayout2 = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M2 1.996h28v28H2zM2 9.996h28M16 29.996v-20M2 19.996h28"
        strokeWidth="1.9999949999999997"
      />
    </g>
  </svg>
);

export const IconLayoutModule1 = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M1 .996h12v12H1zM1 18.996h12v12H1zM19 .996h12v12H19zM19 18.996h12v12H19z"
        strokeWidth="1.9999949999999997"
      />
    </g>
  </svg>
);

export const IconBusTransfer = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M29 9.017l-3 3-3-3" strokeWidth="1.9999949999999997" />
      <path
        d="M19 4.017h3c2.195 0 4 1.806 4 4v4M3 23.017l3-3 3 3"
        strokeWidth="1.9999949999999997"
      />
      <path
        d="M13 28.017h-3c-2.195 0-4-1.805-4-4v-4M18 16.017h13v13H18zM20 29.017v2M29 29.017v2M18 22.017h13M21.5 25.017c.275 0 .5.226.5.5M21 25.517c0-.274.225-.5.5-.5M21.5 26.017a.502.502 0 0 1-.5-.5M22 25.517c0 .275-.225.5-.5.5M27.5 25.017c.275 0 .5.226.5.5M27 25.517c0-.274.225-.5.5-.5M27.5 26.017a.502.502 0 0 1-.5-.5M28 25.517c0 .275-.225.5-.5.5M1 1.017h13v13H1zM3 14.017v2M12 14.017v2M1 7.017h13M4.5 10.017c.275 0 .5.226.5.5M4 10.517c0-.274.225-.5.5-.5M4.5 11.017a.502.502 0 0 1-.5-.5M5 10.517c0 .275-.225.5-.5.5M10.5 10.017c.275 0 .5.226.5.5M10 10.517c0-.274.225-.5.5-.5M10.5 11.017a.502.502 0 0 1-.5-.5M11 10.517c0 .275-.225.5-.5.5"
        strokeWidth="1.9999949999999997"
      />
    </g>
  </svg>
);

export const IconCogApproved = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M28.912 12.52c-.123.45-.372.856-.719 1.168l-1.296 1.17a2.437 2.437 0 0 0 0 3.62l1.296 1.17c.512.461.806 1.12.806 1.81 0 1.337-1.1 2.437-2.438 2.437-.042 0-.084 0-.126-.003l-1.744-.09c-.042-.002-.083-.002-.123-.002a2.449 2.449 0 0 0-2.435 2.561l.09 1.744c.002.044.004.087.004.13a2.45 2.45 0 0 1-2.438 2.438c-.69 0-1.35-.293-1.812-.806l-1.17-1.296a2.437 2.437 0 0 0-3.619 0l-1.17 1.296a2.439 2.439 0 0 1-1.811.805 2.45 2.45 0 0 1-2.434-2.567l.094-1.744c.002-.041.002-.082.002-.124 0-1.337-1.1-2.437-2.437-2.437-.041 0-.083 0-.124.003l-1.744.089A2.449 2.449 0 0 1 1 21.457c0-.69.293-1.348.805-1.809l1.296-1.17a2.437 2.437 0 0 0 0-3.62l-1.296-1.17A2.438 2.438 0 0 1 1 11.878a2.45 2.45 0 0 1 2.56-2.434l1.744.09A2.45 2.45 0 0 0 7.869 7.1c0-.044 0-.085-.002-.126L7.773 5.23a2.45 2.45 0 0 1 2.433-2.57c.691 0 1.35.294 1.811.806l1.171 1.296a2.438 2.438 0 0 0 3.619 0l1.17-1.296a2.445 2.445 0 0 1 2.743-.614"
        strokeWidth="1.9999949999999997"
      />
      <path
        d="M10.133 14.188l3.351 4.468a2.002 2.002 0 0 0 3.13.088L30.996 1.668"
        strokeWidth="1.9999949999999997"
      />
    </g>
  </svg>
);

export const IconProfile = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="0"
    width={size}
    height={size}
  >
    <path
      d="M16.191 31.666c-.063 0-.127.003-.192.003-8.594 0-15.667-7.074-15.667-15.667C.332 7.406 7.405.335 15.999.335h.192c8.521.103 15.475 7.143 15.475 15.667 0 8.52-6.954 15.56-15.475 15.664zm-7.813-5.865a12.488 12.488 0 0 0 7.813 2.73 12.482 12.482 0 0 0 8.093-2.963 10.932 10.932 0 0 0-7.844-3.301A10.949 10.949 0 0 0 8.378 25.8zM6.19 23.55a14.07 14.07 0 0 1 10.25-4.418 14.062 14.062 0 0 1 9.969 4.126 12.53 12.53 0 0 0 2.314-7.256c0-6.876-5.656-12.533-12.532-12.533C9.318 3.47 3.66 9.126 3.66 16.002c0 2.723.888 5.376 2.53 7.55v-.002zm10.001-5.983c-3.438 0-6.267-2.83-6.267-6.268 0-3.438 2.83-6.267 6.267-6.267 3.438 0 6.268 2.83 6.268 6.267 0 3.438-2.83 6.268-6.268 6.268zm0-3.135a3.148 3.148 0 0 0 3.133-3.133 3.148 3.148 0 0 0-3.133-3.132 3.148 3.148 0 0 0-3.132 3.132 3.148 3.148 0 0 0 3.132 3.133z"
      fill="currentColor"
    />
  </svg>
);

export const IconQuestionCircle = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 140"
    width={size}
    height={size}
  >
    <g fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path
        d="M52.5 52.5a17.5 17.5 0 1123.333 16.503A8.75 8.75 0 0070 77.257v5.868M70 100.625a2.188 2.188 0 102.188 2.188A2.188 2.188 0 0070 100.624h0"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={8.749995}
      />
      <path
        d="M4.375 70a65.625 65.625 0 10131.25 0 65.625 65.625 0 10-131.25 0z"
        strokeMiterlimit={10}
        strokeWidth={8.749995}
      />
    </g>
  </svg>
);

export const IconPasswordKey = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 140"
    width={size}
    height={size}
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    >
      <path
        d="M65.543 115.173a17.5 17.5 0 1035 0 17.5 17.5 0 10-35 0z"
        strokeWidth={8.749995}
      />
      <path
        d="M95.416 102.795l30.934-30.934 9.28 9.28M113.978 84.233l6.189 6.19M135.63 53.923V14.548a8.75 8.75 0 00-8.75-8.75H13.13a8.75 8.75 0 00-8.75 8.75v96.25a8.75 8.75 0 008.75 8.75h30.62M4.38 32.048h131.25"
        strokeWidth={8.749995}
      />
    </g>
  </svg>
);

export const IconEmailActionUnread = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 140"
    width={size}
    height={size}
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    >
      <path d="M8.75 27.708h122.5v87.5H8.75z" strokeWidth={8.749995} />
      <path
        d="M129.273 30.917l-47.507 36.54a19.297 19.297 0 01-23.532 0l-47.506-36.54"
        strokeWidth={8.749995}
      />
    </g>
  </svg>
);

export const IconCopyPaste = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 140"
    width={size}
    height={size}
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    >
      <path
        d="M118.125 48.12v-17.5a8.75 8.75 0 00-8.75-8.75H86.042M36.458 21.87H13.125a8.75 8.75 0 00-8.75 8.75v96.25a8.75 8.75 0 008.75 8.75h35"
        strokeWidth={8.749995}
      />
      <path
        d="M84.122 27.627a4.38 4.38 0 01-4.153 2.992H42.531a4.38 4.38 0 01-4.154-2.992l-5.833-17.5a4.37 4.37 0 014.153-5.758h49.105a4.37 4.37 0 014.154 5.758zM65.625 65.62h70v70h-70zM83.125 83.12h35M83.125 100.62h35M83.125 118.12H96.25"
        strokeWidth={8.749995}
      />
    </g>
  </svg>
);

export const IconLockShield = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 140"
    width={size}
    height={size}
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    >
      <path d="M39.375 56.875h61.25v43.75h-61.25z" strokeWidth={8.749995} />
      <path
        d="M70 76.563a2.188 2.188 0 102.188 2.187A2.182 2.182 0 0070 76.562h0M48.125 56.875V43.75a21.875 21.875 0 0143.75 0v13.125"
        strokeWidth={8.749995}
      />
      <path
        d="M70 135.625C31.057 125.235 4.375 102.142 4.375 61.25V4.375h131.25V61.25c0 40.862-26.64 63.974-65.625 74.375z"
        strokeWidth={8.749995}
      />
    </g>
  </svg>
);

export const IconSignBadgeCircle = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 140"
    width={size}
    height={size}
  >
    <path
      d="M4.375 70a65.625 65.625 0 10131.25 0 65.625 65.625 0 10-131.25 0z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={8.749995}
    />
  </svg>
);

export const IconCheckCircle1 = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 140"
    width={size}
    height={size}
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    >
      <path
        d="M35 77.134l14.292 20.283a6.12 6.12 0 009.957.297L105 39.83"
        strokeWidth={8.749995}
      />
      <path
        d="M4.375 69.994a65.625 65.625 0 10131.25 0 65.625 65.625 0 10-131.25 0z"
        strokeWidth={8.749995}
      />
    </g>
  </svg>
);

export const IconLock1 = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 140"
    width={size}
    height={size}
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    >
      <path
        d="M21.875 56.875h96.25v78.75h-96.25zM39.375 56.875V35a30.625 30.625 0 0161.25 0v21.875M70 87.5V105"
        strokeWidth={8.749995}
      />
    </g>
  </svg>
);

export const IconSingleNeutralIdCard4 = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 140"
    width={size}
    height={size}
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    >
      <path
        d="M32.813 50.313a15.313 15.313 0 1030.624 0 15.313 15.313 0 10-30.624 0zM21.875 96.25a26.25 26.25 0 0152.5 0zM83.125 52.5h26.25M83.125 70h35"
        strokeWidth={8.749995}
      />
      <path
        d="M126.875 17.5H13.125a8.75 8.75 0 00-8.75 8.75v87.5a8.75 8.75 0 008.75 8.75h17.5a8.75 8.75 0 0117.5 0h43.75a8.75 8.75 0 0117.5 0h17.5a8.75 8.75 0 008.75-8.75v-87.5a8.75 8.75 0 00-8.75-8.75z"
        strokeWidth={8.749995}
      />
    </g>
  </svg>
);

export const IconPhone = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 140"
    width={size}
    height={size}
  >
    <path
      d="M87.733 130.608l.07.041a32.276 32.276 0 0040.157-4.404l4.515-4.515a10.768 10.768 0 000-15.22L113.452 87.5a10.768 10.768 0 00-15.219 0h0a10.75 10.75 0 01-15.213 0L52.582 57.056a10.768 10.768 0 010-15.22h0a10.75 10.75 0 000-15.213L33.565 7.583a10.768 10.768 0 00-15.22 0l-4.514 4.515a32.288 32.288 0 00-4.41 40.157l.046.07a291.288 291.288 0 0078.266 78.283z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={8.749995}
    />
  </svg>
);

export const IconArrowLeft1 = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 140"
    width={size}
    height={size}
  >
    <path
      d="M94.792 135.625L32.258 73.092a4.37 4.37 0 010-6.184L94.792 4.375"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={8.749995}
    />
  </svg>
);

export const IconArrowRight1 = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 140"
    width={size}
    height={size}
  >
    <path
      d="M32.083 4.375l62.534 62.533a4.37 4.37 0 010 6.184l-62.534 62.533"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={8.749995}
    />
  </svg>
);

export const IconDelete1 = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 140"
    width={size}
    height={size}
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    >
      <path
        d="M4.363 70a65.625 65.625 0 10131.25 0 65.625 65.625 0 10-131.25 0zM43.738 96.25l52.494-52.5M96.238 96.25l-52.506-52.5"
        strokeWidth={8.749995}
      />
    </g>
  </svg>
);

export const IconCheckShield = ({
  color = "currentColor",
  size = "1em",
  ...props
}: IconProps) => (
  <svg
    {...props}
    className={classNames(props.className, {
      [styles.blue]: color === "blue",
      [styles.blueLight]: color === "blueLight",
      [styles.white]: color === "white",
    })}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 140"
    width={size}
    height={size}
    {...props}
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    >
      <path
        d="M39.375 64.476l14.292 20.306a6.125 6.125 0 009.957.297l45.751-57.907"
        strokeWidth={8.749995}
      />
      <path
        d="M17.5 4.37a8.75 8.75 0 00-8.75 8.75v52.5c0 28.075 42.198 59.318 56.542 68.6a8.616 8.616 0 009.415 0c14.345-9.282 56.543-40.525 56.543-68.6v-52.5a8.75 8.75 0 00-8.75-8.75z"
        strokeWidth={8.749995}
      />
    </g>
  </svg>
);

export function IconBSDD(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 21 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        stroke="currentColor"
        strokeWidth={0.968}
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2.935 22.742V2.419M18.419 2.419v20.323M1 2.419h19.355M1 22.742h19.355M16 15.968h4.355M1 15.968h4.839M16.484 9.194h3.871M1 9.194h3.871M17.452 2.42V.967a.484.484 0 00-.484-.484h-2.903a.484.484 0 00-.484.484v1.451M10.677 15.484v1.451M8.742 16.935V15.12a3.262 3.262 0 01-1.936-3.023 3.871 3.871 0 017.742 0 3.26 3.26 0 01-1.935 3.022v1.816M11.887 11.613c.134 0 .242.108.242.242M11.645 11.855c0-.134.108-.242.242-.242M11.887 12.097a.242.242 0 01-.242-.242M12.129 11.855a.242.242 0 01-.242.242M9.468 11.613c.133 0 .242.108.242.242M9.226 11.855c0-.134.108-.242.242-.242M9.468 12.097a.242.242 0 01-.242-.242M9.71 11.855a.242.242 0 01-.242.242" />
      </g>
    </svg>
  );
}

export function IconBSDasri(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 140 140"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M70 113.75v23.333M49.583 2.917h40.828M49.59 49.583h17.488M49.59 72.917h17.488M49.583 32.083v58.334A22.02 22.02 0 0070 113.75a22.032 22.032 0 0020.417-23.333V32.083zM61.256 2.917H78.75v29.166H61.256zM32.083 32.083h75.828"
          strokeWidth="5.83333"
        />
      </g>
    </svg>
  );
}

export function IconBSVhu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 140 140"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill="none" stroke="#000">
        <path
          d="M8.487 95.556a11.25 11.25 0 01-3.89-7.584 11.273 11.273 0 014.485-9.957l12.956-12.384L31.5 44.6a11.893 11.893 0 019.864-6.947l33.378-2.765a11.89 11.89 0 0110.115 4.241l18.568 19.717 22.347 6.381c6.487 1.377 10.722 7.8 9.439 14.304-1.056 5.325-5.548 9.333-10.961 9.782l-4.013.333M97.72 91.513l-45.558 3.78"
          strokeWidth="5.83333"
        />
        <path
          d="M97.597 94.453c.502 6.014 5.589 10.699 11.626 10.699 6.4 0 11.667-5.268 11.667-11.667 0-6.4-5.268-11.667-11.667-11.667-.32 0-.641.012-.962.041-6.014.496-10.704 5.588-10.704 11.626 0 .327.011.647.04.968zM7.11 99.318c0-3.202 2.632-5.833 5.834-5.833h2.917a3.276 3.276 0 003.196-2.56c1.208-5.292 5.95-9.078 11.375-9.078s10.168 3.786 11.375 9.077a3.293 3.293 0 003.203 2.56h2.917c3.202 0 5.833 2.632 5.833 5.834 0 3.203-2.63 5.834-5.833 5.834h-35c-3.191-.012-5.816-2.643-5.816-5.834zM86.222 63.204L75.25 49.362a6.305 6.305 0 00-5.448-2.334l-16.999 1.389a2.929 2.929 0 00-2.677 2.905c0 .081.006.163.011.245l.963 11.625a2.929 2.929 0 002.905 2.678c.082 0 .163-.006.245-.012l31.972-2.654z"
          strokeWidth="5.83333"
        />
      </g>
    </svg>
  );
}

export function IconBSDa(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 25 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill="none" fillRule="evenodd" stroke="#000">
        <g stroke="#000" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23.278 20.128A3 3 0 0120.3 23.5H4.1a3 3 0 01-2.978-3.372L2.7 7.5h19l1.578 12.628zM6.2 5H4.766a1 1 0 00-.857.486L2.7 7.5h19l-1.209-2.014A1 1 0 0019.634 5H18.2" />
          <path d="M16.2 4.5a4 4 0 10-8 0v3h8v-3z" />
        </g>
        <text
          fontFamily="SourceSansPro-Semibold, Source Sans Pro"
          fontSize="16"
          fontWeight="500"
          fill="#000"
          transform="translate(1)"
        >
          <tspan x="7.2" y="20">
            a
          </tspan>
        </text>
      </g>
    </svg>
  );
}
