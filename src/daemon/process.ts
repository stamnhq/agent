export async function daemonizeProcess(): Promise<void> {
  const mod = await import('daemonize-process');
  const daemonize =
    typeof mod.default === 'function' ? mod.default : (mod as any);
  daemonize();
}
