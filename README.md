# Express template

Provisioned from [`Qode-Fleet-Control/fleet-template-v1`](https://github.com/Qode-Fleet-Control/fleet-template-v1) — the fleet
lifecycle contract (`bin/`, `fleet.conf`, deploy workflows, `compose.yaml`) with an Express 4 web app (EJS views, static files, JSON body parsing) from the official generator laid on top.

Listens on `0.0.0.0:$PORT` (default `3000`) and serves at the root (`/`) of its own hostname
(`https://<hash>.<FLEET_APP_DOMAIN>/`); the health check hits `/health`. In the container: `node ./bin/www`.

## Origin

    npx express-generator@4 --view=ejs --git qode-express-template-v1

Generated 2026-10-05 with express-generator 4.16.1 (host Node v22.12.0 / npm 10.9.0).

## Run it

### On the fleet

The fleet clones the repo, injects `PORT` (and the workspace's `DATABASE_URL`, `REDIS_URL`, ...) and runs
`bin/run`, which uses the docker runtime from `fleet.conf`: `docker compose build`, then `docker compose up --remove-orphans` in the foreground.

### With docker

    PORT=3000 bin/run                  # what the fleet does
    docker compose up --build        # or plain compose

### Without docker

`FLEET_RUNTIME=process bin/run` runs the plain commands from `fleet.conf`:

| step | command |
|---|---|
| install | `npm install` |
| build | `(none)` |
| start | `env PORT="$PORT" node ./bin/www` |

    ./bin/run       # install, build, start in the foreground
    ./bin/start     # start from existing build artifacts
    ./bin/restart   # rebuild and restart
    ./bin/stop      # stop whatever holds the port

See `docs/fleet-lifecycle.md` for the full contract.

## Deviations from the generator output

- Added `GET /health` (returns `{"status":"ok"}`) in `app.js` for the fleet health check.
- Dependencies bumped to patched releases: the generator still pins 2018-era versions with published advisories (`ejs ~2.6.1` has a critical template-injection RCE, `morgan <1.12.1` log forging). Now `express ^4.21.2`, `ejs ^3.1.10`, `morgan ~1.12.1`, `http-errors ~2.0.0`, `cookie-parser ~1.4.7`; `npm audit` is clean.
- `bin/www` (the generator's server entrypoint) shares `bin/` with the fleet's lifecycle scripts; the names do not collide, so both stay where their tools expect them.
- `package-lock.json` added (`npm install --package-lock-only`) so the image build can use `npm ci`.
- Added the fleet files: `bin/` (lifecycle scripts), `fleet.conf`, `Dockerfile`, `compose.yaml`, `.dockerignore`, `.env.example`, `.github/workflows/`, `docs/fleet-lifecycle.md`; fleet entries (`.fleet/`, `*.log`, ...) prepended to `.gitignore`.

## Verified

Verified 2026-10-05 against the fleet's docker runtime, on docker 29.8:

- `migrate.py audit` (the coordinator's own refusal checks): **READY**.
- `verify.sh <repo> 46011` — `bin/run` in the background, probe `HEALTH_PATH`, `bin/restart`, probe again,
  `bin/stop`: `run=200 restart=200 containers_after_stop=0`. `GET /health` answered 200 via the container. `npm audit`: 0 vulnerabilities.
