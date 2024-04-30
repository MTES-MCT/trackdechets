import { FieldArray, useField } from "formik";
import TagsInput, { TagsInputProps } from "./TagsInput";

import React from "react";
import { useFormContext } from "react-hook-form";
type TagsInputWrapperProps = {
  readonly fieldName: string;
} & Pick<TagsInputProps, "label" | "maxTags">;

/**
 * Wrapper autour de TagsInput qui permet de contrôler son
 * état via Formik
 */
const TagsInputWrapper: React.FC<TagsInputWrapperProps> = ({
  fieldName,
  label,

  maxTags
}) => {
  const [tags] = useField<string[]>(fieldName);

  return (
    <FieldArray name={fieldName}>
      {arrayHelpers => {
        return (
          <TagsInput
            label={label}
            maxTags={maxTags}
            tags={tags.value}
            onAddTag={tag => arrayHelpers.push(tag)}
            onDeleteTag={idx => arrayHelpers.remove(idx)}
          />
        );
      }}
    </FieldArray>
  );
};

type RhfTagsInputWrapperProps = TagsInputWrapperProps;

/**
 * Wrapper autour de TagsInput adapté à rhf.
 * Doit être placé au sein d'un FormProvider
 */
export const RhfTagsInputWrapper: React.FC<RhfTagsInputWrapperProps> = ({
  fieldName,
  label,
  maxTags
}) => {
  const { setValue, watch, getFieldState } = useFormContext();

  const tags = watch(fieldName);

  const { error } = getFieldState(fieldName);

  return (
    <TagsInput
      label={label}
      maxTags={maxTags}
      tags={tags}
      onAddTag={v => setValue(fieldName, [...tags, v])}
      onDeleteTag={idx => {
        // toSpliced yet unsupported
        tags.splice(idx, 1);
        setValue(fieldName, [...tags]);
      }}
      errorMessage={error?.message}
    />
  );
};

export default TagsInputWrapper;
