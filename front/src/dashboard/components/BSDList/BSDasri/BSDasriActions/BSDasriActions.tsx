import * as React from "react";
import { Link, generatePath, useParams, useLocation } from "react-router-dom";
import { Menu, MenuButton, MenuList, MenuLink } from "@reach/menu-button";
import "@reach/menu-button/styles.css";
import classNames from "classnames";
import routes from "common/routes";
import {
  IconChevronDown,
  IconChevronUp,
  IconView,
  IconPaperWrite,
} from "common/components/Icons";
import { Bsdasri, BsdasriStatus } from "generated/graphql/types";

import styles from "../../BSDActions.module.scss";

interface BSDAsriActionsProps {
  form: Bsdasri;
}

export const BSDAsriActions = ({ form }: BSDAsriActionsProps) => {
  const { siret } = useParams<{ siret: string }>();
  const location = useLocation();

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
              {![BsdasriStatus.Processed, BsdasriStatus.Refused].includes(
                form.status
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
            </MenuList>
          </>
        )}
      </Menu>
    </>
  );
};
