import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/sign-in",
    afterSignIn: "/",
    afterSignUp: "/",
    afterSignOut: "/sign-in",
  },
});
