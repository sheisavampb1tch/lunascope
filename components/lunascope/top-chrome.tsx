import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "./icons";

type TickerItem = {
  id: string;
  label: string;
  edgeLabel?: string;
  positive?: boolean;
};

export function TopChrome({
  links,
  rightSlot,
  tickerItems,
}: {
  links: Array<{ label: string; href: string }>;
  rightSlot?: ReactNode;
  tickerItems?: TickerItem[];
}) {
  const items = tickerItems && tickerItems.length > 0 ? [...tickerItems, ...tickerItems] : [];

  return (
    <>
      <nav className="luna-nav">
        <Link href="/" className="luna-nav-logo">
          <span className="luna-nav-mark">
            <LogoMark className="h-6 w-6" />
          </span>
          lunascope
        </Link>

        <div className="luna-nav-links">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="luna-nav-link">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {rightSlot}
        </div>
      </nav>

      <div className="luna-ticker">
        <div className="luna-ticker-track">
          {items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="luna-ticker-item">
              {item.edgeLabel ? (
                <span
                  className={`data-number font-semibold ${item.positive === false ? "text-rose-400" : "text-[#7EB8FF]"}`}
                >
                  {item.edgeLabel}
                </span>
              ) : null}
              <span>{item.label}</span>
              <span className="text-white/20">·</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
