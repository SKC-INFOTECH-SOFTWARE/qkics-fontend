// src/components/auth/ForgotPassword.jsx
//
// Two-step forgot-password flow using an emailed OTP:
//   Step 1 — enter email → POST /password/forgot/ (server always replies
//            generically to avoid leaking which emails exist).
//   Step 2 — enter the 6-digit code + a new password → POST /password/reset/.
import { useState } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { API_BASE_URL } from "../../config/api";
import { useAlert } from "../../context/AlertContext";
import { Button, Input } from "../ui";

function ForgotPasswordModal({ onClose, openLogin }) {
  const { showAlert } = useAlert();

  const [step, setStep] = useState(1); // 1 = email, 2 = code + new password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailValid = /^\S+@\S+\.\S+$/.test(email);

  // STEP 1 — request the reset code
  const sendCode = async () => {
    if (!emailValid) {
      showAlert("Enter a valid email", "warning");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/v1/auth/password/forgot/`, { email });
      showAlert("If that email is registered, a code has been sent.", "success");
      setStep(2);
    } catch {
      // The endpoint is generic; a failure here is a network/server error.
      showAlert("Could not send the code. Try again.", "error");
    }
    setLoading(false);
  };

  // STEP 2 — verify code + set the new password
  const resetPassword = async () => {
    if (!code || code.length < 4) {
      showAlert("Enter the code from your email", "warning");
      return;
    }
    if (newPassword.length < 4) {
      showAlert("Password must be at least 4 characters", "warning");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/v1/auth/password/reset/`, {
        email,
        code,
        new_password: newPassword,
      });
      showAlert("Password reset! You can log in now.", "success");
      openLogin ? openLogin() : onClose();
    } catch (err) {
      showAlert(
        err.response?.data?.error ||
          err.response?.data?.new_password?.[0] ||
          "Reset failed. Check the code and try again.",
        "error"
      );
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm p-6 rounded-2xl shadow-xl space-y-3 bg-card text-card-foreground border border-border">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-black uppercase tracking-tighter">
          {step === 1 ? "Reset Password" : "Enter Code"}
        </h2>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {step === 1 ? (
        <>
          <p className="text-sm text-muted-foreground">
            Enter your account email and we'll send you a verification code.
          </p>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
          />
          <Button
            onClick={sendCode}
            loading={loading}
            fullWidth
            size="lg"
            className="uppercase tracking-widest font-black"
          >
            {loading ? "Sending..." : "Send Code"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            We sent a code to <span className="font-bold text-foreground">{email}</span>.
            Enter it below with your new password.
          </p>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
            className="tracking-[0.4em] text-center font-bold"
          />
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
              className="absolute top-0 h-11 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <Button
            onClick={resetPassword}
            loading={loading}
            fullWidth
            size="lg"
            className="uppercase tracking-widest font-black"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
          <button
            onClick={sendCode}
            disabled={loading}
            className="w-full text-2xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            Didn't get it? Resend code
          </button>
        </>
      )}

      <div className="pt-2 text-center">
        <button
          onClick={openLogin}
          className="text-2xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to <span className="text-primary">Login</span>
        </button>
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
