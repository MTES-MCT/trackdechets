import React, {
  createContext,
  useCallback,
  useContext,
  // useContext,
  useEffect,
  useState
} from "react";
import {
  ApolloError,
  useLazyQuery,
  useMutation,
  useQuery
} from "@apollo/client";
import { subHours } from "date-fns";

import {
  Query,
  QueryRegistryV2ExportDownloadSignedUrlArgs,
  RegistryV2Export,
  RegistryExhaustiveExport,
  RegistryExportStatus,
  MutationCancelRegistryV2ExportArgs,
  Mutation
} from "@td/codegen-ui";
import {
  downloadFromSignedUrl,
  GET_REGISTRY_V2_EXPORTS,
  GET_REGISTRY_V2_EXPORTS_AS_ADMIN,
  REGISTRY_V2_EXPORT_DOWNLOAD_SIGNED_URL,
  CANCEL_REGISTRY_V2_EXPORT
} from "./shared";
import { RegistryExhaustiveExportContext } from "./RegistryExhaustiveExportContext";

const PAGE_SIZE = 20;

type BaseRegistryExportContext = {
  pageIndex: number;
  pageCount: number;
  downloadLoadingExportId: string | null;
  exportsLoading: boolean;
  downloadRegistryExportFile: (exportId: string) => void;
  gotoPage: (page: number) => void;
  refetch: () => void;
  error: ApolloError | undefined;
};

export type RegistryExportContextType =
  | (BaseRegistryExportContext & {
      type: "registryV2";
      registryExports: RegistryV2Export[] | undefined;
      cancelRegistryExport: (exportId: string) => Promise<void>;
    })
  | (BaseRegistryExportContext & {
      type: "registryExhaustive";
      registryExports: RegistryExhaustiveExport[] | undefined;
      cancelRegistryExport: (exportId: string) => Promise<void>;
    });

export const RegistryV2ExportContext =
  createContext<RegistryExportContextType | null>(null);

export const useRegistryExport = (): RegistryExportContextType => {
  const exhaustiveContext = useContext(RegistryExhaustiveExportContext);
  const v2Context = useContext(RegistryV2ExportContext);

  if (!exhaustiveContext && !v2Context) {
    throw new Error(
      "useRegistryExport has to be used within <RegistryExhaustiveExportContext.Provider> or <RegistryExportContext.Provider>"
    );
  }

  return (exhaustiveContext || v2Context) as RegistryExportContextType;
};

export const RegistryV2ExportProvider: React.FC<{
  asAdmin?: boolean;
  children: React.ReactNode;
}> = ({ asAdmin = false, children }) => {
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
  } = useQuery<Pick<Query, "registryV2Exports" | "registryV2ExportsAsAdmin">>(
    asAdmin ? GET_REGISTRY_V2_EXPORTS_AS_ADMIN : GET_REGISTRY_V2_EXPORTS,
    {
      variables: { first: PAGE_SIZE },
      fetchPolicy: "cache-and-network"
    }
  );
  const registryExports =
    exportsData?.[asAdmin ? "registryV2ExportsAsAdmin" : "registryV2Exports"]
      ?.edges;
  const totalCount =
    exportsData?.[asAdmin ? "registryV2ExportsAsAdmin" : "registryV2Exports"]
      ?.totalCount;
  const pageCount = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 0;

  const [getDownloadLink] = useLazyQuery<
    Pick<Query, "registryV2ExportDownloadSignedUrl">,
    Partial<QueryRegistryV2ExportDownloadSignedUrlArgs>
  >(REGISTRY_V2_EXPORT_DOWNLOAD_SIGNED_URL, { fetchPolicy: "no-cache" });

  const [_cancelRegistryExport] = useMutation<
    Pick<Mutation, "cancelRegistryV2Export">,
    Partial<MutationCancelRegistryV2ExportArgs>
  >(CANCEL_REGISTRY_V2_EXPORT, {
    refetchQueries: [
      asAdmin ? GET_REGISTRY_V2_EXPORTS_AS_ADMIN : GET_REGISTRY_V2_EXPORTS
    ]
  });
  const downloadRegistryExportFile = useCallback(
    async (exportId: string) => {
      setDownloadLoadingExportId(exportId);
      try {
        const link = await getDownloadLink({
          variables: { exportId }
        });
        downloadFromSignedUrl(
          link.data?.registryV2ExportDownloadSignedUrl.signedUrl
        );
      } finally {
        setDownloadLoadingExportId(null);
      }
    },
    [setDownloadLoadingExportId, getDownloadLink]
  );

  const cancelRegistryExport = useCallback(
    async (exportId: string) => {
      await _cancelRegistryExport({ variables: { exportId } });
    },
    [_cancelRegistryExport]
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
    <RegistryV2ExportContext.Provider
      value={{
        type: "registryV2",
        pageIndex,
        pageCount,
        downloadLoadingExportId,
        exportsLoading,
        registryExports: registryExports?.map(edge => edge.node),
        cancelRegistryExport,
        downloadRegistryExportFile,
        gotoPage,
        refetch,
        error
      }}
    >
      {children}
    </RegistryV2ExportContext.Provider>
  );
};
// export default useRegistryExport;
