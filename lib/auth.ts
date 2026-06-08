import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/db";

export type { Profile };

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();
  return data ?? null;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireSupplier() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "supplier") redirect("/");
  return profile;
}

export async function requireInfluencer() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "influencer") redirect("/");
  return profile;
}

export async function requireAuth() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

// Backwards compat stubs for old seller/ pages
export const requireSeller = requireSupplier;
export const requireAdmin = requireAuth;
