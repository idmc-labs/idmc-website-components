# IDMC Website Components

React components for IDMC website

## Development

Before you start, copy `.env.example` as `.env` and set the env variables.

```bash
# Start web app
docker-compose up
```

```bash
# Generate graphql files
yarn generate

# Build web app
yarn build

# Typescript check
yarn typecheck

# Eslint check
yarn eslint

# Check unused files
yarn check-unused

# Run tests
yarn test
```

### Using api from drupal website

```bash
# Clone proxy server
git clone git@github.com:toggle-corp/simple-proxy.git idmc-website-proxy
```

Before you start, copy `.env.template` as `.env` and set the env variables.

```bash
# Start proxy
docker-compose up
```

You will need to update the `.env` file for your react application.

## Google Analytics

Page views are sent to a GA4 property through `react-ga4`. Because this app has
no client-side router (the page is chosen via the `?page=` query string in
standalone mode or `window.page` in embedded mode), GA4's automatic page-view
tracking is disabled and each `page_view` is sent manually.

### Custom Dimensions

Some event parameters are reportable only after being registered in the GA4 UI
(Admin → Custom definitions → Create custom dimensions):

| Event parameter | Dimension name | Scope | Notes |
| --- | --- | --- | --- |
| `country_iso3` | `Country ISO3` | Event | Per-country page popularity. The parameter name must match exactly. |
| `client_code` | `Client Code` | Event | `clientCode` is stripped from `page_location`/`page_referrer` and reported only through this dimension. |

## Production

### AWS

```bash
# PREVIEW
aws cloudformation deploy --capabilities CAPABILITY_NAMED_IAM --template-file aws/cloudformation.yaml --stack-name preview-idmc-website-components --tags app=idmc-website env=preview --parameter-overrides Env=preview HostedZoneId=<HostedZoneId>

# RELEASE
aws cloudformation deploy --capabilities CAPABILITY_NAMED_IAM --template-file aws/cloudformation.yaml --stack-name release-idmc-website-components --tags app=idmc-website env=release --parameter-overrides Env=release HostedZoneId=<HostedZoneId>
```
