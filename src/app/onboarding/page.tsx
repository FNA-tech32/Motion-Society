import { redirect } from "next/navigation";

// Motion Society is single-user and already knows Matthew — there is no onboarding.
// Anything that used to live here (editing the profile, connecting the AI) is in Settings.
export default function OnboardingRedirect() {
  redirect("/settings");
}
