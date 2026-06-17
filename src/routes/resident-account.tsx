import { createFileRoute } from "@tanstack/react-router";
import { AccountAccess } from "@/components/AccountAccess";

export const Route = createFileRoute("/resident-account")({
  head: () => ({ meta: [{ title: "Resident Access — CityTrust" }] }),
  component: () => <AccountAccess role="resident" />,
});
