import { headers } from "next/headers";
const APPDOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN;

export async function getCurrentHost() {
  const headersList = await headers();
  const host = headersList.get("host");
  const currentHost = host?.split(APPDOMAIN!)[0];
  return currentHost?.replace(".", "");
}
