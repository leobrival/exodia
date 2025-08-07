import { env } from "@/env";
import { z } from "zod";
import { createBrowserClient } from "./supabase";

// Email validation schema
const emailSchema = z.string().email("Invalid email format");

// Auth result types
export interface AuthResult {
  success: boolean;
  error: string | null;
}

// Email validation function
export function validateEmail(email: string): string {
  return emailSchema.parse(email);
}

// Send magic link function
export async function sendMagicLink(
  email: string,
  redirectTo?: string
): Promise<AuthResult> {
  try {
    // Validate email first
    validateEmail(email);

    const supabase = createBrowserClient();

    // Build redirect URL with optional redirectTo parameter
    let emailRedirectTo = `${env.NEXT_PUBLIC_BASE_URL}/auth/callback`;
    if (redirectTo) {
      emailRedirectTo += `?redirectTo=${encodeURIComponent(redirectTo)}`;
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error; // Re-throw validation errors
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

// Sign out function
export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
