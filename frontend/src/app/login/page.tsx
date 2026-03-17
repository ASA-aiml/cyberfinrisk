"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { user, loginWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  async function handleGoogleLogin() {
    setIsLoggingIn(true);
    setError("");
    try {
      await loginWithGoogle();
      // Router handles the push based on the useEffect
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in. Please try again.");
      setIsLoggingIn(false);
    }
  }

  if (loading || (user && !isLoggingIn)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-8 h-8 animate-spin text-[#e63946]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#09090b]">
      {/* Background decoration */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #e63946 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-[#e6394622] transition-transform group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #e63946, #c1121f)" }}
            >
              C
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">CyberFinRisk</span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Welcome back</h1>
          <p className="text-sm text-zinc-400">
            Sign in to continue to your risk dashboard
          </p>
        </div>

        <div 
          className="rounded-2xl p-8 shadow-2xl backdrop-blur-sm"
          style={{ 
            background: "rgba(18, 18, 21, 0.8)", 
            border: "1px solid rgba(39, 39, 42, 0.8)" 
          }}
        >
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            style={{ 
              background: "linear-gradient(135deg, #e63946, #c1121f)",
              boxShadow: "0 4px 20px -5px rgba(230, 57, 70, 0.4)"
            }}
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {isLoggingIn ? "Signing you in..." : "Continue with Google"}
          </button>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Secure Access</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <div className="mt-8 space-y-4">
             <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full p-1 bg-zinc-800">
                  <ShieldCheck className="w-3 h-3 text-zinc-400" />
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Enterprise-grade security powered by Firebase Authentication.
                </p>
             </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-500">
          By continuing, you agree to our{" "}
          <Link href="#" className="underline hover:text-zinc-300">Terms of Service</Link> and{" "}
          <Link href="#" className="underline hover:text-zinc-300">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
