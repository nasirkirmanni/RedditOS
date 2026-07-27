import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAccountById } from "@/lib/repos/accounts";
import { trackAccount, trackAllAccounts } from "@/lib/services/tracker";

export const maxDuration = 300;

/** Run the karma tracker: ?accountId=N for one account, otherwise all. */
export async function POST(req: Request) {
  const accountId = new URL(req.url).searchParams.get("accountId");

  let results;
  if (accountId) {
    const account = await getAccountById(Number(accountId));
    if (!account) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    results = [await trackAccount(account)];
  } else {
    results = await trackAllAccounts();
  }

  revalidatePath("/");
  revalidatePath("/accounts");
  return NextResponse.json(results);
}
