export const CSP: string;
export const META_CSP: string;
export const DEV_CSP: string;
export const SECURITY_HEADERS: Readonly<Record<string, string>>;
export const DEV_SECURITY_HEADERS: Readonly<Record<string, string>>;
export function serializeHeaders(headers?: Readonly<Record<string, string>>): string;
