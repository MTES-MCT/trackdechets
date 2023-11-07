#!/bin/bash

if [ "$STORYBOOK_ENV" = "STORYBOOK" ] ; then
  npm --prefix front run run-storybook
else
  node front/server.js
fi