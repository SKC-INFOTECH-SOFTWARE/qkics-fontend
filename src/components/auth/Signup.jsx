// src/components/auth/Signup.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { API_BASE_URL } from "../../config/api";
import { loginUser, fetchUserProfile } from "../../redux/slices/userSlice";
import { useAlert } from "../../context/AlertContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Button, Input } from "../ui";

function SignupModal({ onClose, openLogin }) {
  const dispatch = useDispatch();
  const { showAlert } = useAlert();

  const [username, setUsername] = useState("");
  const [usernameErr, setUsernameErr] = useState("");

  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");

  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState("");

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [loading, setLoading] = useState(false);

  // Email-OTP verification step: 1 = details, 2 = enter code
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");

  // USERNAME VALIDATION
  const handleUsernameChange = async (value) => {
    value = value.toLowerCase();
    setUsername(value);

    if (!/^[a-z0-9]+$/.test(value)) {
      setUsernameErr("Only letters & numbers allowed");
      return;
    }

    if (value.length < 3) {
      setUsernameErr("Username must be at least 3 chars");
      return;
    }

    setUsernameErr("");

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/check-username/`, {
        username: value,
      });

      if (!res.data.available) setUsernameErr("Username already taken");
    } catch {
      /* network hiccup — server-side validation still guards on submit */
    }
  };

  // EMAIL VALIDATION
  const handleEmailChange = async (value) => {
    value = value.toLowerCase();
    setEmail(value);
    setEmailErr("");

    if (!value) return;

    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setEmailErr("Invalid email");
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/check-email/`, {
        email: value,
      });

      if (!res.data.available) setEmailErr("Email already exists");
    } catch {
      /* network hiccup — server-side validation still guards on submit */
    }
  };

  // PHONE VALIDATION
  const handlePhoneChange = async (value) => {
    if (!/^[0-9]*$/.test(value)) return;

    setPhone(value);
    setPhoneErr("");

    if (value.length > 0 && value.length !== 10) {
      setPhoneErr("Phone must be 10 digits");
      return;
    }

    try {
      if (value.length === 10) {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/check-phone/`, {
          phone: value,
        });

        if (!res.data.available) setPhoneErr("Phone already exists");
      }
    } catch {
      /* network hiccup — server-side validation still guards on submit */
    }
  };

  // PASSWORD VALIDATION
  const validatePassword = (val) => {
    setPassword(val);
    if (val.length < 4) {
      setPasswordErr("Password must be at least 4 characters");
    } else {
      setPasswordErr("");
    }
  };

  // STEP 1 → validate details, then email an OTP and advance to step 2
  const sendOtp = async () => {
    if (!username || !password || !password2) {
      showAlert("Enter required fields", "warning");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      showAlert("Enter a valid email — we'll send a verification code", "warning");
      return;
    }
    if (password.length < 4) {
      showAlert("Password must be at least 4 characters", "warning");
      return;
    }
    if (password !== password2) {
      showAlert("Passwords do not match", "error");
      return;
    }
    if (usernameErr || emailErr || phoneErr) {
      showAlert("Fix validation errors", "warning");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/v1/auth/register/send-otp/`, { email });
      showAlert("Verification code sent to your email.", "success");
      setStep(2);
    } catch (err) {
      showAlert(
        err.response?.data?.email?.[0] ||
          err.response?.data?.error ||
          "Could not send code. Try again.",
        "error"
      );
    }
    setLoading(false);
  };

  // STEP 2 → verify the OTP, then create the account and log in
  const verifyAndCreate = async () => {
    if (!otp || otp.length < 4) {
      showAlert("Enter the code from your email", "warning");
      return;
    }

    setLoading(true);
    try {
      // 1) Verify the email OTP
      await axios.post(`${API_BASE_URL}/v1/auth/register/verify-otp/`, {
        email,
        code: otp,
      });

      // 2) Create the account (backend requires a verified email)
      await axios.post(`${API_BASE_URL}/v1/auth/register/`, {
        username,
        password,
        password2,
        email,
        phone,
        user_type: "normal",
      });

      // 3) Log in
      const result = await dispatch(loginUser({ username, password }));
      if (loginUser.rejected.match(result)) {
        showAlert("Signup succeeded but login failed", "error");
        setLoading(false);
        return;
      }
      await dispatch(fetchUserProfile());

      showAlert("Signup successful!", "success");
      onClose();
    } catch (err) {
      showAlert(
        err.response?.data?.error ||
          err.response?.data?.email ||
          err.response?.data?.message ||
          "Verification failed. Check the code and try again.",
        "error"
      );
    }
    setLoading(false);
  };

  // Primary button dispatches based on the current step
  const handleSignup = () => (step === 1 ? sendOtp() : verifyAndCreate());

  // Keep the keydown listener calling the latest handleSignup without
  // re-registering (avoids stacked listeners / stale-closure double submit).
  const handleSignupRef = useRef(handleSignup);
  useEffect(() => {
    handleSignupRef.current = handleSignup;
  });

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter") handleSignupRef.current();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="w-full max-w-sm p-6 rounded-2xl shadow-xl space-y-3 bg-card text-card-foreground border border-border">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Sign Up</h2>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {step === 1 && (
      <>
      {/* USERNAME */}
      <Input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => handleUsernameChange(e.target.value)}
        error={usernameErr}
      />

      {/* PASSWORD */}
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => validatePassword(e.target.value)}
          className="pr-10"
          error={passwordErr}
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

      {/* CONFIRM PASSWORD */}
      <div className="relative">
        <Input
          type={showPassword2 ? "text" : "password"}
          placeholder="Confirm Password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setShowPassword2(!showPassword2); }}
          className="absolute top-0 h-11 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label={showPassword2 ? "Hide password" : "Show password"}
        >
          {showPassword2 ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      {/* EMAIL */}
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => handleEmailChange(e.target.value)}
        error={emailErr}
        required
      />

      {/* PHONE */}
      <Input
        type="text"
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => handlePhoneChange(e.target.value)}
        error={phoneErr}
      />
      </>
      )}

      {step === 2 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Enter the code we sent to{" "}
            <span className="font-bold text-foreground">{email}</span>.
          </p>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
            className="tracking-[0.4em] text-center font-bold"
          />
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={loading}
              className="text-2xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              ← Edit details
            </button>
            <button
              type="button"
              onClick={sendOtp}
              disabled={loading}
              className="text-2xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        </div>
      )}

      <Button
        onClick={handleSignup}
        loading={loading}
        fullWidth
        size="lg"
        className="uppercase tracking-widest font-black"
      >
        {loading
          ? step === 1 ? "Sending..." : "Creating..."
          : step === 1 ? "Continue" : "Verify & Create Account"}
      </Button>

      <div className="pt-2 text-center">
        <button
          onClick={openLogin}
          className="text-2xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          Already have an account? <span className="text-primary">Login Here</span>
        </button>
      </div>
    </div>
  );
}

export default SignupModal;
