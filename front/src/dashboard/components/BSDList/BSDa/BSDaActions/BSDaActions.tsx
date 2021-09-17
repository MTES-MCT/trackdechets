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
  IconDuplicateFile,
  IconTrash,
} from "common/components/Icons";
import { Bsda, BsdaStatus } from "generated/graphql/types";
import { DeleteBsdaModal } from "./DeleteModal";
import { useDownloadPdf } from "./useDownloadPdf";
import { useDuplicate } from "./useDuplicate";

import styles from "../../BSDActions.module.scss";
import { Loader } from "common/components";

interface BSdaActionsProps {
  form: Bsda;
}

export const BSDaActions = ({ form }: BSdaActionsProps) => {
  const { siret } = useParams<{ siret: string }>();
  const location = useLocation();

  const [duplicateBsda, { loading }] = useDuplicate({
    variables: { id: form.id },
  });
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [downloadPdf] = useDownloadPdf({ variables: { id: form.id } });

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
                  pathname: generatePath(routes.dashboard.bsdas.view, {
                    siret,
                    id: form.id,
                  }),
                  state: { background: location },
                }}
              >
                <IconView color="blueLight" size="24px" />
                Aperçu
              </MenuLink>
              {!form.isDraft && (
                <MenuItem onSelect={() => downloadPdf()}>
                  <IconPdf size="24px" color="blueLight" />
                  Pdf
                </MenuItem>
              )}
              {![BsdaStatus.Processed, BsdaStatus.Refused].includes(
                form["bsdaStatus"]
              ) && (
                <>
                  <MenuLink
                    as={Link}
                    to={generatePath(routes.dashboard.bsdas.edit, {
                      siret,
                      id: form.id,
                    })}
                  >
                    <IconPaperWrite size="24px" color="blueLight" />
                    Modifier
                  </MenuLink>
                </>
              )}
              <MenuItem onSelect={() => duplicateBsda()}>
                <IconDuplicateFile size="24px" color="blueLight" />
                Dupliquer
              </MenuItem>
              {form["bsdaStatus"] === BsdaStatus.Initial && (
                <MenuItem onSelect={() => setIsDeleting(true)}>
                  <IconTrash color="blueLight" size="24px" />
                  Supprimer
                </MenuItem>
              )}
            </MenuList>
          </>
        )}
      </Menu>
      {loading && <Loader />}
      {isDeleting && (
        <DeleteBsdaModal
          isOpen
          onClose={() => setIsDeleting(false)}
          formId={form.id}
        />
      )}
    </>
  );
};
