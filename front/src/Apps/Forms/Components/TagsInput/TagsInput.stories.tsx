import React, { useState } from "react";
import { Meta, StoryFn } from "@storybook/react-vite";
import TagsInput, { TagsInputProps } from "./TagsInput";

const Component = ({
  label,
  maxTags
}: Pick<TagsInputProps, "label" | "maxTags">) => {
  const [tags, setTags] = useState<string[]>([]);

  return (
    <TagsInput
      label={label}
      maxTags={maxTags}
      tags={tags}
      onAddTag={tag => setTags([...tags, tag])}
      onDeleteTag={idx => {
        const updatedTags = [...tags];
        updatedTags.splice(idx, 1);
        setTags(updatedTags);
      }}
    />
  );
};

export default {
  title: "COMPONENTS/FORMS/TagsInput",
  component: TagsInput,
  design: {
    type: "figma",
    url: "https://www.figma.com/file/TZbRaWgchdAv8o7IxJWrKE/Trackd%C3%A9chets?type=design&node-id=9815%3A197969&mode=design&t=aipTGRtMXjPGwdhY-1"
  }
} as Meta<typeof Component>;

const Template: StoryFn<typeof Component> = args => <Component {...args} />;

export const TagsInputExample = Template.bind({});

TagsInputExample.args = {
  label: "Immatriculations",
  maxTags: 2
};
