import { FieldArray, useField } from "formik";
import TagsInput, { TagsInputProps } from "./TagsInput";
import React from "react";

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

export default TagsInputWrapper;
