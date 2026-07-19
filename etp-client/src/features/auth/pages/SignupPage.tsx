import {
  type FormEvent,
  useState,
} from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/auth/auth-client";
import "../styles/AuthPage.css";

type SignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialForm: SignupForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<SignupForm>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(
    field: keyof SignupForm,
    value: string,
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

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim().toLowerCase();

    if (!firstName || !lastName || !email) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (form.password.length < 8) {
      setErrorMessage(
        "Your password must be at least 8 characters long.",
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await authClient.signUp.email({
        name: `${firstName} ${lastName}`,
        email,
        password: form.password,
      });

      if (error) {
        setErrorMessage(
          error.message ?? "Unable to create your account.",
        );
        return;
      }

      await navigate({
        to: "/login",
        search: {
          registered: true,
        },
      });
    } catch (error) {
      console.error("Signup failed:", error);

      setErrorMessage(
        "Something went wrong while creating your account.",
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

          <h1>Create your account</h1>

          <p>
            Create an account to manage events, tickets, venues,
            and attendees.
          </p>
        </div>

        {errorMessage && (
          <div
            className="auth-alert auth-alert-error"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field-row">
            <div className="auth-field">
              <label htmlFor="signup-first-name">
                First name
              </label>

              <input
                id="signup-first-name"
                name="firstName"
                type="text"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-last-name">
                Last name
              </label>

              <input
                id="signup-last-name"
                name="lastName"
                type="text"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">
              Email address
            </label>

            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                updateField("email", event.target.value)
              }
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">
              Password
            </label>

            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) =>
                updateField("password", event.target.value)
              }
              disabled={isSubmitting}
              minLength={8}
              required
            />

            <span className="auth-field-hint">
              Use at least 8 characters.
            </span>
          </div>

          <div className="auth-field">
            <label htmlFor="signup-confirm-password">
              Confirm password
            </label>

            <input
              id="signup-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(event) =>
                updateField(
                  "confirmPassword",
                  event.target.value,
                )
              }
              disabled={isSubmitting}
              minLength={8}
              required
            />
          </div>

          <button
            className="auth-submit-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Creating account..."
              : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}