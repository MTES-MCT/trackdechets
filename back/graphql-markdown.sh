#!/bin/bash

TEMPLATE="----
id: api-reference
title: Référence de l'API
sidebar_label: Référence de l'API
----

<!-- START graphql-markdown -->
<!-- END graphql-markdown -->
"

echo "$TEMPLATE" > documentation/api-reference.md

npx graphql-markdown --no-title --no-toc --update-file documentation/api-reference.md ./src/graphql.schema.json
