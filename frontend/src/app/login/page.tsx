"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function LoginPage() {
    const { user, loading, loginWithGoogle } = useAuth();
    const router = useRouter();
    const [signingIn, setSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-redirect if already logged in
    useEffect(() => {
        if (!loading && user) {
            router.replace("/dashboard");
        }
    }, [user, loading, router]);

    const handleGoogleLogin = async () => {
        setSigningIn(true);
        setError(null);
        try {
            await loginWithGoogle();
            // onAuthStateChanged in AuthContext will update `user`,
            // then the useEffect above will redirect to /dashboard
        } catch (err: any) {
            console.error("Login error:", err);
            setError("Sign-in failed. Please try again.");
            setSigningIn(false);
        }
    };

    // While Firebase is checking auth state, show loader
    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: "var(--background)" }}
            >
                <Loader2
                    size={32}
                    className="animate-spin"
                    style={{ color: "var(--accent)" }}
                />
            </div>
        );
    }

    // If already logged in, show nothing (useEffect will redirect)
    if (user) return null;

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: "var(--background)" }}
        >
            {/* Decorative gradient blob */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full opacity-15 blur-3xl pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse, #e63946 0%, transparent 70%)",
                }}
            />

            <div
                className="relative w-full max-w-md rounded-2xl p-8 text-center"
                style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    boxShadow:
                        "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
                }}
            >
                {/* Logo / Branding */}
                <div className="flex items-center justify-center gap-2.5 mb-2">
                    <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-base text-white"
                        style={{ background: "var(--accent)" }}
                    >
                        F
                    </div>
                    <span className="font-bold text-lg tracking-tight">
                        FinRisk
                    </span>
                </div>

                <p
                    className="text-sm mb-8"
                    style={{ color: "var(--muted-foreground)" }}
                >
                    Sign in to access your security dashboard
                </p>

                {/* Error message */}
                {error && (
                    <div
                        className="rounded-lg px-4 py-2.5 mb-5 text-sm font-medium"
                        style={{
                            background: "rgba(230,57,70,0.1)",
                            border: "1px solid rgba(230,57,70,0.25)",
                            color: "var(--accent)",
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Google Sign-In Button */}
                <button
                    id="google-signin-btn"
                    onClick={handleGoogleLogin}
                    disabled={signingIn}
                    className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                        background: signingIn
                            ? "var(--surface2)"
                            : "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                        cursor: signingIn ? "not-allowed" : "pointer",
                        opacity: signingIn ? 0.6 : 1,
                    }}
                >
                    {signingIn ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                    )}
                    {signingIn ? "Signing in…" : "Continue with Google"}
                </button>

                {/* Security badge */}
                <div
                    className="flex items-center justify-center gap-1.5 mt-6 text-xs"
                    style={{ color: "var(--muted)" }}
                >
                    <ShieldCheck size={12} />
                    Secured with Firebase Authentication
                </div>

                {/* Back to home link */}
                <a
                    href="/"
                    className="inline-block mt-4 text-xs transition-colors hover:text-white"
                    style={{ color: "var(--muted-foreground)" }}
                >
                    ← Back to home
                </a>
            </div>
        </div>
    );
}
