import * as React from "react";
import { Link, generatePath, useParams, useLocation } from "react-router-dom";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuLink,
  MenuItem,
} from "@reach/menu-button";
import "@reach/menu-button/styles.css";
import classNames from "classnames";
import routes from "common/routes";
import {
  IconChevronDown,
  IconChevronUp,
  IconView,
  IconPaperWrite,
  IconPdf,
  IconTrash,
} from "common/components/Icons";
import { CommonBsd, CommonBsdStatus } from "generated/graphql/types";

import { DeleteBsffModal } from "./DeleteModal";
import { useDownloadPdf } from "./useDownloadPdf";

import styles from "../../BSDActions.module.scss";

interface BsffActionsProps {
  bsd: CommonBsd;
}

export const BsffActions = ({ bsd }: BsffActionsProps) => {
  const { siret } = useParams<{ siret: string }>();
  const location = useLocation();

  const [isDeleting, setIsDeleting] = React.useState(false);
  const [downloadPdf] = useDownloadPdf({ variables: { id: bsd.id } });

  return (
    <>
      <Menu>
        {({ isExpanded }) => (
          <>
            <MenuButton
              className={classNames(
                "btn btn--outline-primary",
                styles.BSDDActionsToggle
              )}
            >
              Actions
              {isExpanded ? (
                <IconChevronUp size="14px" color="blueLight" />
              ) : (
                <IconChevronDown size="14px" color="blueLight" />
              )}
            </MenuButton>
            <MenuList className={styles.BSDDActionsMenu}>
              <MenuLink
                as={Link}
                to={{
                  pathname: generatePath(routes.dashboard.bsffs.view, {
                    siret,
                    id: bsd.id,
                  }),
                  state: { background: location },
                }}
              >
                <IconView color="blueLight" size="24px" />
                Aperçu
              </MenuLink>
              <MenuItem onSelect={() => downloadPdf()}>
                <IconPdf size="24px" color="blueLight" />
                Pdf
              </MenuItem>
              {![CommonBsdStatus.Processed, CommonBsdStatus.Refused].includes(
                bsd.status
              ) && (
                <>
                  <MenuLink
                    as={Link}
                    to={generatePath(routes.dashboard.bsffs.edit, {
                      siret,
                      id: bsd.id,
                    })}
                  >
                    <IconPaperWrite size="24px" color="blueLight" />
                    Modifier
                  </MenuLink>
                </>
              )}
              {bsd.status === CommonBsdStatus.Initial && (
                <MenuItem onSelect={() => setIsDeleting(true)}>
                  <IconTrash color="blueLight" size="24px" />
                  Supprimer
                </MenuItem>
              )}
            </MenuList>
          </>
        )}
      </Menu>
      {isDeleting && (
        <DeleteBsffModal
          isOpen
          onClose={() => setIsDeleting(false)}
          formId={bsd.id}
        />
      )}
    </>
  );
};
