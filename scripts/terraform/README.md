# New env creation

Let's say we want to create an app `test_app` in the `osc-fr1` region.

1. If it's a new environment, create the required DNS record

```
CNAME	api.test_app       trackdechets-test_app-api.osc-fr1.scalingo.io
CNAME	notifier.test_app  trackdechets-test_app-api.osc-fr1.scalingo.io
CNAME	test_app           trackdechets-test_app-front.osc-fr1.scalingo.io
```

2. Copy `terraform.tfvars.model` into `terraform.tfvars` and configure missing environment variables

3. Run tarraform to create the necessary resources in Scalingo

```
# Check plan
$ terraform plan

# Apply if okay
$ terraform apply
```

4. TODO: DB schema / manual deployment ?
