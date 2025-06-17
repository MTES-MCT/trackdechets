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
  readonly hintText?: string;
};

/**
 * Champ de formulaire permettant d'ajouter / supprimer des
 * valeurs à une liste de chaines de caractères.
 */
const TagsInput = ({
  label,
  tags,
  onAddTag,
  onDeleteTag,
  maxTags,
  disabled = false,
  errorMessage,
  hintText = ""
}: TagsInputProps): React.JSX.Element => {
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
        hintText={hintText}
        disabled={disabled}
        className="fr-mb-2w"
        nativeInputProps={{
          value: tag,
          ...{ "data-testid": "tagsInput" },
          onChange: e => setTag(e.target.value),
          onBlur: () => {
            saveTag();
          },
          onKeyDown: e => {
            if (e.key === "Enter") {
              e.preventDefault();
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
        state={errorMessage ? "error" : "default"}
        stateRelatedMessage={errorMessage}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {tags?.map((plate, idx) => (
          <div key={idx}>
            <Tag
              className="fr-mb-1v"
              dismissible={!disabled}
              nativeButtonProps={{
                type: "button",
                disabled,
                onClick: () => {
                  onDeleteTag(idx);
                },
                ...{ "data-testid": "tagsInputTags" }
              }}
            >
              {plate}
            </Tag>
          </div>
        ))}
      </div>
    </>
  );
};

export default TagsInput;
