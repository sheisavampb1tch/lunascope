import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/wallet/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}
