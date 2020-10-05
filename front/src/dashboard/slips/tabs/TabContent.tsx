import React from "react";

import { RefreshLoader } from "src/common/components/Loaders";

import LoadMore from "./LoadMore";
import SlipsHeaderActions from "../SlipsHeaderActions";

export default function TabContent({
  forms,
  networkStatus,
  refetch,
  fetchMore,
  children,
}) {
  return (
    <>
      <RefreshLoader networkStatus={networkStatus} />
      <SlipsHeaderActions refetch={refetch} />
      {children}
      <LoadMore forms={forms} fetchMore={fetchMore} />
    </>
  );
}
