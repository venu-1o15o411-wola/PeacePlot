import { useState } from "react";

export function useSignUpForm() {
  const [userid, setUserid] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  return {
    userid,
    setUserid,
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
