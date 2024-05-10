import React, { useState } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Tag } from "@codegouvfr/react-dsfr/Tag";

export type TagsInputProps = {
  label: string;
  readonly tags: string[];
  readonly onAddTag: (tag: string) => void;
  readonly onDeleteTag: (idx: number) => void;
  readonly maxTags?: number;
  readonly disabled?: boolean;
  readonly errorMessage?: string;
};

/**
 * Champ de formulaire permettant d'ajouter / supprimer des
 * valeurs à une liste de chaines de caractères.
 */
const TagsInput: React.FC<TagsInputProps> = ({
  label,
  tags,
  onAddTag,
  onDeleteTag,
  maxTags,
  disabled = false,
  errorMessage
}) => {
  const [tag, setTag] = useState("");

  const addButtonIsDisabled = maxTags ? tags.length >= maxTags : false;
  const saveTag = () => {
    if (addButtonIsDisabled || tag.length === 0) {
      return;
    }
    onAddTag(tag);
    setTag("");
  };
  return (
    <>
      <Input
        label={label}
        disabled={disabled}
        style={{ marginBottom: "10px" }}
        nativeInputProps={{
          value: tag,
          onChange: e => setTag(e.target.value),
          onBlur: () => {
            saveTag();
          },
          onKeyDown: e => {
            if (e.key === "Enter") {
              saveTag();
            }
          }
        }}
        addon={
          <Button
            disabled={addButtonIsDisabled || disabled}
            type="button"
            onClick={e => {
              e.preventDefault();
              saveTag();
            }}
          >
            Ajouter
          </Button>
        }
      />
      <div style={{ display: "flex" }}>
        {tags?.map((plate, idx) => (
          <div key={idx} style={{ padding: "0 2px" }}>
            <Tag
              dismissible
              nativeButtonProps={{
                type: "button",
                onClick: () => {
                  onDeleteTag(idx);
                }
              }}
            >
              {plate}
            </Tag>
          </div>
        ))}
      </div>
      {errorMessage && <p className="fr-error-text fr-mt-0">{errorMessage}</p>}
    </>
  );
};

export default TagsInput;
