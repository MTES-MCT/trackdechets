import React, { useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { DocumentNode } from "graphql";

type Props = {
  query: DocumentNode;
  params: any;
  children?: any;
  linkGetter?: (data: any) => string;
  onSuccess?: () => void;
};

export default function DownloadFileLink({
  query,
  params,
  children,
  linkGetter = data => data.formPdf.downloadLink,
  onSuccess,
  ...props
}: Props & any) {
  const [downloadFile, { data }] = useLazyQuery(query, {
    fetchPolicy: "network-only"
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    const link = linkGetter(data);
    if (link) {
      window.open(link, "_blank");
    }

    !!onSuccess && onSuccess();
  }, [data, onSuccess, linkGetter]);

  return (
    <button
      className="btn--no-style"
      type="button"
      {...props}
      onClick={() => downloadFile({ variables: params })}
    >
      {children}
    </button>
  );
}
