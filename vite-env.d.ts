// Manually define environment types as vite/client types are missing in this context
interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
