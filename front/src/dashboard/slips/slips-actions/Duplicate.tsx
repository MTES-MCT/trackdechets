import { gql, useMutation } from "@apollo/client";
import cogoToast from "cogo-toast";
import React from "react";
import { IconDuplicateFile } from "common/components/Icons";
import { generatePath, useHistory, useParams } from "react-router-dom";
import { Mutation, MutationDuplicateFormArgs } from "generated/graphql/types";
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
      // FIXME: add to drafts tab
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

  const className = small ? "btn--no-style" : "btn btn--outline-primary";
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
