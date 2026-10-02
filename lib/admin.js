import crypto from "node:crypto";

const secret = () => process.env.POOJAVI_ADMIN_SECRET || process.env.POOJAVI_ADMIN_PASSWORD || "poojavi-change-me";

export function adminToken() {
  return crypto.createHmac("sha256", secret()).update("poojavi-admin").digest("hex");
}

export function isAdmin(request) {
  return request.cookies.get("poojavi_admin")?.value === adminToken();
}
