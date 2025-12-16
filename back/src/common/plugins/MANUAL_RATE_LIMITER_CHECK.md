# Manual GQL Rate Limiter Redis Check

## 1. Clear the Redis key for your test user and operation

```
redis-cli DEL gql_invitation_test@example.com
```

## 2. Send a GraphQL request with multiple operations (aliases)

Example request (use Postman, Insomnia, or curl):

```
POST http://localhost:4000/graphql
Content-Type: application/json

{
  "query": "query BatchTest { q1: invitation(hash: \"validHash1\") { id } q2: invitation(hash: \"validHash2\") { id } q3: invitation(hash: \"validHash3\") { id } }"
}
```

Or with curl:

```
curl -X POST http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query": "query BatchTest { q1: invitation(hash: \"validHash1\") { id } q2: invitation(hash: \"validHash2\") { id } q3: invitation(hash: \"validHash3\") { id } }"}'
```

Make sure the request is authenticated as `test@example.com` (or the user your key is based on).

## 3. Check the Redis key after the request

```
redis-cli GET gql_invitation_test@example.com
```

The value should be `3` (one for each operation in the batch).

## 4. Send a single-operation request and check again

```
POST http://localhost:4000/graphql
Content-Type: application/json

{
  "query": "{ invitation(hash: \"validHash4\") { id } }"
}
```

Or with curl:

```
curl -X POST http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query": "{ invitation(hash: \"validHash4\") { id } }"}'
```

Then:

```
redis-cli GET gql_invitation_test@example.com
```

The value should now be `4`.

---

If the values match the number of operations, the rate limiter is counting correctly.
