import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";
  const role = url.searchParams.get("role");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    // 구글 신규 가입 시 role 지정 (기본값 customer → 변경)
    if (role && role !== "customer") {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ role }).eq("id", user.id);
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
