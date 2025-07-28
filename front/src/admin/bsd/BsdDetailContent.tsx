import { Bsd } from "@td/codegen-ui";
import React from "react";
import BsdasriDetailContent from "../../dashboard/detail/bsdasri/BsdasriDetailContent";
import BSDDetailContent from "../../dashboard/detail/bsdd/BSDDetailContent";
import { BsffDetailContent } from "../../dashboard/detail/bsff/BsffDetailContent";
import BspaohDetailContent from "../../dashboard/detail/bspaoh/BspaohDetailContent";
import BSVHUPreviewContent from "../../Apps/Dashboard/Preview/BSVHU/BSVHUPreviewContent";
import { BSDAPreviewContent } from "../../Apps/Dashboard/Preview/BSDA/BSDAPreviewContent";
import {
  QueryFormArgs,
  Query,
  QueryBsffArgs,
  QueryBsdaArgs,
  QueryBsvhuArgs,
  QueryBsdasriArgs,
  QueryBspaohArgs
} from "@td/codegen-ui";
import { GET_BSFF_FORM } from "../../Apps/common/queries/bsff/queries";
import { GET_BSDA } from "../../Apps/common/queries/bsda/queries";
import { GET_FORM } from "../../Apps/common/queries/bsdd/queries";
import { GET_VHU_FORM } from "../../Apps/common/queries/bsvhu/queries";
import { GET_BSDASRI } from "../../Apps/common/queries/bsdasri/queries";
import { GET_BSPAOH } from "../../Apps/common/queries/bspaoh/queries";
import { NotificationError } from "../../Apps/common/Components/Error/Error";

import { useQuery } from "@apollo/client";
import { Loader } from "../../Apps/common/Components";

export function BsdDetailContent({ bsd }: { bsd: Bsd }) {
  const isBsda = bsd.__typename === "Bsda";
  const isBsdd = bsd.__typename === "Form";
  const isBsvhu = bsd.__typename === "Bsvhu";
  const isBsdasri = bsd.__typename === "Bsdasri";
  const isBsff = bsd.__typename === "Bsff";
  const isBspaoh = bsd.__typename === "Bspaoh";

  const {
    data: bsdaData,
    error: bsdaError,
    loading: bsdaLoading
  } = useQuery<Pick<Query, "bsda">, QueryBsdaArgs>(GET_BSDA, {
    variables: { id: bsd.id },
    skip: !isBsda
  });

  const {
    data: bsddData,
    error: bsddError,
    loading: bsddLoading
  } = useQuery<Pick<Query, "form">, QueryFormArgs>(GET_FORM, {
    variables: { id: bsd.id },
    skip: !isBsdd
  });

  const {
    data: bsvhuData,
    error: bsvhuError,
    loading: bsvhuLoading
  } = useQuery<Pick<Query, "bsvhu">, QueryBsvhuArgs>(GET_VHU_FORM, {
    variables: { id: bsd.id },
    skip: !isBsvhu
  });

  const {
    data: bsdasriData,
    error: bsdasriError,
    loading: bsdasriLoading
  } = useQuery<Pick<Query, "bsdasri">, QueryBsdasriArgs>(GET_BSDASRI, {
    variables: { id: bsd.id },
    skip: !isBsdasri
  });

  const {
    data: bsffData,
    error: bsffError,
    loading: bsffLoading
  } = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF_FORM, {
    variables: { id: bsd.id },
    skip: !isBsff
  });

  const {
    data: bspaohData,
    error: bspaohError,
    loading: bspaohLoading
  } = useQuery<Pick<Query, "bspaoh">, QueryBspaohArgs>(GET_BSPAOH, {
    variables: { id: bsd.id },
    skip: !isBspaoh
  });

  const loading =
    bsffLoading ||
    bsdaLoading ||
    bsddLoading ||
    bsvhuLoading ||
    bsdasriLoading ||
    bspaohLoading;

  const error =
    bsdaError ||
    bsddError ||
    bsffError ||
    bsvhuError ||
    bsdasriError ||
    bspaohError;
  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  if (isBsda && !!bsdaData) {
    return <BSDAPreviewContent form={bsdaData.bsda.id} />;
  }
  if (isBsdd && !!bsddData) {
    return <BSDDetailContent form={bsddData.form} />;
  }
  if (isBsvhu && !!bsvhuData) {
    return <BSVHUPreviewContent bsdId={bsvhuData.bsvhu.id} />;
  }
  if (isBsdasri && bsdasriData) {
    return <BsdasriDetailContent form={bsdasriData.bsdasri} />;
  }
  if (isBsff && !!bsffData) {
    return <BsffDetailContent form={bsffData.bsff} />;
  }
  if (isBspaoh && !!bspaohData) {
    return <BspaohDetailContent form={bspaohData.bspaoh} />;
  }
}
