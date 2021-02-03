import { gql, useMutation } from "@apollo/client";
import cogoToast from "cogo-toast";
import React from "react";
import { IconDuplicateFile } from "common/components/Icons";
import { updateApolloCache } from "common/helper";
import { generatePath, useHistory, useParams } from "react-router-dom";
import {
  Form,
  Mutation,
  MutationDuplicateFormArgs,
} from "generated/graphql/types";
import { DRAFT_TAB_FORMS } from "../tabs/queries";
import routes from "common/routes";
import { fullFormFragment } from "common/fragments";

type Props = {
  formId: string;
  small?: boolean;
  onClose?: () => void;
  redirectToDashboard?: boolean;
};

const DUPLICATE_FORM = gql`
  mutation DuplicateForm($id: ID!) {
    duplicateForm(id: $id) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;

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
  >(DUPLICATE_FORM, {
    variables: { id: formId },
    update: (store, { data }) => {
      if (!data?.duplicateForm) {
        return;
      }
      const duplicateForm = data.duplicateForm;
      updateApolloCache<{ forms: Form[] }>(store, {
        query: DRAFT_TAB_FORMS,
        variables: { siret },
        getNewData: data => ({
          forms: [duplicateForm, ...data.forms],
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
      <IconDuplicateFile size="24px" color="blueLight" />
      <span>Dupliquer</span>
    </button>
  );
}
