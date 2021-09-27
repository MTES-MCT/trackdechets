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
import { Bsvhu, BsvhuStatus } from "generated/graphql/types";
import { DeleteBsvhuModal } from "./DeleteModal";
import { useDownloadPdf } from "./useDownloadPdf";
import { useDuplicate } from "./useDuplicate";

import styles from "../../BSDActions.module.scss";
import { Loader } from "common/components";

interface BSVhuActionsProps {
  form: Bsvhu;
}

export const BSVhuActions = ({ form }: BSVhuActionsProps) => {
  const { siret } = useParams<{ siret: string }>();
  const location = useLocation();

  const [duplicateBsvhu, { loading: isDuplicating }] = useDuplicate({
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
                  pathname: generatePath(routes.dashboard.bsvhus.view, {
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
              {![BsvhuStatus.Processed, BsvhuStatus.Refused].includes(
                form["bsvhuStatus"]
              ) && (
                <>
                  <MenuLink
                    as={Link}
                    to={generatePath(routes.dashboard.bsvhus.edit, {
                      siret,
                      id: form.id,
                    })}
                  >
                    <IconPaperWrite size="24px" color="blueLight" />
                    Modifier
                  </MenuLink>
                </>
              )}
              <MenuItem onSelect={() => duplicateBsvhu()}>
                <IconDuplicateFile size="24px" color="blueLight" />
                Dupliquer
              </MenuItem>
              {form["bsvhuStatus"] === BsvhuStatus.Initial && (
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
        <DeleteBsvhuModal
          isOpen
          onClose={() => setIsDeleting(false)}
          formId={form.id}
        />
      )}
      {isDuplicating && <Loader />}
    </>
  );
};
