/**
 * Seed Supabase users with roles for testing.
 *
 * Usage:
 *   node scripts/seed-users.mjs
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL
 * in .env.local (or set as environment variables).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
const envPath = resolve(process.cwd(), ".env");
try {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const idx = line.indexOf("=");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (key && val && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
} catch {
  // .env.local not found — rely on env vars
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Edit this list to add/change test users ──────────────────
const USERS = [
  {
    email: "heinz@readymation.com",
    password: "schedulesimple2026!",
    role: "exec",
    property_ids: [],
    full_name: "Heinz",
  },
  {
    email: "pm@test.com",
    password: "password123",
    role: "pm",
    property_ids: ["sunset-apartments", "oak-ridge-towers"],
    full_name: "Test PM",
  },
  {
    email: "dm@test.com",
    password: "password123",
    role: "dm",
    property_ids: [],
    full_name: "Test DM",
  },
  {
    email: "exec@test.com",
    password: "password123",
    role: "exec",
    property_ids: [],
    full_name: "Test Executive",
  },
];
// ─────────────────────────────────────────────────────────────

async function seedUsers() {
  for (const user of USERS) {
    console.log(`\nSeeding ${user.email} (${user.role})...`);

    // Try to create user; if already exists, update instead
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name },
      app_metadata: { role: user.role, property_ids: user.property_ids },
    });

    if (error && error.message?.includes("already been registered")) {
      // User exists — list and update
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email === user.email);
      if (existing) {
        const { error: updateErr } =
          await supabase.auth.admin.updateUserById(existing.id, {
            password: user.password,
            user_metadata: { full_name: user.full_name },
            app_metadata: { role: user.role, property_ids: user.property_ids },
          });
        if (updateErr) {
          console.error(`  ✗ Update failed: ${updateErr.message}`);
        } else {
          console.log(`  ✓ Updated existing user`);
        }
      }
    } else if (error) {
      console.error(`  ✗ ${error.message}`);
    } else {
      console.log(`  ✓ Created (id: ${data.user.id})`);
    }
  }

  console.log("\nDone! Login credentials:");
  console.log("─".repeat(50));
  for (const u of USERS) {
    console.log(`  ${u.email} / ${u.password}  →  ${u.role}`);
  }
}

seedUsers().catch(console.error);
