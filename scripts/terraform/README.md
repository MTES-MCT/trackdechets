# New env creation

Let's say we want to create an app `test_app` in the `osc-fr1` region.

1. If it's a new environment, create the required DNS record

```
CNAME	api.test_app       trackdechets-test_app-api.osc-fr1.scalingo.io
CNAME	notifier.test_app  trackdechets-test_app-api.osc-fr1.scalingo.io
CNAME	test_app           trackdechets-test_app-front.osc-fr1.scalingo.io
```

2. Copy `terraform.tfvars.model` into `terraform.tfvars` and configure missing environment variables

3. Run terraform to create the necessary resources in Scalingo

```
# Install dependencies if it's the first run
terraform init

# Check plan
$ terraform plan

# Apply if okay
$ terraform apply
```

4. Restore a DB backup & index ES

Either restore an existing backup, keeping compatibility with migrations :

```
$ scalingo -a trackdechets-test_app-api run --file /path/to/db_backup.pgsql bash

# Restore a backup
> pg_restore -d $SCALINGO_POSTGRESQL_URL --clean /tmp/uploads/db_backup.pgsql

# Run migrations
> npm run migrate

# Re-index all bsds in ES
> npm run reindex-all-bsds-bulk
```

Or push the schema with Prisma (migrations won't work) :

```
$ scalingo -a trackdechets-test_app-api run bash

> prisma db push

# Seed if necessary
> cd dist/prisma/
> cp seed.model.js seed.dev
> node seed.js

# Re-index bsds in ES
> npm run reindex-all-bsds-bulk
```

You should be good to go !

Things to check if it doesn't work:

- missing envs ? Add them to the terraform config if needed
- are the resources scaled up ? Sometimes, Scalingo assigns 0 containers to every app except web
