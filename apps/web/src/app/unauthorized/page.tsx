import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div>
      <h1>Unauthorized</h1>
      <p>You are not authorized to view this page.</p>
      <Link href="/auth/sign-in">Sign In</Link>
    </div>
  );
}
