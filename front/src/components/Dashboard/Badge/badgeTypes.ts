import { BsdStatusCode } from "common/types/bsdTypes";

export interface BadgeProps {
  status: BsdStatusCode;
  isSmall?: boolean;
}
