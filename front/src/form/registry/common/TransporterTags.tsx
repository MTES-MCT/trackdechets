import React from "react";
import { FieldError, type UseFormReturn } from "react-hook-form";
import TagsInput from "../../../Apps/Forms/Components/TagsInput/TagsInput";

type Props = {
  label: string;
  prefix: string;
  methods: UseFormReturn<any>;
  maxTags?: number;
  infoText?: string;
  disabled?: boolean;
};

export function TransporterTags({
  methods,
  disabled,
  prefix,
  label,
  maxTags,
  infoText
}: Props) {
  const { errors } = methods.formState;
  const fieldName = `${prefix}Plates`;
  const errorArray = errors?.[fieldName];
  const errorsUnique = errorArray
    ? [
        ...new Set(
          (errorArray as unknown as FieldError[])
            ?.map(error => error.message)
            .filter(Boolean)
        )
      ]
    : [];
  const tags = methods.watch(fieldName);
  return (
    <div className="fr-col">
      <div className="fr-mb-2w">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
          <div className="fr-col-md-6">
            <TagsInput
              label={label}
              maxTags={maxTags}
              tags={tags}
              onAddTag={v => methods.setValue(fieldName, [...tags, v])}
              onDeleteTag={idx => {
                tags.splice(idx, 1);
                methods.setValue(fieldName, [...tags]);
              }}
              errorMessage={errorsUnique.join(", ")}
              hintText={infoText}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
