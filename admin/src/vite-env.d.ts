/// <reference types="vite/client" />

// Make `import.meta.env` available to TypeScript in this Vite app.
// Vite's `vite/client` types add the `env` field; we also tighten the specific
// variable used across services in this project.
interface ImportMetaEnv {
    readonly VITE_BASE_URL: string;
}

