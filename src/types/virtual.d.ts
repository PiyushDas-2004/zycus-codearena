/** URL of the bundled test sandbox runtime (see the sandboxRuntime plugin in vite.config.ts). */
declare module 'virtual:sandbox-runtime' {
  const url: string;
  export default url;
}
