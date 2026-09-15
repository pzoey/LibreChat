# Server-managed provider keys

## Goal and scope

This product mode removes bring-your-own provider credentials from the user experience. Operators
configure provider credentials in the server environment or deployment secret store; users choose
only from models backed by those credentials. It applies to provider endpoint credentials, not to
agent API keys, MCP credentials, or OAuth connections, which have distinct ownership and security
models.

## Rollout plan

1. Put each provider credential in the server's secret store and configure its endpoint normally.
2. Do not set provider credential variables to `user_provided`; use a real server-side credential.
3. Set `interface.userProvidedKeys: false` in `librechat.yaml`.
4. Restart the service, verify the provider-key settings section is absent, and confirm a direct
   `PUT /api/keys` request receives `403`.
5. Delete existing user provider keys after the rollout if policy requires credential removal.

```yaml
interface:
  userProvidedKeys: false
```

## Behaviour and trade-offs

`userProvidedKeys` defaults to `true` so existing LibreChat deployments keep their current
bring-your-own-key behaviour. With it set to `false`, the client omits endpoints that require a
user-provided key, hides the provider-key management control, and the server rejects all
`/api/keys` operations. This prevents new credentials from being stored and avoids presenting a
configuration path that cannot complete.

The setting does not rotate provider secrets, meter usage, or remove already-stored user keys.
Deployments that serve untrusted users should pair it with provider-side quotas, application
balance/usage controls, audit logging, and a one-time cleanup of historical user credentials.

## Request flow

```text
user selects a model
  client filters endpoints that require a user key
  server uses the configured provider credential

user calls /api/keys
  server loads the user's effective configuration
  userProvidedKeys: false -> 403
```
