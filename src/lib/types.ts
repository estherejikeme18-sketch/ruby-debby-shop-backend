/**
 * Shared types for Ruby Debby Fashion Home.
 *
 * Money is always an integer number of cents - see src/lib/money.ts.
 */

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  /** e.g. "Dresses", "Bags", "Shoes", "Accessories" */
  category: string | null;
  priceCents: number;
  imageUrl: string | null;
  stock: number;
};

/** A product plus how many of it the customer wants. */
export type CartLine = Product & {
  quantity: number;
};

export type CartSummary = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  /**
   * Null means "we do not know yet" - the customer has not chosen a delivery
   * state, so the fee cannot be worked out. It is always a real number by the
   * time an order is placed.
   */
  shippingCents: number | null;
  totalCents: number;
};

export type CustomerDetails = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  /** One of Nigeria's 36 states or the FCT, chosen from the dropdown. */
  state: string;
  postcode: string;
  country: string;
  notes: string;
};

export type OrderItemRecord = {
  productId: string | null;
  productName: string;
  unitPriceCents: number;
  quantity: number;
};

export type OrderRecord = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: string;
  city: string;
  /** The Nigerian state the order is being delivered to. */
  shippingState: string | null;
  postcode: string;
  country: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  status: string;
  createdAt: string;
  items: OrderItemRecord[];
  /** True when the order was not written to the database (demo mode). */
  isDemo: boolean;
};

export type CheckoutState = {
  ok: boolean;
  message: string;
  /** Field-level errors, keyed by the form field name. */
  errors: Record<string, string>;
  /** What the customer typed, so the form can be refilled after an error. */
  values: Partial<CustomerDetails>;
};