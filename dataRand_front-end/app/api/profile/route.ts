// app/api/profile/route.ts

import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies as nextCookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { auth_id, role } = await request.json();

  if (!auth_id || !role) {
    return NextResponse.json(
      { message: "auth_id and role are required" },
      { status: 400 }
    );
  }

  const cookieStore = await nextCookies(); // ✅ await

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  try {
    const { data, error } = await supabase
      .from("profiles")
      .insert([{ auth_id, role }]);

    if (error) {
      console.error("Error inserting profile:", error);
      return NextResponse.json(
        { message: "Error creating profile", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Profile created successfully", data },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { message: "Unexpected error", error: error.message },
      { status: 500 }
    );
  }
}
