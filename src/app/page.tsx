import { redirect } from "next/navigation";

/* Landing (the Ìwé Ìpè) comes in a later phase; the hall is built first. */
export default function Home() {
  redirect("/hall");
}
