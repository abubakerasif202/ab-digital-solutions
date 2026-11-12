import Link from "next/link";

export type Crumb = { label: string; href?: string };

/** Mono breadcrumb trail. The last crumb is the current page. */
export function Crumbs({ items }: { items: readonly Crumb[] }) {
  return (
    <nav className="ip-crumbs" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span className="ip-crumb" key={`${item.label}-${index}`}>
            {index > 0 ? <span className="ip-crumb-sep" aria-hidden="true">/</span> : null}
            {item.href && !last ? <Link href={item.href}>{item.label}</Link> : <span aria-current={last ? "page" : undefined}>{item.label}</span>}
          </span>
        );
      })}
    </nav>
  );
}
