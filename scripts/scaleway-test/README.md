# Scaleway Deployment test environment

## Pre-requisites

1. you need to have scaleway cli installed and initialized.
   scw config:

- secret key and access key -> generate one in the "DB test environment" project on scaleway
- project-id: find it on the scaleway dashboard (project DB tets environment -> "Copier l'ID")
- org id: the default

2. you need to add the scaleway project id in your .env file like this:

`SCALEWAY_RESTORE_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

3. you need to have added you SSH key to the "DB test environment" project on scaleway

## How to use

run `./main_restore.sh` file on your machine

This will guide you to start a pre-configured instance to run the tests

Once this is done, SSH into the server (`ssh root@xxxx`)

Run `./tester.sh`

Once it's done, rune what you want to test (`npx prisma migratre dev` or `npx nx run @td/scripts:migrate`)

## What are the files in this folder

- _main_restore.sh_ -> the script to launch a scaleway instance
- **remote**
  - _tester.sh_ -> the script that is supposed to be at the root of the remote server, used to load the database, and init the repo to the branch you want to test
