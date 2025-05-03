import React from "react";

import Table from "@codegouvfr/react-dsfr/Table";
import styles from "./RegistryTable.module.scss";

const RegistryTable = ({
  data,
  headers,
  caption,
  fixed
}: {
  data: React.ReactNode[][];
  headers: React.ReactNode[];
  caption?: React.ReactNode;
  fixed?: boolean;
}) => {
  return (
    <Table
      bordered
      className={styles.fullWidthTable}
      noCaption={!caption}
      data={data}
      headers={headers}
      caption={caption}
      fixed={fixed}
    />
  );
};

export default RegistryTable;
