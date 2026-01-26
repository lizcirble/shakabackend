import { createServerClient } from "@supabase/ssr";
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

  const cookieStore = nextCookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookieStore).getAll();
        },
        async setAll(cookiesToSet) {
          const resolvedCookieStore = await cookieStore;
          cookiesToSet.forEach(({ name, value, options }) => {
            resolvedCookieStore.set(name, value, options);
          });
        }
      },
    }
  );

  const { data, error } = await supabase
    .from("profiles")
    .insert([{ auth_id, role }]);

  if (error) {
    return NextResponse.json(
      { message: "Error creating profile", error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Profile created successfully", data },
    { status: 201 }
  );
}
