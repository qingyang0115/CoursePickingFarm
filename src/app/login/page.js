"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import Navbar from "../Navbar";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      router.push("/courses");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login">
      <Navbar />
      <h1>{mode === "register" ? "Create Account" : "Log In"}</h1>
      <form onSubmit={handleSubmit}>
        <label>Email:</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password:</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p>{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Please wait..."
            : mode === "register"
              ? "Create Account"
              : "Log In"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "register" ? "login" : "register")}
      >
        {mode === "register"
          ? "Already have an account? Log in"
          : "Need an account? Register"}
      </button>
    </div>
  );
};

export default Login;
