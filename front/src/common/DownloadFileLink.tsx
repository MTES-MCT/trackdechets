import React from "react";
import { useLazyQuery } from "@apollo/react-hooks";
import { DocumentNode } from "graphql";
import { useEffect } from "react";

type Props = {
  query: DocumentNode;
  params: any;
  children?: any;
};

export default function DownloadFileLink({
  query,
  params,
  children,
  ...props
}: Props & any) {
  const [downloadFile, { data }] = useLazyQuery(query);

  useEffect(() => {
    if (!data) {
      return;
    }

    const key = Object.keys(data)[0];
    if (data[key].downloadLink) {
      window.open(data[key].downloadLink, "_blank");
    }
  }, [data]);

  return (
    <button
      className="link"
      {...props}
      onClick={() => downloadFile({ variables: params })}
    >
      {children}
    </button>
  );
}
