import { test, expect } from "@playwright/test";

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

test("global header/footer, service index and JSON-LD remain complete across routes", async ({ page }) => {
  for (const route of [
    "/", "/work", "/work/jufaja-homes", "/services",
    "/services/custom-software-business-systems", "/studio",
    "/about", "/contact", "/privacy",
  ]) {
    await page.goto(route);
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

    const structured = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
      nodes.flatMap((node) => {
        try {
          const value = JSON.parse(node.textContent || "{}");
          return Array.isArray(value["@graph"]) ? value["@graph"] : [value];
        } catch { return []; }
      }),
    );
    for (const breadcrumb of structured.filter((entry) => entry["@type"] === "BreadcrumbList")) {
      for (const item of breadcrumb.itemListElement || []) {
        expect(typeof item.name).toBe("string");
        expect(item.name.trim().length).toBeGreaterThan(0);
      }
    }
    if (route.startsWith("/services/")) {
      expect(structured.some((entry) => entry["@type"] === "FAQPage")).toBeTruthy();
    }
  }
});
