export const WHATSAPP_BACKEND_URL: string =
  (import.meta.env.VITE_WHATSAPP_BACKEND_URL as string | undefined) ?? "";
export const WHATSAPP_BACKEND_TOKEN: string =
  (import.meta.env.VITE_WHATSAPP_BACKEND_TOKEN as string | undefined) ?? "";

export function isBackendConfigured(): boolean {
  return Boolean(WHATSAPP_BACKEND_URL && WHATSAPP_BACKEND_TOKEN);
}
