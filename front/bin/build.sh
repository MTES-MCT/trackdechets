#!/bin/bash

if [ "$STORYBOOK_ENV" = "STORYBOOK" ] ; then
  npm run build-storybook
else
  npm run build-prod
fi