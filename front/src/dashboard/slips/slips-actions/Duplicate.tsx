import { useMutation } from "@apollo/react-hooks";
import cogoToast from "cogo-toast";
import React from "react";
import { FaClone } from "react-icons/fa";
import { updateApolloCache } from "../../../common/helper";
import { currentSiretService } from "../../CompanySelector";
import { GET_SLIPS } from "../query";
import mutations from "./slip-actions.mutations";
import {
  Form,
  Mutation,
  MutationDuplicateFormArgs,
} from "../../../generated/graphql/types";

type Props = { formId: string };

export default function Duplicate({ formId }: Props) {
  const [duplicate] = useMutation<
    Pick<Mutation, "duplicateForm">,
    MutationDuplicateFormArgs
  >(mutations.DUPLICATE_FORM, {
    variables: { id: formId },
    update: (store, { data }) => {
      if (data?.duplicateForm) {
        const duplicateForm = data.duplicateForm;
        updateApolloCache<{ forms: Form[] }>(store, {
          query: GET_SLIPS,
          variables: { siret: currentSiretService.getSiret() },
          getNewData: (data) => ({
            forms: [...data.forms, duplicateForm],
          }),
        });
      }
    },
    onCompleted: () =>
      cogoToast.success(
        `Le bordereau a été dupliqué, il est disponible dans l'onglet "Brouillons"`
      ),
  });

  return (
    <button
      className="icon"
      title="Dupliquer en brouillon"
      onClick={() => duplicate()}
    >
      <FaClone />
    </button>
  );
}
