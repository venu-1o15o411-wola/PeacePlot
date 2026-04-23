import { useState } from "react";

export function useSignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  return {
    email,
    setEmail,
    password,
    setPassword,
    secure,
    toggleSecure: () => setSecure((s) => !s),
    submitting,
    setSubmitting,
  };
}
