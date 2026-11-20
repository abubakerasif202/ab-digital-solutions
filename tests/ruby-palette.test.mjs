import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function token(stylesheet, name) {
  const result = stylesheet.match(new RegExp(`--${name}:\\s*(#[\\da-f]{6});`, "i"));
  assert.ok(result, `Missing six-digit color token --${name}`);
  return result[1];
}

function luminance(hex) {
  return [1, 3, 5].map((offset) => {
    const srgb = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, channel, i) => sum + channel * [0.2126, 0.7152, 0.0722][i], 0);
}

function contrast(a, b) {
  const [bright, dark] = [luminance(a), luminance(b)].sort((left, right) => right - left);
  return (bright + 0.05) / (dark + 0.05);
}

test("ruby text and focus colors meet WCAG contrast on their actual surfaces", async (context) => {
  const [palette, cinematic, kinetic] = await Promise.all([
    read("app/styles/ruby-palette.css"),
    read("app/styles/ruby-shared.css"),
    read("app/styles/ruby-kinetic.css"),
  ]);
  const color = (name) => token(palette, name);
  const page = token(cinematic, "cinema-ink");
  const cream = kinetic.match(/\.ruby-services\s*\{[^}]*\bbackground:\s*(#[\da-f]{6});/i)?.[1];
  assert.ok(cream, "Missing cream services background");
  assert.match(kinetic, /\.ruby-contact \.contact-form\.enquiry-form :is\(input, textarea\):focus-visible\s*\{\s*outline: 2px solid var\(--ruby-text-dark\)/);
  const pairs = [
    ["white on primary", color("ruby-on"), color("ruby"), 4.5],
    ["white on hover", color("ruby-on"), color("ruby-hover"), 4.5],
    ["white on pressed", color("ruby-on"), color("ruby-deep"), 4.5],
    ["ruby text on dark", color("ruby-text-dark"), page, 4.5],
    ["ruby text on paper", color("ruby-text-paper"), cream, 4.5],
    ["focus on dark", color("ruby-text-dark"), page, 3],
    ["focus on dark form input", color("ruby-text-dark"), "#2b2420", 3],
    ["focus on paper", color("ruby-text-paper"), cream, 3],
    ["focus on the closing band", color("ruby-on"), color("ruby"), 3],
  ];
  for (const [label, foreground, background, minimum] of pairs) {
    const ratio = contrast(foreground, background);
    context.diagnostic(`${label}: ${ratio.toFixed(2)}:1`);
    assert.ok(ratio >= minimum, `${label} is below ${minimum}:1`);
  }
});
