import { CONTACT } from "@/lib/contact";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-line bg-surface/70">
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-5 py-8 md:grid-cols-[1.2fr_1fr_1fr] md:px-8">
        <div>
          <p className="display text-2xl">Motion Society</p>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Tennis-first training and fuel, tuned to how you feel each day.
          </p>
        </div>
        <div>
          <p className="kicker">Studio</p>
          <p className="mt-2 text-sm leading-relaxed">{CONTACT.address}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="kicker">Contact</p>
          <p>
            <a className="font-bold hover:text-strawberry" href={`tel:${CONTACT.phoneTel}`}>
              {CONTACT.phoneDisplay}
            </a>
          </p>
          <p>
            <span className="text-muted">Alternative phone </span>
            <a className="font-bold hover:text-strawberry" href={`tel:${CONTACT.altPhoneTel}`}>
              {CONTACT.altPhoneDisplay}
            </a>
          </p>
          <p>
            <a className="font-bold hover:text-strawberry" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
          </p>
          <p>
            <span className="text-muted">Alternative email </span>
            <a className="font-bold hover:text-strawberry" href={`mailto:${CONTACT.altEmail}`}>
              {CONTACT.altEmail}
            </a>
          </p>
        </div>
      </div>
      <p className="border-t border-line px-5 py-4 text-center text-xs text-muted md:px-8">
        © {new Date().getFullYear()} Motion Society
      </p>
    </footer>
  );
}
