import type { Product } from "./types";

/**
 * The sample catalogue for Ruby Debby Fashion Home.
 *
 * The shop works before you connect a database: if the Supabase environment
 * variables are missing, products are read from here instead. Once Supabase is
 * set up, these are ignored and the `products` table is used.
 *
 * The ids are deliberately not real UUIDs, so a cart built in demo mode can
 * never be written into a real database by accident.
 *
 * Replace the pictures with your own photos in Supabase Storage later.
 */
export const demoProducts: Product[] = [
  {
    id: "demo-1",
    slug: "adire-wrap-dress",
    name: "Adire Wrap Dress",
    description:
      "Hand-dyed adire cotton in a flattering wrap cut. Ties at the waist, falls just below the knee.",
    category: "Dresses",
    priceCents: 4500000,
    imageUrl: "https://picsum.photos/seed/adire-wrap-dress/900/900",
    stock: 14,
  },
  {
    id: "demo-2",
    slug: "ankara-midi-dress",
    name: "Ankara Print Midi Dress",
    description:
      "Bold ankara print with a fitted bodice and a full midi skirt. Lined, with hidden pockets.",
    category: "Dresses",
    priceCents: 3200000,
    imageUrl: "https://picsum.photos/seed/ankara-midi-dress/900/900",
    stock: 20,
  },
  {
    id: "demo-3",
    slug: "leather-tote",
    name: "Structured Leather Tote",
    description:
      "Full-grain leather that softens with use. Fits a 14 inch laptop, with a zip pocket inside.",
    category: "Bags",
    priceCents: 5800000,
    imageUrl: "https://picsum.photos/seed/leather-tote-bag/900/900",
    stock: 9,
  },
  {
    id: "demo-4",
    slug: "block-heel-sandals",
    name: "Block Heel Sandals",
    description:
      "A 6cm block heel you can actually walk in. Cushioned insole, adjustable ankle strap.",
    category: "Shoes",
    priceCents: 2800000,
    imageUrl: "https://picsum.photos/seed/block-heel-sandals/900/900",
    stock: 18,
  },
  {
    id: "demo-5",
    slug: "silk-head-wrap",
    name: "Silk Head Wrap",
    description:
      "Long enough for a tall wrap, soft enough to sleep in. Hand-rolled hem.",
    category: "Accessories",
    priceCents: 950000,
    imageUrl: "https://picsum.photos/seed/silk-head-wrap/900/900",
    stock: 40,
  },
  {
    id: "demo-6",
    slug: "gold-statement-earrings",
    name: "Gold Statement Earrings",
    description:
      "Lightweight gold-plated brass. Big enough to finish an outfit, light enough for all day.",
    category: "Accessories",
    priceCents: 1400000,
    imageUrl: "https://picsum.photos/seed/gold-earrings/900/900",
    stock: 35,
  },
  {
    id: "demo-7",
    slug: "linen-blazer",
    name: "Tailored Linen Blazer",
    description:
      "A relaxed single-breasted blazer in breathable linen. Half-lined, so it stays cool.",
    category: "Outerwear",
    priceCents: 6500000,
    imageUrl: "https://picsum.photos/seed/linen-blazer/900/900",
    stock: 7,
  },
  {
    id: "demo-8",
    slug: "cashmere-scarf",
    name: "Cashmere-Blend Scarf",
    description:
      "Warm without the bulk. A generous 200cm, so it doubles as a wrap on cool evenings.",
    category: "Accessories",
    priceCents: 1800000,
    imageUrl: "https://picsum.photos/seed/cashmere-scarf/900/900",
    stock: 26,
  },
];

export function findDemoProduct(id: string): Product | undefined {
  return demoProducts.find((product) => product.id === id);
}

export function findDemoProductBySlug(slug: string): Product | undefined {
  return demoProducts.find((product) => product.slug === slug);
}

/** The category list used by the homepage filter. */
export const demoCategories: string[] = [
  ...new Set(
    demoProducts
      .map((product) => product.category)
      .filter((category): category is string => Boolean(category)),
  ),
];