import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Proxy temporariamente desabilitado para diagnóstico
export async function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
