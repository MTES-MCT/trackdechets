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
  maxTags
}) => {
  const [tag, setTag] = useState("");

  const addButtonIsDisabled = maxTags ? tags.length >= maxTags : false;

  return (
    <>
      <Input
        label={label}
        style={{ marginBottom: "10px" }}
        nativeInputProps={{
          value: tag,
          onChange: e => setTag(e.target.value)
        }}
        addon={
          <Button
            disabled={addButtonIsDisabled}
            onClick={e => {
              e.preventDefault();
              if (tag.length > 0) {
                onAddTag(tag);
                setTag("");
              }
            }}
          >
            Ajouter
          </Button>
        }
      />
      <div style={{ display: "flex" }}>
        {tags.map((plate, idx) => (
          <div key={idx} style={{ padding: "0 2px" }}>
            <Tag
              dismissible
              nativeButtonProps={{
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
    </>
  );
};

export default TagsInput;
