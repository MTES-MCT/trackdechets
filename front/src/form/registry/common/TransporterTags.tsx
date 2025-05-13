import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { formatError } from "../builder/error";
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
  const error = errors?.[fieldName];
  const tags = methods.watch(fieldName);

  return (
    <div className="fr-col">
      <div className="fr-mb-2w">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
          <div className="fr-col-6">
            <TagsInput
              label={label}
              maxTags={maxTags}
              tags={tags}
              onAddTag={v => methods.setValue(fieldName, [...tags, v])}
              onDeleteTag={idx => {
                tags.splice(idx, 1);
                methods.setValue(fieldName, [...tags]);
              }}
              errorMessage={formatError(error)}
              hintText={infoText}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
