import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "./api";

export async function requireAuth() {
  try {
    const user = await api.get("/auth/me");
    return user;
  } catch {
    redirect("/auth/sign-in");
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session"); // replace with your session cookie name
  return session;
}
