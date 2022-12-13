#!/bin/bash

if [ "$STORYBOOK_ENV" = "STORYBOOK" ] ; then
  npm run build-storybook && npm run run-storybook
else
  npm run start
fi