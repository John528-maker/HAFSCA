import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n";
import { isCourseLocale } from "@/lib/locales";

export default async function RootPage() {
  const jar = await cookies();
  const stored = jar.get(LOCALE_STORAGE_KEY)?.value;
  if (stored && isCourseLocale(stored)) {
    redirect(`/${stored}`);
  }

  const accept = (await headers()).get("accept-language") ?? "";
  const first = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  const preferKo = first.startsWith("ko");
  redirect(preferKo ? "/ko" : "/en");
}
