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
import { Bsvhu, BsvhuStatus } from "generated/graphql/types";

import styles from "../../BSDActions.module.scss";

interface BSVhuActionsProps {
  form: Bsvhu;
}

export const BSVhuActions = ({ form }: BSVhuActionsProps) => {
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
              {![BsvhuStatus.Processed, BsvhuStatus.Refused].includes(
                form.status
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
            </MenuList>
          </>
        )}
      </Menu>
    </>
  );
};
