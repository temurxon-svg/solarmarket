import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intl = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const response = intl(request);
  const { user } = await updateSession(request, response);
  const path = request.nextUrl.pathname.replace(/^\/(uz|ru|en)/, "");
  if (!user && (path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/account"))) {
    const locale = request.nextUrl.pathname.split("/")[1] || "uz";
    return Response.redirect(new URL(`/${locale}/login?next=${path}`, request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|auth|_next|.*\\..*).*)"],
};
