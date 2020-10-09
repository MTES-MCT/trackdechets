import React, { useEffect } from "react";
import { useLazyQuery } from "@apollo/react-hooks";
import { DocumentNode } from "graphql";

type Props = {
  query: DocumentNode;
  params: any;
  children?: any;
  onSuccess?: () => void;
};

export default function DownloadFileLink({
  query,
  params,
  children,
  onSuccess,
  ...props
}: Props & any) {
  const [downloadFile, { data }] = useLazyQuery(query, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    const key = Object.keys(data)[0];
    if (data[key].downloadLink) {
      window.open(data[key].downloadLink, "_blank");
    }

    !!onSuccess && onSuccess();
  }, [data, onSuccess]);

  return (
    <button
      className="btn--no-style"
      {...props}
      onClick={() => downloadFile({ variables: params })}
    >
      {children}
    </button>
  );
}
