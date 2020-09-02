import React from "react";
const WHITE = "#FFFFFF";
const DEFAULT_DIMENSION = 24;
export const WasteTakeOverIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: {
  color?: string;
  size?: number;
}) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
    width={`${size}px`}
    height={`${size}px`}
  >
    <circle cx="5.709" cy="6.5" r="5" fill="none" stroke={color} />
    <path
      d="M7.709 7.5h-2V4M16.709 13.5h3.8c.422 0 .8.267.942.664l1.785 5a1.004 1.004 0 0 1-.942 1.336h-1.171"
      fill="#"
      stroke={color}
    />
    <path
      d="M11.123 20.5h5.6l-.009-9c0-.549-.451-1-1-1h-4M5.709 13.5v6c0 .549.451 1 1 1H8.3"
      fill="none"
      stroke={color}
      width={`${size}px`}
      height={`${size}px`}
    />
    <circle cx="19.709" cy="21" r="1.5" fill="none" stroke={color} />
    <circle cx="9.709" cy="21" r="1.5" fill="none" stroke={color} />
    <path
      d="M.709 15.5l3 .005M2.209 17.5l1.5.005M3.209 19.5l.5.005M22.209 16.5h-5.5M16.72 20.5h1.582"
      fill="none"
      stroke={color}
    />
  </svg>
);
export const ChevronDownIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: {
  color?: string;
  size?: number;
}) => (
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
export const ChevronUpIcon = ({
  color = WHITE,
  size = 24,
}: {
  color: string;
  size: number;
}) => (
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
export const DuplicateFileIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: {
  color?: string;
  size?: number;
}) => (
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
}: {
  color?: string;
  size?: number;
}) => (
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
      d="M23.5 12s-5.148 6.5-11.5 6.5S.5 12 .5 12 5.648 5.5 12 5.5 23.5 12 23.5 12z"
      fill="none"
      stroke={color}
    />
    <circle cx="12" cy="12" r="4" fill="none" stroke={color} />
    <path
      d="M12 10c1.097 0 2 .903 2 2s-.903 2-2 2-2-.903-2-2"
      fill="none"
      stroke={color}
    />
  </svg>
);
export const LoginIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: {
  color?: string;
  size?: number;
}) => (
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
}: {
  color?: string;
  size?: number;
}) => (
 
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
    <path d="M19.497 8l4 4-4 4m4-4h-16" fill="none"  stroke={color}/>
  </svg>
);
export const PdfIcon = ({
  color = WHITE,
  size = DEFAULT_DIMENSION,
}: {
  color?: string;
  size?: number;
}) => (
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
