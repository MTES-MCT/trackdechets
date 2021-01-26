import React from "react";
import { IconSearch } from "./Icons";
import styles from "./SearchInput.module.scss";

export default function SearchInput({
  onChange,
  id,
  placeholder = "",
  className = "",
  value = "",
}: {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id: string;
  className?: string;
  placeholder?: string;
  value?: string;
}) {
  return (
    <div className={styles.SearchField}>
      <input
        id={id}
        type="text"
        className={`td-input ${className}`}
        onChange={e => onChange(e)}
        placeholder={placeholder}
        {...(!!value ? { value: value } : {})}
      />
      <i className={styles.SearchIcon} aria-label="Recherche">
        <IconSearch size="12px" />
      </i>
    </div>
  );
}
