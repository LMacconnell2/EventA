import {
  type FormEvent,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { authClient } from "@/auth/auth-client";
import "../styles/AuthPage.css";

type LoginForm = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const initialForm: LoginForm = {
  email: "",
  password: "",
  rememberMe: true,
};

export function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({
    from: "/auth-layout/login",
});

  const [form, setForm] = useState<LoginForm>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof LoginForm>(
    field: K,
    value: LoginForm[K],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const { error } = await authClient.signIn.email({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        rememberMe: form.rememberMe,
      });

      if (error) {
        setErrorMessage(
          error.message ?? "Invalid email or password.",
        );
        return;
      }

      await navigate({
        to: "/profile",
        replace: true,
      });
    } catch (error) {
      console.error("Login failed:", error);

      setErrorMessage(
        "Something went wrong while logging you in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-heading">
          <Link to="/" className="auth-brand">
            EventPlannerPro
          </Link>

          <h1>Welcome back</h1>

          <p>
            Log in to manage your events and ticketing
            operations.
          </p>
        </div>

        {search.registered && (
          <div
            className="auth-alert auth-alert-success"
            role="status"
          >
            Your account was created successfully. You can now
            log in.
          </div>
        )}

        {errorMessage && (
          <div
            className="auth-alert auth-alert-error"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">
              Email address
            </label>

            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                updateField("email", event.target.value)
              }
              disabled={isSubmitting}
              required
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">
              Password
            </label>

            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) =>
                updateField("password", event.target.value)
              }
              disabled={isSubmitting}
              required
            />
          </div>

          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={form.rememberMe}
              onChange={(event) =>
                updateField(
                  "rememberMe",
                  event.target.checked,
                )
              }
              disabled={isSubmitting}
            />

            <span>Keep me logged in</span>
          </label>

          <button
            className="auth-submit-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-footer">
          Do not have an account?{" "}
          <Link to="/signup">Create one</Link>
        </p>
      </section>
    </main>
  );
}