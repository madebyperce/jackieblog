import NextAuth from "next-auth";
import authOptions from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Workaround for handling preflight requests
export async function OPTIONS() {
  return new Response(null, { status: 200 });
} 