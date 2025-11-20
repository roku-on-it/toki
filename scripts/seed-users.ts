import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { users } from "@/lib/db/schema";

const DATABASE_URL = "file:./drizzle/toki.db";
const client = createClient({ url: DATABASE_URL });
const db = drizzle(client);

const seedUsers = [
  {
    displayName: "Ozzy",
    secretKey: "cff66e221b7cba97e6283c6fb2b0cbd6",
    avatarBase64:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJyBoZWlnaHQ9JzEwMCcgdmlld0JveD0nMCAwIDEwMCAxMDAnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PHJlY3Qgd2lkdGg9JzEwMCcgaGVpZ2h0PScxMDAnIGZpbGw9JyMyMDIwMjAnIHJ4PScyMCcvPjxyZWN0IHg9JzE1JyB5PScxMCcgd2lkdGg9JzIwJyBoZWlnaHQ9JzYwJyByeD0nMTAnIGZpbGw9JyM0NDQ0NDQnLz48cmVjdCB4PSc2NScgeT0nMTAnIHdpZHRoPScyMCcgaGVpZ2h0PSc2MCcgcng9JzEwJyBmaWxsPScjNTU1NTU1Jy8+PGNpcmNsZSBjeD0nMzgnIGN5PSc2NCcgcj0nOCcgZmlsbD0nI2ZmZicvPjxjaXJjbGUgY3g9Jzc0JyBjZT0nNjQnIHI9JzgnIGZpbGw9JyNmZmYnLz48cGF0aCBkPSdNMzUgNzVoMzAnIHN0cm9rZT0nI2ZmZicgc3Ryb2tlLXdpZHRoPSc1JyBzdHJva2UtbGluZWNhcD0ncm91bmQnIGZpbGw9J25vbmUnLz48L3N2Zz4=",
  },
  {
    displayName: "Ryujin",
    secretKey: "ba86228549cd0dfe433a10efc39b1dad",
    avatarBase64:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJyBoZWlnaHQ9JzEwMCcgdmlld0JveD0nMCAwIDEwMCAxMDAnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PHJlY3Qgd2lkdGg9JzEwMCcgaGVpZ2h0PScxMDAnIGZpbGw9JyNmZWZkZjQnIHJ4PScyMCcvPjxyZWN0IHg9JzE0JyB5PScxMCcgd2lkdGg9JzI0JyBoZWlnaHQ9JzYyJyByeD0nMTInIGZpbGw9JyNmYWQ4OTYnLz48cmVjdCB4PSc2MCcgeT0nMTAnIHdpZHRoPScyNCcgaGVpZ2h0PSc2MicsIHJ4PScxMicgZmlsbD0nI2Y5Y2I5OCcvPjxjaXJjbGUgY3g9JzQwJyBjZT0nNjcnIHI9JzknIGZpbGw9JyNmZmYnLz48Y2lyY2xlIGN4PSc3MCcgY3k9JzY3JyByPSc5JyBmaWxsPScjZmZmJy8+PHBhdGggZD0nTTM3IDgyaDI2JyBzdHJva2U9JyNmMjkwYzYnIHN0cm9rZS13aWR0aD0nNCcgc3Ryb2tlLWxpbmVjYXA9J3JvdW5kJyBmaWxsPSdub25lJy8+PC9zdmc+",
  },
];

async function main() {
  for (const user of seedUsers) {
    await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.secretKey,
        set: {
          displayName: user.displayName,
          avatarBase64: user.avatarBase64,
        },
      });
  }
  console.log("Seeded", seedUsers.length, "users");
}

main()
  .catch((error) => {
    console.error("Failed to seed users", error);
    process.exit(1);
  })
  .finally(async () => {
    await client.close();
  });
