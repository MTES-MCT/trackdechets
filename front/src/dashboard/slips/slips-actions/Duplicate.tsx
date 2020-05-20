import { useMutation } from "@apollo/react-hooks";
import cogoToast from "cogo-toast";
import React, { useContext } from "react";
import { FaClone } from "react-icons/fa";
import { updateApolloCache } from "../../../common/helper";
import {
  Form,
  Mutation,
  MutationDuplicateFormArgs,
} from "../../../generated/graphql/types";
import { SiretContext } from "../../Dashboard";
import { GET_SLIPS } from "../query";
import mutations from "./slip-actions.mutations";

type Props = { formId: string };

export default function Duplicate({ formId }: Props) {
  const { siret } = useContext(SiretContext);
  const [duplicate] = useMutation<
    Pick<Mutation, "duplicateForm">,
    MutationDuplicateFormArgs
  >(mutations.DUPLICATE_FORM, {
    variables: { id: formId },
    update: (store, { data }) => {
      if (!data?.duplicateForm) {
        return;
      }
      const duplicateForm = data.duplicateForm;
      updateApolloCache<{ forms: Form[] }>(store, {
        query: GET_SLIPS,
        variables: { siret, status: ["DRAFT"] },
        getNewData: (data) => ({
          forms: [...data.forms, duplicateForm],
        }),
      });
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
