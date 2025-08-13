import React, { useCallback } from "react";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import {
  Consistence,
  Form,
  PackagingInfo,
  Query,
  QueryAppendixFormsArgs
} from "@td/codegen-ui";
import { Loader } from "../../../../Apps/common/Components";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Appendix2MultiSelect from "./Appendix2MultiSelect";
import { useFormikContext } from "formik";

const APPENDIX2_FORMS = gql`
  query AppendixForms($siret: String!, $wasteCode: String) {
    appendixForms(siret: $siret, wasteCode: $wasteCode) {
      id
      readableId
      emitter {
        company {
          name
          orgId
        }
      }
      wasteDetails {
        code
        name
        quantity
        consistence
        packagingInfos {
          type
          other
          quantity
          volume
          identificationNumbers
        }
      }
      signedAt
      quantityReceived
      quantityAccepted
      quantityRefused
      quantityGrouped
      processingOperationDone
      recipient {
        cap
      }
    }
  }
`;

type Appendix2MultiSelectWrapperProps = {
  emitterCompanySiret?: string | null;
};

function Appendix2MultiSelectWrapper({
  emitterCompanySiret
}: Appendix2MultiSelectWrapperProps) {
  const { setFieldValue } = useFormikContext<Form>();

  const { loading, error, data } = useQuery<
    Pick<Query, "appendixForms">,
    QueryAppendixFormsArgs
  >(APPENDIX2_FORMS, {
    variables: {
      siret: emitterCompanySiret ?? ""
    },
    skip: !emitterCompanySiret,
    fetchPolicy: "network-only"
  });

  // Cette fonction est ensuite utilisée dans un useEffect
  // On la wrap dans un `useCallback` pour éviter un render infini
  const updateTotalQuantity = useCallback(
    (totalQuantity: number) =>
      setFieldValue("wasteDetails.quantity", totalQuantity),
    [setFieldValue]
  );

  // Cette fonction est ensuite utilisée dans un useEffect
  // On la wrap dans un `useCallaback` pour éviter un render infinie
  const updatePackagings = useCallback(
    (packagings: PackagingInfo[]) =>
      setFieldValue("wasteDetails.packagingInfos", packagings),
    [setFieldValue]
  );

  const updateConsistence = useCallback(
    (consistence: Consistence[]) =>
      setFieldValue("wasteDetails.consistence", consistence),
    [setFieldValue]
  );

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Alert
        severity="error"
        description={error.message}
        title="Erreur"
        small
      />
    );
  }

  if (data) {
    return (
      <Appendix2MultiSelect
        appendixForms={data.appendixForms}
        updateTotalQuantity={updateTotalQuantity}
        updatePackagings={updatePackagings}
        updateConsistence={updateConsistence}
      />
    );
  }
}

export default Appendix2MultiSelectWrapper;
