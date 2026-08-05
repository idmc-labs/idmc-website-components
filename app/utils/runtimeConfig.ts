// The REACT_APP_* variables are compiled into the bundle as placeholder markers
// and only get their real value when the container starts (see
// web-app-serve/apply-config.sh), so the bundler sees a non-empty constant where
// the browser may see nothing at all.
//
// Both readers below have to stay function calls. The call is what keeps the
// minifier from resolving a caller's check against the build-time marker, and
// String() is the operation it will not evaluate (terser only folds native calls
// under `compress.unsafe`, which this project leaves off). Inlining either of
// these at a call site brings the folding back.
export function readRuntimeConfig(value: string | undefined): string | undefined {
    const raw = String(value ?? '');
    if (raw.length === 0 || raw === 'undefined') {
        return undefined;
    }
    return raw;
}

// For a variable the app cannot work without. An unset one is reported where it
// is read, rather than surfacing later as a request to a relative /graphql URL or
// a link to /undefined/....
export function requireRuntimeConfig(name: string, value: string | undefined): string {
    const config = readRuntimeConfig(value);
    if (config === undefined) {
        // eslint-disable-next-line no-console
        console.error(`[config] ${name} is not set for this deployment`);
        return '';
    }
    return config;
}
