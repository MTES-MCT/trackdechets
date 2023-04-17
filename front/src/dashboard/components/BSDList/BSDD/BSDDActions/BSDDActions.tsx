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
  IconAddCircle,
  IconChevronDown,
  IconChevronUp,
  IconDuplicateFile,
  IconPaperWrite,
  IconPdf,
  IconTrash,
  IconView,
} from "common/components/Icons";
import { EmitterType, Form, FormStatus } from "generated/graphql/types";
import { DeleteModal } from "./DeleteModal";
import { useDuplicate } from "./useDuplicate";
import { useDownloadPdf } from "./useDownloadPdf";
import styles from "../../BSDActions.module.scss";
import { Loader } from "common/components";
import { TableRoadControlButton } from "../../RoadControlButton";

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
    // if the bsd is only signed by the emitter, they can still update/delete it
    // so if it's signed by the emitter, they can do it but not the eco organisme
    // if it's signed by the eco organisme, they can do it but not the emitter
    const signedBySiret = form.emittedByEcoOrganisme
      ? form.ecoOrganisme?.siret
      : form.emitter?.company?.siret;
    canDeleteAndUpdate = siret === signedBySiret;
  }

  const isAppendix1 = form.emitter?.type === EmitterType.Appendix1;
  const isAppendix1Producer =
    form.emitter?.type === EmitterType.Appendix1Producer;
  const showAppendix1Button =
    isAppendix1 && [FormStatus.Sealed, FormStatus.Sent].includes(form.status);

  const canRequestRevision =
    ![FormStatus.Draft, FormStatus.Sealed, FormStatus.Refused].includes(
      form.status
    ) && !isAppendix1Producer;

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
              <TableRoadControlButton siret={siret} form={form} />

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

              <TableRoadControlButton siret={siret} form={form} />

              {showAppendix1Button && (
                <MenuLink
                  as={Link}
                  to={{
                    pathname: generatePath(routes.dashboard.bsdds.view, {
                      siret,
                      id: form.id,
                    }),
                    search: "?selectedTab=0",
                    state: { background: location },
                  }}
                >
                  <IconAddCircle size="24px" color="blueLight" />
                  Annexe 1
                </MenuLink>
              )}

              {form.status !== FormStatus.Draft && (
                <MenuItem onSelect={() => downloadPdf()}>
                  <IconPdf size="24px" color="blueLight" />
                  Pdf
                </MenuItem>
              )}

              {!isAppendix1Producer && (
                <MenuItem onSelect={() => duplicateForm()}>
                  <IconDuplicateFile size="24px" color="blueLight" />
                  Dupliquer
                </MenuItem>
              )}

              {canDeleteAndUpdate && !isAppendix1Producer && (
                <>
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

              {canRequestRevision && (
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

              {canDeleteAndUpdate && (
                <>
                  <MenuItem onSelect={() => setIsDeleting(true)}>
                    <IconTrash color="blueLight" size="24px" />
                    Supprimer
                  </MenuItem>
                </>
              )}
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
