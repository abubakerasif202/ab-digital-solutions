/** Static Sydney line illustration (Opera House sails, Harbour Bridge arch). Decorative-with-label. */
export function HarbourSkyline() {
  return (
    <section className="odp-harbour" aria-label="Sydney skyline illustration">
      <svg viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Line illustration of the Sydney Opera House sails and Harbour Bridge arch">
        <defs>
          <linearGradient id="odp-gold" x1="0" x2="1">
            <stop offset="0" stopColor="#E0BE7E" />
            <stop offset="1" stopColor="#B69558" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="#403A3B" strokeWidth="1">
          <path d="M0 250h1440M60 250v-30h40v30M140 250v-60h30v60M200 250v-45h50v45M1180 250v-70h36v70M1250 250v-40h44v40M1330 250v-85h28v85" />
        </g>
        <g fill="none" stroke="url(#odp-gold)" strokeWidth="1.5">
          <path d="M720 250C800 90 960 60 1100 110M720 250C800 130 930 100 1100 110M1100 110V250M860 250V150M960 250V120M1030 250V108M770 250V190" />
          <path d="M700 250H1440" />
        </g>
        <g fill="none" stroke="#C8A86B" strokeWidth="1.5">
          <path d="M180 250C200 160 280 120 330 130C340 170 300 230 280 250Z" />
          <path d="M280 250C300 170 380 120 440 140C440 180 410 230 390 250Z" />
          <path d="M390 250C410 190 470 160 520 175C515 205 495 230 480 250Z" />
          <path d="M120 250C140 205 190 190 230 200C225 225 210 240 200 250Z" />
          <path d="M80 250H540" />
        </g>
        <path d="M0 250H1440V320H0Z" fill="#0A0A0D" />
        <g stroke="#A04661" strokeWidth="1" opacity=".7">
          <path d="M120 270h420M180 285h300M760 270h520M860 285h340" />
        </g>
      </svg>
    </section>
  );
}
