import Link from "next/link";
import Image from "next/image";
import { assetBase } from "./site-config";

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="not-found-grid" aria-hidden="true" />
      <div className="not-found-content">
        <Image
          src={`${assetBase}/ab-logo-lockup.png`}
          alt="AB Digital Solutions"
          width={1020}
          height={500}
          sizes="190px"
        />
        <p className="eyebrow">404 / Page not found</p>
        <h1>This page has moved off the map.</h1>
        <p>The address may be outdated, but the studio is right where you left it.</p>
        <Link className="button button-primary" href="/">Return home <span aria-hidden="true">↗</span></Link>
      </div>
    </main>
  );
}
