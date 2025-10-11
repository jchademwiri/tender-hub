import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import { admin as adminPlugin } from "better-auth/plugins"

import { ac, admin, manager, user, owner } from '@/lib/permissions';

export const auth = betterAuth({
    emailAndPassword: {
    enabled: true,
   },
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
    }),
      plugins: [
         adminPlugin(
             {ac, roles: {owner, admin, user, manager}}
         ),
         // TODO: Add invitation plugin to enable invitation-only signups
         // invitation({
         //   invitationOnly: true, // Only allow signups via invitations
         //   // Configure email sending, expiration, etc.
         // })
     ]
});