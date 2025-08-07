import { parseAuthCallbackParams } from "@/lib/auth-callback";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;

  // Parser et valider les paramètres avec notre nouveau système
  const { params, hasError, errorMessage } =
    parseAuthCallbackParams(searchParams);

  const {
    code,
    next = "/projects",
    error,
    error_code,
    error_description,
  } = params;

  // Handle authentication errors avec messages user-friendly
  if (hasError && error) {
    console.error("Auth callback error:", {
      error,
      error_code,
      error_description,
      parsed_message: errorMessage,
    });

    // Construire l'URL de redirection avec les paramètres d'erreur
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("error", error);
    if (error_code) loginUrl.searchParams.set("error_code", error_code);
    if (error_description)
      loginUrl.searchParams.set("error_description", error_description);

    return NextResponse.redirect(loginUrl);
  }

  // Exchange code for session if code is present
  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient({
      get: (key: string) => {
        const cookie = cookieStore.get(key);
        return cookie ? { value: cookie.value } : null;
      },
      set: (key: string, value: string, options: any) => {
        cookieStore.set(key, value, options);
      },
      remove: (key: string, options: any) => {
        cookieStore.set(key, '', { ...options, expires: new Date(0) });
      },
    });

    try {
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("Error exchanging code for session:", exchangeError);

        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("error", "invalid_token");
        loginUrl.searchParams.set(
          "error_description",
          "Invalid authentication code"
        );

        return NextResponse.redirect(loginUrl);
      }

      if (data.session) {
        // Successfully authenticated, redirect to intended destination
        return NextResponse.redirect(new URL(next, request.url));
      }
    } catch (err) {
      console.error("Unexpected error during auth callback:", err);

      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "server_error");
      loginUrl.searchParams.set("error_description", "Authentication failed");

      return NextResponse.redirect(loginUrl);
    }
  }

  // No code parameter, redirect to login with error
  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("error", "invalid_request");
  loginUrl.searchParams.set("error_description", "Missing authentication code");

  return NextResponse.redirect(loginUrl);
}
