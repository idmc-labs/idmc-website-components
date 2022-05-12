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
