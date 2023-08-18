import React from "react";
import { IconSearch } from "../../Apps/common/Components/Icons/Icons";
import styles from "./SearchInput.module.scss";

export default function SearchInput({
  onChange,
  id,
  placeholder = "",
  className = "",
  value = "",
  disabled = false,
}: {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id: string;
  className?: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
}) {
  return (
    <div className={styles.SearchField}>
      <input
        id={id}
        type="text"
        className={`td-input ${className}`}
        onChange={e => onChange(e)}
        placeholder={placeholder}
        disabled={disabled}
        {...(!!value ? { value: value } : {})}
      />
      <i className={styles.SearchIcon} aria-label="Recherche">
        <IconSearch size="12px" />
      </i>
    </div>
  );
}
