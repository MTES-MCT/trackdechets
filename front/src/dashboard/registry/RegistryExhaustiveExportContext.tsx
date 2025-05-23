import React, { createContext, useCallback, useEffect, useState } from "react";
import { useLazyQuery, useQuery } from "@apollo/client";
import { subHours } from "date-fns";

import {
  Query,
  RegistryExportStatus,
  QueryRegistryExhaustiveExportDownloadSignedUrlArgs
} from "@td/codegen-ui";
import {
  downloadFromSignedUrl,
  GET_REGISTRY_EXHAUSTIVE_EXPORTS,
  REGISTRY_EXHAUSTIVE_EXPORT_DOWNLOAD_SIGNED_URL
} from "./shared";
import { RegistryExportContextType } from "./RegistryV2ExportContext";

const PAGE_SIZE = 20;

export const RegistryExhaustiveExportContext =
  createContext<RegistryExportContextType | null>(null);

export const RegistryExhaustiveExportProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [downloadLoadingExportId, setDownloadLoadingExportId] = useState<
    string | null
  >(null);
  const {
    data: exportsData,
    loading: exportsLoading,
    error,
    refetch,
    startPolling,
    stopPolling
  } = useQuery<Pick<Query, "registryExhaustiveExports">>(
    GET_REGISTRY_EXHAUSTIVE_EXPORTS,
    {
      variables: { first: PAGE_SIZE },
      fetchPolicy: "cache-and-network"
    }
  );
  const registryExports = exportsData?.registryExhaustiveExports?.edges;
  const totalCount = exportsData?.registryExhaustiveExports?.totalCount;
  const pageCount = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 0;

  const [getDownloadLink] = useLazyQuery<
    Pick<Query, "registryExhaustiveExportDownloadSignedUrl">,
    Partial<QueryRegistryExhaustiveExportDownloadSignedUrlArgs>
  >(REGISTRY_EXHAUSTIVE_EXPORT_DOWNLOAD_SIGNED_URL, {
    fetchPolicy: "no-cache"
  });

  const downloadRegistryExportFile = useCallback(
    async (exportId: string) => {
      setDownloadLoadingExportId(exportId);
      try {
        const link = await getDownloadLink({
          variables: { exportId }
        });
        downloadFromSignedUrl(
          link.data?.registryExhaustiveExportDownloadSignedUrl.signedUrl
        );
      } finally {
        setDownloadLoadingExportId(null);
      }
    },
    [setDownloadLoadingExportId, getDownloadLink]
  );

  const gotoPage = useCallback(
    (page: number) => {
      setPageIndex(page);
      refetch({
        skip: page * PAGE_SIZE
      });
    },
    [setPageIndex, refetch]
  );

  useEffect(() => {
    if (
      registryExports?.some(
        registryExport =>
          (registryExport.node.status === RegistryExportStatus.Pending ||
            registryExport.node.status === RegistryExportStatus.Started) &&
          // condition to avoid infinite refetches on old exports that somehow never finished
          new Date(registryExport.node.createdAt) > subHours(new Date(), 1)
      )
    ) {
      startPolling(5000);
    } else {
      stopPolling();
    }
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registryExports]);

  return (
    <RegistryExhaustiveExportContext.Provider
      value={{
        type: "registryExhaustive",
        pageIndex,
        pageCount,
        downloadLoadingExportId,
        exportsLoading,
        registryExports: registryExports?.map(edge => edge.node),
        downloadRegistryExportFile,
        gotoPage,
        refetch,
        error
      }}
    >
      {children}
    </RegistryExhaustiveExportContext.Provider>
  );
};
