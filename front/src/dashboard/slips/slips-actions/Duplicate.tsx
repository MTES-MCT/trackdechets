import { useMutation } from "@apollo/react-hooks";
import cogoToast from "cogo-toast";
import React from "react";
import { DuplicateFile } from "common/components/Icons";
import { updateApolloCache } from "common/helper";
import { generatePath, useHistory, useParams } from "react-router-dom";
import {
  Form,
  Mutation,
  MutationDuplicateFormArgs,
} from "generated/graphql/types";
import { GET_SLIPS } from "../query";
import mutations from "./slip-actions.mutations";
import { COLORS } from "common/config";
import { routes } from "common/routes";

type Props = {
  formId: string;
  small?: boolean;
  onClose?: () => void;
  redirectToDashboard?: boolean;
};

export default function Duplicate({
  formId,
  onClose,
  redirectToDashboard,
  small = true,
}: Props) {
  const { siret } = useParams<{ siret: string }>();
  const history = useHistory();
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
        getNewData: data => ({
          forms: [...data.forms, duplicateForm],
        }),
      });
    },
    onCompleted: () => {
      if (onClose) {
        onClose();
      }

      if (redirectToDashboard) {
        history.push(
          generatePath(routes.dashboard.slips.drafts, {
            siret,
          })
        );
      }

      cogoToast.success(
        `Le bordereau a été dupliqué, il est disponible dans l'onglet "Brouillons"`
      );
    },
  });

  const className = small
    ? "btn--no-style slips-actions__button"
    : "btn btn--outline-primary";
  return (
    <button
      className={`${className} `}
      title="Dupliquer en brouillon"
      onClick={() => duplicate()}
    >
      <DuplicateFile size={24} color={COLORS.blueLight} />
      <span>Dupliquer</span>
    </button>
  );
}
