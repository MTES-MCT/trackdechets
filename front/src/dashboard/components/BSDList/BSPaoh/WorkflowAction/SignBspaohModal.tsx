import { useQuery } from "@apollo/client";

import { Loader } from "../../../../../Apps/common/Components";
import {
  DsfrModal,
  ModalSizes
} from "../../../../../Apps/common/Components/Modal/DsfrModal";
import { GET_BSPAOH } from "../../../../../form/bspaoh/utils/queries";
import { Query, QueryBspaohArgs } from "@td/codegen-ui";
import React from "react";
import { BspaohSummary } from "./BspaohSummary";

type Props = {
  title: string;
  bspaohId: string;
  children: (props: { bspaoh; onClose }) => React.ReactNode;
  onClose: () => void;
  size: string;
};

export function SignBspaohModal({
  title,
  bspaohId,
  children,
  onClose,
  size
}: Readonly<Props>) {
  const { data } = useQuery<Pick<Query, "bspaoh">, QueryBspaohArgs>(
    GET_BSPAOH,
    {
      variables: {
        id: bspaohId
      }
    }
  );

  if (data == null) {
    return <Loader />;
  }

  const { bspaoh } = data;

  return (
    <DsfrModal title={title} onClose={onClose} size={size as ModalSizes}>
      <BspaohSummary bspaoh={bspaoh} />
      {children({ bspaoh, onClose })}
    </DsfrModal>
  );
}
