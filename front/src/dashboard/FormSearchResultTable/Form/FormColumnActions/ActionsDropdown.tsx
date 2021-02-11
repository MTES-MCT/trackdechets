import * as React from "react";
import { Link, generatePath, useParams } from "react-router-dom";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuLink,
} from "@reach/menu-button";
import "@reach/menu-button/styles.css";
import { FormSearchResult } from "generated/graphql/types";
import routes from "common/routes";
import { IconChevronUp, IconChevronDown } from "common/components/Icons";
import { QuicklookModal } from "../../../slips/slips-actions/Quicklook";
import { DeleteModal } from "../../../slips/slips-actions/Delete";

interface ActionsDropdownProps {
  searchResult: FormSearchResult;
}

export function ActionsDropdown({ searchResult }: ActionsDropdownProps) {
  const { siret } = useParams<{ siret: string }>();
  const [currentModal, setCurrentModal] = React.useState<
    "PREVIEW" | "DELETE" | null
  >(null);

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
              <MenuItem onSelect={() => setCurrentModal("DELETE")}>
                Supprimer
              </MenuItem>
              <MenuLink
                as={Link}
                to={generatePath(routes.dashboard.slips.edit, {
                  siret,
                  id: searchResult.id,
                })}
              >
                Modifier
              </MenuLink>
              <MenuItem onSelect={() => {}}>Dupliquer</MenuItem>
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
