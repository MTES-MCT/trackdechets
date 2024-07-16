import React from "react";

import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";

export default function SearchInput({
  onChange,

  placeholder = "",
  className = "",
  value = "",
  disabled = false
}: {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id: string;
  className?: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <SearchBar
        className={className}
        renderInput={({ className, id }) => (
          <input
            value={value}
            className={className}
            disabled={disabled}
            id={id}
            placeholder={placeholder}
            onChange={e => onChange(e)}
          />
        )}
      />
    </div>
  );
}
