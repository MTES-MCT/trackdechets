import * as React from "react";
import { Link, generatePath, useParams, useLocation } from "react-router-dom";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuLink,
} from "@reach/menu-button";
import "@reach/menu-button/styles.css";
import classNames from "classnames";
import routes from "common/routes";
import {
  IconChevronDown,
  IconChevronUp,
  IconDuplicateFile,
  IconPaperWrite,
  IconPdf,
  IconTrash,
  IconView,
} from "common/components/Icons";
import { Form, FormStatus } from "generated/graphql/types";
import { DeleteModal } from "./DeleteModal";
import { useDuplicate } from "./useDuplicate";
import { useDownloadPdf } from "./useDownloadPdf";
import styles from "../../BSDActions.module.scss";
import { Loader } from "common/components";

interface BSDDActionsProps {
  form: Form;
}

export const BSDDActions = ({ form }: BSDDActionsProps) => {
  const { siret } = useParams<{ siret: string }>();
  const location = useLocation();
  const [downloadPdf] = useDownloadPdf({ variables: { id: form.id } });
  const [duplicateForm, { loading: isDuplicating }] = useDuplicate({
    variables: { id: form.id },
  });
  const [isDeleting, setIsDeleting] = React.useState(false);

  let canDeleteAndUpdate = [FormStatus.Draft, FormStatus.Sealed].includes(
    form.status
  );
  if (form.status === FormStatus.SignedByProducer) {
    const signedBySiret = form.emittedByEcoOrganisme
      ? form.ecoOrganisme?.siret
      : form.emitter?.company?.siret;
    canDeleteAndUpdate = siret === signedBySiret;
  }

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
                  pathname: generatePath(routes.dashboard.bsdds.view, {
                    siret,
                    id: form.id,
                  }),
                  state: { background: location },
                }}
              >
                <IconView color="blueLight" size="24px" />
                Aperçu
              </MenuLink>
              {form.status !== FormStatus.Draft && (
                <MenuItem onSelect={() => downloadPdf()}>
                  <IconPdf size="24px" color="blueLight" />
                  Pdf
                </MenuItem>
              )}
              {canDeleteAndUpdate && (
                <>
                  <MenuItem onSelect={() => setIsDeleting(true)}>
                    <IconTrash color="blueLight" size="24px" />
                    Supprimer
                  </MenuItem>
                  <MenuLink
                    as={Link}
                    to={generatePath(routes.dashboard.bsdds.edit, {
                      siret,
                      id: form.id,
                    })}
                  >
                    <IconPaperWrite size="24px" color="blueLight" />
                    Modifier
                  </MenuLink>
                </>
              )}
              {![
                FormStatus.Draft,
                FormStatus.Sealed,
                FormStatus.Refused,
              ].includes(form.status) && (
                <MenuLink
                  as={Link}
                  to={{
                    pathname: generatePath(routes.dashboard.bsdds.review, {
                      siret,
                      id: form.id,
                    }),
                    state: { background: location },
                  }}
                >
                  <IconPaperWrite size="24px" color="blueLight" />
                  Révision
                </MenuLink>
              )}
              <MenuItem onSelect={() => duplicateForm()}>
                <IconDuplicateFile size="24px" color="blueLight" />
                Dupliquer
              </MenuItem>
            </MenuList>
          </>
        )}
      </Menu>
      {isDeleting && (
        <DeleteModal
          isOpen
          onClose={() => setIsDeleting(false)}
          formId={form.id}
        />
      )}
      {isDuplicating && <Loader />}
    </>
  );
};
