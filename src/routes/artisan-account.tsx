import { createFileRoute } from "@tanstack/react-router";
import { AccountAccess } from "@/components/AccountAccess";

export const Route = createFileRoute("/artisan-account")({
  head: () => ({ meta: [{ title: "Artisan Access — CityTrust" }] }),
  component: () => <AccountAccess role="artisan" />,
});
