import * as React from "react";
import { Link, generatePath, useParams } from "react-router-dom";
import cogoToast from "cogo-toast";
import { gql, useMutation } from "@apollo/client";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuLink,
} from "@reach/menu-button";
import "@reach/menu-button/styles.css";
import {
  FormSearchResult,
  FormStatus,
  Mutation,
  MutationDuplicateFormArgs,
} from "generated/graphql/types";
import { fullFormFragment } from "common/fragments";
import routes from "common/routes";
import { IconChevronUp, IconChevronDown } from "common/components/Icons";
import { QuicklookModal } from "../../../slips/slips-actions/Quicklook";
import { DeleteModal } from "../../../slips/slips-actions/Delete";

const DUPLICATE_FORM = gql`
  mutation DuplicateForm($id: ID!) {
    duplicateForm(id: $id) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;

interface ActionsDropdownProps {
  searchResult: FormSearchResult;
}

export function ActionsDropdown({ searchResult }: ActionsDropdownProps) {
  const { siret } = useParams<{ siret: string }>();
  const [currentModal, setCurrentModal] = React.useState<
    "PREVIEW" | "DELETE" | null
  >(null);

  const [duplicateForm] = useMutation<
    Pick<Mutation, "duplicateForm">,
    MutationDuplicateFormArgs
  >(DUPLICATE_FORM, {
    variables: { id: searchResult.id },
    update: () => {
      // TODO: add a FormSearchResult to SEARCH_DRAFTS
      // except we don't have a FormSearchResult here but Form :/
    },
    onCompleted: () => {
      setCurrentModal(null);

      cogoToast.success(
        `Le bordereau a été dupliqué, il est disponible dans l'onglet "Brouillons"`
      );
    },
  });

  return (
    <>
      <Menu>
        {({ isExpanded }) => (
          <>
            <MenuButton className="btn btn--outline-primary">
              {isExpanded ? <IconChevronUp /> : <IconChevronDown />} Actions
            </MenuButton>
            <MenuList>
              <MenuItem onSelect={() => setCurrentModal("PREVIEW")}>
                Aperçu
              </MenuItem>
              <MenuItem onSelect={() => duplicateForm()}>Dupliquer</MenuItem>
              {[FormStatus.Draft, FormStatus.Sealed].includes(
                searchResult.status as FormStatus
              ) && (
                <>
                  <MenuLink
                    as={Link}
                    to={generatePath(routes.dashboard.slips.edit, {
                      siret,
                      id: searchResult.id,
                    })}
                  >
                    Modifier
                  </MenuLink>
                  <MenuItem onSelect={() => setCurrentModal("DELETE")}>
                    Supprimer
                  </MenuItem>
                </>
              )}
            </MenuList>
          </>
        )}
      </Menu>
      {currentModal === "PREVIEW" && (
        <QuicklookModal
          formId={searchResult.id}
          onClose={() => setCurrentModal(null)}
        />
      )}
      {currentModal === "DELETE" && (
        <DeleteModal
          formId={searchResult.id}
          onClose={() => setCurrentModal(null)}
        />
      )}
    </>
  );
}
