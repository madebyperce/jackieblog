import NextAuth from "next-auth";
import authOptions from "@/lib/auth";

async function handler(req: Request) {
  return NextAuth(authOptions)(req);
}

export { handler as GET, handler as POST }; 