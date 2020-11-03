import React from "react";
import { Search } from "./Icons";
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
        <Search color="#8393a7" size={12} />
      </i>
    </div>
  );
}
