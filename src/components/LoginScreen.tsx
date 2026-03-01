import { FormEvent, useState } from "react";
import { supabase } from "../core/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email.");
      return;
    }
    setIsSubmitting(true);
    try {
      const redirectTo =
        import.meta.env.VITE_SITE_URL?.trim() || window.location.origin;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: redirectTo
        }
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      setStatus("Check your email for a magic sign-in link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send magic link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>CodeTrainer</h1>
          <p>Sign in to continue.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <h2>Login</h2>
        <form onSubmit={handleSubmit} className="grid">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send magic link"}
          </button>
        </form>
        {status && <p style={{ color: "#2563eb", fontWeight: 600 }}>{status}</p>}
        {error && <p style={{ color: "#991b1b", fontWeight: 600 }}>{error}</p>}
      </div>
    </div>
  );
}
