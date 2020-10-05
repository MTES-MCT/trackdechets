import React from "react";
const WHITE = "#FFFFFF";
const DEFAULT_DIMENSION = 24;
/**
 * Svg icons coming from https://streamlineicons.com/
 * Vector data optimized with svgo cli utility
 * Original icons names have been kept
 *
 */
type IconProps = {
  color?: string;
  size?: number;
};

export const ChevronDown = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="square"
    strokeLinejoin="round"
    strokeMiterlimit="1.5"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color} strokeWidth="20">
      <path d="M19.569 41.569l44.862 44.862M108.431 42.569L64.569 86.431" />
    </g>
  </svg>
);
export const ChevronUp = ({ color = WHITE, size = 24 }: IconProps) => (
  <svg
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="square"
    strokeLinejoin="round"
    strokeMiterlimit="1.5"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color} strokeWidth="20">
      <path d="M108.431 86.431L63.569 41.569M19.569 85.431l43.862-43.862" />
    </g>
  </svg>
);
export const DuplicateFile = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <path
      d="M2 6.4c0-.494.406-.9.9-.9h9.178a.997.997 0 0 1 .717.3l2.922 3.006a1 1 0 0 1 .283.7V22.6c0 .494-.406.9-.9.9H2.9a.904.904 0 0 1-.9-.9V6.4z"
      fill="none"
      stroke={color}
    />
    <path
      d="M8 5.5V1.4c0-.494.406-.9.9-.9h9.178a1 1 0 0 1 .722.3l2.922 3.006a1 1 0 0 1 .283.7V17.6c0 .494-.406.9-.9.9H16"
      fill="none"
      stroke={color}
    />
  </svg>
);
export const ViewIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color} strokeWidth="1.5">
      <path d="M12 5.251C7.969 5.183 3.8 8 1.179 10.885a1.67 1.67 0 0 0 0 2.226C3.743 15.935 7.9 18.817 12 18.748c4.1.069 8.258-2.813 10.824-5.637a1.67 1.67 0 0 0 0-2.226C20.2 8 16.031 5.183 12 5.251z" />
      <path d="M15.75 12A3.768 3.768 0 0 1 12 15.749a3.768 3.768 0 0 1-3.75-3.75A3.768 3.768 0 0 1 12 8.249h.001a3.766 3.766 0 0 1 3.749 3.749V12z" />
    </g>
  </svg>
);
export const LoginIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <path
      d="M1.414 16.5c1.801 4.236 5.98 7 10.583 7 6.309 0 11.5-5.191 11.5-11.5S18.306.5 11.997.5a11.519 11.519 0 0 0-10.583 7"
      fill="none"
      stroke={color}
    />
    <path d="M12.5 16l4-4-4-4M16.5 12H.5" fill="none" stroke={color} />
  </svg>
);
export const LogoutIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <path
      d="M14.782 8.59a7.463 7.463 0 0 0-6.844-4.528C3.858 4.062.5 7.42.5 11.5s3.358 7.438 7.438 7.438a7.487 7.487 0 0 0 6.844-4.527"
      fill="none"
      stroke={color}
      strokeWidth=".6445998000000001"
    />
    <path d="M19.497 8l4 4-4 4m4-4h-16" fill="none" stroke={color} />
  </svg>
);
export const PdfIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 21 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color}>
      <path d="M15.5 23.503H.5v-23h20v18l-5 5z" />
      <path d="M15.5 23.503v-5h5M4 6.503l2 2.5 4-5.5M4 14.503l2 2.5 4-5.5M11.5 7.503h6M11.5 15.503h6" />
    </g>
  </svg>
);
export const RefreshIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <path
      d="M.5 8.997l3 4.5 3.5-4m-3.469 3.937a9.806 9.806 0 0 1-.162-1.777c0-5.396 4.44-9.836 9.836-9.836s9.836 4.44 9.836 9.836-4.44 9.836-9.836 9.836a9.849 9.849 0 0 1-8.83-5.503"
      fill="none"
      stroke={color}
    />
  </svg>
);
export const ShipmentSignSmartphoneIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color} strokeWidth="1.5">
      <path d="M20.25 18.04V21A2.25 2.25 0 0 1 18 23.25h-4.519a2.25 2.25 0 0 1-2.25-2.25v-8.96a2.25 2.25 0 0 1 2.25-2.25h3.769M11.231 20.25h9" />
      <path d="M20.747 10.066l-6.34 4.794-.926 2.661 2.812-.168 6.339-4.8a1.559 1.559 0 0 0 .3-2.182l-.005-.008a1.558 1.558 0 0 0-2.18-.297zM12.75 6.75V4.5a1.5 1.5 0 0 0-.829-1.342l-4.5-2.25a1.502 1.502 0 0 0-1.342 0l-4.5 2.25A1.5 1.5 0 0 0 .75 4.5v4.9a1.5 1.5 0 0 0 .829 1.342l4.5 2.249c.422.211.92.211 1.342 0l.758-.379" />
      <path d="M12.513 3.692L6.75 6.573.987 3.692M6.75 6.573v6.573" />
    </g>
  </svg>
);
export const TaskChecklistWriteIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <path
      d="M9.5 23.5h-8c-.549 0-1-.451-1-1v-19c0-.549.451-1 1-1h2M15.5 2.5h2c.549 0 1 .451 1 1v7M11.5 2.5c0-1.097-.903-2-2-2s-2 .903-2 2h-2v3h8v-3h-2z"
      fill="none"
      stroke={color}
    />
    <path
      d="M16.5 10.5V5c0-.274-.226-.5-.5-.5h-2.5M5.5 4.5H3c-.274 0-.5.226-.5.5v16c0 .274.226.5.5.5h6.5M5.5 8.499h8M5.5 11.499h8M5.5 14.499h4M15.7 22.3l-4.2 1.2 1.2-4.2 7.179-7.179a2.122 2.122 0 0 1 1.5-.621 2.13 2.13 0 0 1 2.121 2.121c0 .562-.223 1.102-.621 1.5L15.7 22.3zM18.979 13.02l3 3M12.7 19.299l3 3"
      fill="none"
      stroke={color}
    />
  </svg>
);
export const PaperWriteIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color} strokeWidth="1.5">
      <path d="M13.045 18.636l-3.712.53.53-3.712 9.546-9.546a2.25 2.25 0 1 1 3.182 3.182l-9.546 9.546zM12.75 1.499a.75.75 0 0 0-.75-.75H6a.75.75 0 0 0-.75.75v1.5c0 .414.336.75.75.75h6a.75.75 0 0 0 .75-.75v-1.5zM12.75 2.249h3a1.5 1.5 0 0 1 1.5 1.5" />
      <path d="M17.25 18.749v3a1.5 1.5 0 0 1-1.5 1.5H2.25a1.5 1.5 0 0 1-1.5-1.5v-18a1.5 1.5 0 0 1 1.5-1.5h3M5.25 8.249h7.5M5.25 12.749h3" />
    </g>
  </svg>
);
export const TrashIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <path
      d="M23 28H9c-1.097 0-2-.903-2-2V8h18v18c0 1.097-.903 2-2 2zm-10-6v-8m6 8v-8M3 8h26M19 4h-6c-1.097 0-2 .903-2 2v2h10V6c0-1.097-.903-2-2-2z"
      fill="none"
      stroke={color}
      strokeWidth="2"
    />
  </svg>
);
export const WarehouseDeliveryIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color}>
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
export const WarehouseStorageIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color}>
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
export const WaterDamIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color} strokeWidth="1.5">
      <path
        d="M20 18l6.553-3.276a1 1 0 0 1 1.447.895v13.38c0 1.098-.903 2-2 2H4c-1.097 0-2-.902-2-2V18L4.83 4.79c.1-.458.509-.79.978-.79h2.384c.47 0 .879.332.977.79L12 18l6.553-3.276a1 1 0 0 1 1.447.895V18M12 23h4M12 27h4M20 23h4M20 27h4M12.007 1.159A9.265 9.265 0 0 1 16 1.988C25.905 6.216 30 1 30 1"
        strokeWidth="1.9999949999999997"
      />
    </g>
  </svg>
);
export const RenewableEnergyEarthIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color}>
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
export const WarehousePackageIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color} strokeWidth="1.5">
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
export const Search = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <path
      d="M1.963 17.81c2.593 6.1 9.746 8.987 15.847 6.394 6.102-2.593 8.988-9.746 6.395-15.848-2.593-6.1-9.746-8.987-15.847-6.394C2.256 4.554-.63 11.708 1.963 17.809zM21.628 21.627L31 31"
      fill="none"
      stroke={color}
      strokeWidth="1.9999949999999997"
    />
  </svg>
);
export const TriangleDownIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <path d="M61.5 119.422l-32-50h64l-32 50z" fill={color} />
  </svg>
);
export const TriangleUpIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <path d="M61.5 10.422l32 50h-64l32-50z" fill={color} />
  </svg>
);
export const TriangleUpIconAndDown = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <path
      d="M61.5 10.422l32 50h-64l32-50zM61.5 119.422l-32-50h64l-32 50z"
      fill={color}
    />
  </svg>
);
export const QRCodeIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color} strokeWidth="1.5">
      <path
        d="M1 17v2h2M1 1h8v8H1zM23 1h8v8h-8zM1 23h8v8H1zM16 1h3M13 1v4h3M19 5v4h-6M1 13h8v2M7 19h2M31 31h-4v-4h4v-4h-4M19 31h-6v-8M23 23v8M17 23h2v4h-2M13 17v2h2M19 19h4M21 19v-4M13 13h4v2M31 13v2M31 18v1M25 13v2h2v3"
        strokeWidth="1.9999949999999997"
      />
    </g>
  </svg>
);
export const LeftArrowIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color} strokeWidth="1.5">
      <path d="M31 16H1M15 2L1 16l14 14" strokeWidth="1.9999949999999997" />
    </g>
  </svg>
);
export const Close = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color} strokeWidth="1.5">
      <path
        d="M1 30.999l30-30M31 30.999l-30-30"
        strokeWidth="1.9999949999999997"
      />
    </g>
  </svg>
);
export const Layout2Icon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color} strokeWidth="1.5">
      <path
        d="M2 1.996h28v28H2zM2 9.996h28M16 29.996v-20M2 19.996h28"
        strokeWidth="1.9999949999999997"
      />
    </g>
  </svg>
);
export const LayoutModule1Icon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color} strokeWidth="1.5">
      <path
        d="M1 .996h12v12H1zM1 18.996h12v12H1zM19 .996h12v12H19zM19 18.996h12v12H19z"
        strokeWidth="1.9999949999999997"
      />
    </g>
  </svg>
);
export const BusTransfer = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color} strokeWidth="1.5">
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
export const CogApprovedIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color} strokeWidth="1.5">
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
export const DeliveryTruckClockIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={`${size}px`}
    height={`${size}px`}
  >
    <g fill="none" stroke={color} strokeWidth="1.5">
      <path
        d="M1 10c0 4.39 3.61 8 8 8 4.39 0 8-3.61 8-8 0-4.39-3.61-8-8-8-4.39 0-8 3.61-8 8z"
        strokeWidth="1.9999949999999997"
      />
      <path
        d="M5.464 10H9V6.464M19 16h2c1.097 0 2 .903 2 2v7.05M10 28H9c-1.097 0-2-.903-2-2v-4M23 18h4c2.195 0 4 1.805 4 4v4c0 1.097-.903 2-2 2h-3.05"
        strokeWidth="1.9999949999999997"
      />
      <path
        d="M21 27.5c0 1.372 1.128 2.5 2.5 2.5s2.5-1.128 2.5-2.5-1.128-2.5-2.5-2.5a2.511 2.511 0 0 0-2.5 2.5zM10 27.5c0 1.372 1.128 2.5 2.5 2.5s2.5-1.128 2.5-2.5-1.128-2.5-2.5-2.5a2.511 2.511 0 0 0-2.5 2.5zM21.05 28H15M31 22h-4"
        strokeWidth="1.9999949999999997"
      />
    </g>
  </svg>
);
