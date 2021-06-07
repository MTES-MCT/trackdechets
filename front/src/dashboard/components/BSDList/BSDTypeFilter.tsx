import * as React from "react";
import { FilterProps } from "react-table";
import { Menu, MenuButton, MenuList, MenuItem } from "@reach/menu-button";

import "@reach/menu-button/styles.css";
import classNames from "classnames";
import { Bsd, BsdType } from "generated/graphql/types";
import {
  IconBSDD,
  IconCheckCircle1,
  IconChevronDown,
  IconClose,
  IconBSDasri,
  IconBSVhu,
} from "common/components/Icons";
import styles from "./BSDTypeFilter.module.scss";

const OPTIONS = [
  {
    value: BsdType.Bsdd,
    Icon: IconBSDD,
    label: "Déchets dangereux",
  },
  {
    value: BsdType.Bsdasri,
    Icon: IconBSDasri,
    label: "DASRIs",
  },
  {
    value: BsdType.Bsvhu,
    Icon: IconBSVhu,
    label: "VHUs",
  },
];

export function BSDTypeFilter({
  column: {
    // by default all types are returned so they're kinda "all checked"
    filterValue = OPTIONS.map(({ value }) => value),
    setFilter,
  },
}: FilterProps<Bsd>) {
  return (
    <Menu>
      {({ isExpanded }) => (
        <>
          <MenuButton className={styles.BSDTypeFilterToggle}>
            <span className={styles.BSDTypeFilterToggleLabel}>Filtrer</span>

            {isExpanded ? (
              <IconClose className={styles.BSDTypeFilterToggleIcon} />
            ) : (
              <IconChevronDown className={styles.BSDTypeFilterToggleIcon} />
            )}
          </MenuButton>
          <MenuList className={styles.BSDTypeFilterMenu}>
            {OPTIONS.map(({ value, Icon, label }) => {
              const isChecked = filterValue.includes(value);

              return (
                <MenuItem
                  key={value}
                  className={styles.BSDTypeFilterMenuItem}
                  onSelect={() => {
                    setFilter(
                      isChecked
                        ? filterValue.filter(otherValue => otherValue !== value)
                        : filterValue.concat([value])
                    );
                    return false;
                  }}
                >
                  <IconCheckCircle1
                    className={classNames(styles.BSDTypeFilterMenuItemCheck, {
                      [styles.BSDTypeFilterMenuItemCheckVisible]: isChecked,
                    })}
                  />
                  <Icon className={styles.BSDTypeFilterMenuItemIcon} />
                  <span className={styles.BSDTypeFilterMenuItemLabel}>
                    {label}
                  </span>
                </MenuItem>
              );
            })}
          </MenuList>
        </>
      )}
    </Menu>
  );
}
