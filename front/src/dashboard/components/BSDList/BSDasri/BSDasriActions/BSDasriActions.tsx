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
import { useBsdasriDuplicate } from "./useDuplicate";
import { DeleteBsdasriModal } from "./DeleteModal";

import {
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconView,
  IconPaperWrite,
  IconDuplicateFile,
  IconPdf,
} from "common/components/Icons";
import { Bsdasri, BsdasriStatus, BsdasriType } from "generated/graphql/types";
import { useDownloadPdf } from "./useDownloadPdf";
import styles from "../../BSDActions.module.scss";
import { TableRoadControlButton } from "../../RoadControlButton";
import { Loader } from "common/components";

interface BSDAsriActionsProps {
  form: Bsdasri;
}

export const BSDAsriActions = ({ form }: BSDAsriActionsProps) => {
  const { siret } = useParams<{ siret: string }>();
  const location = useLocation();
  const [duplicateBsdasri, { loading }] = useBsdasriDuplicate({
    variables: { id: form.id },
  });
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [downloadPdf] = useDownloadPdf({ variables: { id: form.id } });

  const status = form["bsdasriStatus"];
  const emitterSiret = form.emitter?.company?.siret;
  const canDelete =
    status === BsdasriStatus.Initial ||
    (status === BsdasriStatus.SignedByProducer && siret === emitterSiret);

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
            <MenuList
              className={classNames(
                "fr-raw-link fr-raw-list",
                styles.BSDDActionsMenu
              )}
            >
              <MenuLink
                as={Link}
                to={{
                  pathname: generatePath(routes.dashboard.bsdasris.view, {
                    siret,
                    id: form.id,
                  }),
                  state: { background: location },
                }}
              >
                <IconView color="blueLight" size="24px" />
                Aperçu
              </MenuLink>

              <TableRoadControlButton siret={siret} form={form} />

              {canDelete && (
                <MenuItem onSelect={() => setIsDeleting(true)}>
                  <IconTrash color="blueLight" size="24px" />
                  Supprimer
                </MenuItem>
              )}
              {!form.isDraft && (
                <MenuItem onSelect={() => downloadPdf()}>
                  <IconPdf size="24px" color="blueLight" />
                  Pdf
                </MenuItem>
              )}
              {![BsdasriStatus.Processed, BsdasriStatus.Refused].includes(
                status
              ) && (
                <>
                  <MenuLink
                    as={Link}
                    to={generatePath(routes.dashboard.bsdasris.edit, {
                      siret,
                      id: form.id,
                    })}
                  >
                    <IconPaperWrite size="24px" color="blueLight" />
                    Modifier
                  </MenuLink>
                </>
              )}
              {form.type === BsdasriType.Simple && (
                <MenuItem onSelect={() => duplicateBsdasri()}>
                  <IconDuplicateFile size="24px" color="blueLight" />
                  Dupliquer
                </MenuItem>
              )}
            </MenuList>
          </>
        )}
      </Menu>
      {loading && <Loader />}
      {isDeleting && (
        <DeleteBsdasriModal
          isOpen
          onClose={() => setIsDeleting(false)}
          formId={form.id}
        />
      )}
    </>
  );
};
