/** Single source of truth for the app version shown in the UI. */
export const APP_VERSION = "1.0.0";

/**
 * Mask a CNIC for on-screen display so the full national ID is never
 * shown in plain view: "42101-1234567-8" -> "42101-*******-8",
 * "4210112345678" -> "42101*******8".
 */
export function maskCnic(cnic: string): string {
  if (!cnic) return "";
  const dashIdx = cnic.indexOf("-");
  if (dashIdx === -1) {
    return cnic.slice(0, 5) + "*******" + cnic.slice(-1);
  }
  return cnic.slice(0, dashIdx + 1) + "*******" + cnic.slice(-2);
}
