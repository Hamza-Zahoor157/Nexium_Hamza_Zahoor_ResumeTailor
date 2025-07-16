import { withAuth } from "next-auth/middleware";

export default withAuth({
  // Optionally, you can add custom callbacks or config here
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};