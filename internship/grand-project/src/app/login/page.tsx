import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <button onClick={() => signIn()}>Sign in with Email</button>
  );
}