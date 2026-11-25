import { test, expect } from "@playwright/test";
import { servicePages } from "../../app/services/service-data.ts";

const expectedBudgets = [
  "$2,000\u2013$4,000", "$4,000\u2013$8,000",
  "$8,000\u2013$15,000", "$15,000+", "Not sure yet",
];
const expectedServices = [
  "Web Design Sydney", "E-commerce Website Development",
  "SEO & Local Visibility", "Branding & Website Content",
  "Digital Marketing", "Website Maintenance & Support",
  "Custom Software & Business Systems",
];

test("homepage and contact use identical budget choices and preselect canonical service slugs", async ({ page }) => {
  await page.goto("/");
  const homeOptions = await page.locator('form.enquiry-form input[name="budget"]').evaluateAll(
    (inputs) => inputs.map((input) => input.value),
  );
  expect(homeOptions).toEqual(expectedBudgets);

  await page.goto("/contact?service=custom-software-business-systems");
  const contactOptions = await page.locator('form.enquiry-form input[name="budget"]').evaluateAll(
    (inputs) => inputs.map((input) => input.value),
  );
  expect(contactOptions).toEqual(homeOptions);
  await expect(page.locator('form.enquiry-form input[name="service"]:checked')).toHaveValue("Custom software & business systems");
});

test("work index displays all 20 case-study cards, current Jufaja domain and technology badges", async ({ page }) => {
  await page.goto("/work");
  const cards = page.locator("article.gr-wi-card");
  await expect(cards).toHaveCount(20);
  await expect(cards.first().locator(".gr-browser-bar")).toContainText("jufajaconstructions.com.au");
  await expect(cards.first().locator(".live-label")).toContainText("Live website");
  for (const index of [16, 17, 18]) {
    const card = cards.nth(index);
    await expect(card.locator(".gr-wi-heading .gr-kicker")).not.toBeEmpty();
    await expect(card.locator(".gr-wi-stack-badge").first()).not.toBeEmpty();
    await expect(card.locator(".gr-wi-cta")).toContainText("View case study");
  }
});

test("mobile category pills stay on one horizontally scrollable row", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/work");
  const filters = page.locator(".work-index-filters");
  await expect(filters).toBeVisible();
  const result = await filters.evaluate((element) => ({
    wrap: getComputedStyle(element).flexWrap,
    client: element.clientWidth,
    scroll: element.scrollWidth,
    buttonWraps: [...element.querySelectorAll("button")].some((button) => getComputedStyle(button).whiteSpace !== "nowrap"),
  }));
  expect(result.wrap).toBe("nowrap");
  expect(result.scroll).toBeGreaterThan(result.client);
  expect(result.buttonWraps).toBeFalsy();
});

test("case-study pagination includes project 17 to 20 before wrapping", async ({ page }) => {
  for (const [slug, next] of [
    ["fresh-stop", "wild-pest-solutions"],
    ["wild-pest-solutions", "pept-up-labs"],
    ["pept-up-labs", "on-call-trailers"],
    ["on-call-trailers", "mrk-removals-adelaide"],
    ["mrk-removals-adelaide", "jufaja-homes"],
  ]) {
    await page.goto(`/work/${slug}`);
    await expect(page.locator("nav.gr-cs-next a.gr-cs-next-link")).toHaveAttribute("href", `/work/${next}`);
  }
});

test("public routes emit canonical links and complete navigation and structured data", async ({ page }) => {
  const origin = "https://www.abwebstudio.com.au";
  const organizationId = `${origin}/#organization`;
  const service = servicePages.find(({ slug }) => slug === "custom-software-business-systems");
  for (const [route, pageType, breadcrumbPaths] of [
    ["/", null, []],
    ["/work", "CollectionPage", ["", "/work"]],
    ["/work/jufaja-homes", "CreativeWork", ["", "/work", "/work/jufaja-homes"]],
    ["/services", "CollectionPage", ["", "/services"]],
    [`/services/${service.slug}`, "Service", ["", "/services", `/services/${service.slug}`]],
    ["/studio", "WebPage", []],
    ["/about", "AboutPage", ["", "/about"]],
    ["/contact", "ContactPage", ["", "/contact"]],
    ["/privacy", "WebPage", ["", "/privacy"]],
  ]) {
    await page.goto(route);
    const canonical = origin + (route === "/" ? "" : route);
    const canonicalLink = page.locator('link[rel="canonical"]');
    await expect(canonicalLink).toHaveCount(1);
    await expect(canonicalLink).toHaveAttribute("href", canonical);
    const header = page.locator("nav#primary-navigation");
    for (const href of ["/work", "/services", "/studio", "/#process", "/about", "/contact"]) {
      await expect(header.locator(`a[href="${href}"]`)).toHaveCount(1);
    }
    const footerServices = page.locator('footer nav[aria-label="Footer services"] a');
    await expect(footerServices).toHaveCount(7);
    expect(await footerServices.allTextContents()).toEqual(expectedServices);
    for (const label of ["WhatsApp", "LinkedIn", "GitHub", "Facebook", "Instagram"]) {
      await expect(page.locator("footer").getByRole("link", { name: new RegExp(label, "i") }).first()).toBeAttached();
    }

    const documents = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
      scripts.map((script) => JSON.parse(script.textContent)),
    );
    expect(documents.length, route).toBeGreaterThan(0);
    for (const document of documents) expect(document["@context"], route).toBe("https://schema.org");
    const entries = documents.flatMap((document) => document["@graph"] ?? [document]);
    const byType = (type) => entries.filter((entry) => [entry["@type"]].flat().includes(type));
    const organizations = byType("Organization");
    expect(organizations, route).toHaveLength(1);
    expect(organizations[0]).toMatchObject({ "@id": organizationId, url: origin, name: "AB Web Studio" });
    expect(byType("WebSite"), route).toEqual([expect.objectContaining({
      "@id": `${origin}/#website`, url: origin, publisher: { "@id": organizationId },
    })]);
    if (pageType) {
      expect(byType(pageType), route).toEqual([expect.objectContaining({ url: canonical })]);
    }

    const breadcrumbs = byType("BreadcrumbList");
    expect(breadcrumbs, route).toHaveLength(breadcrumbPaths.length ? 1 : 0);
    if (breadcrumbPaths.length) {
      expect(breadcrumbs[0].itemListElement, route).toEqual(breadcrumbPaths.map((path, index) =>
        expect.objectContaining({
          "@type": "ListItem", position: index + 1, name: expect.stringMatching(/\S/), item: origin + path,
        }),
      ));
    }
    const faq = byType("FAQPage");
    expect(faq, route).toHaveLength(pageType === "Service" ? 1 : 0);
    if (pageType === "Service") {
      expect(byType("Service")[0]).toMatchObject({ name: service.title, provider: { "@id": organizationId } });
      expect(service.faqs.length).toBeGreaterThan(0);
      expect(faq[0].mainEntity).toEqual(service.faqs.map(({ question, answer }) => ({
        "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer },
      })));
    }
  }
});
