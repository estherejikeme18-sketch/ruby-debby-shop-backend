import { isValidState, NIGERIA_STATES } from "./nigeria";
import type { CustomerDetails } from "./types";

/** Deliberately simple: "something@something.something". */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Digits, spaces, dashes, brackets and an optional leading +. */
const PHONE_PATTERN = /^\+?[\d\s\-()]{7,20}$/;

/**
 * Ruby Debby Fashion Home is based in Abuja, so the country and the delivery
 * state are pre-filled in the checkout form.
 */
export const DEFAULT_COUNTRY = "Nigeria";
export { NIGERIA_STATES };

export const emptyCheckoutValues: CustomerDetails = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postcode: "",
  country: "",
  notes: "",
};

/**
 * NEVER trust the browser. A form can be edited, JavaScript can be switched
 * off, and a request can be sent by hand. The server validates everything
 * again before an order is created.
 */
export function validateCheckout(input: Partial<CustomerDetails>): {
  ok: boolean;
  errors: Record<string, string>;
  values: CustomerDetails;
  email: string;
} {
  const values: CustomerDetails = {
    fullName: String(input.fullName ?? "").trim(),
    email: String(input.email ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    address: String(input.address ?? "").trim(),
    city: String(input.city ?? "").trim(),
    state: String(input.state ?? "").trim(),
    postcode: String(input.postcode ?? "").trim(),
    country: String(input.country ?? "").trim(),
    notes: String(input.notes ?? "").trim(),
  };

  const errors: Record<string, string> = {};

  if (values.fullName.length < 2) {
    errors.fullName = "Please enter your full name.";
  } else if (values.fullName.length > 120) {
    errors.fullName = "That name is too long.";
  }

  if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = "Please enter a valid email, for example you@example.com.";
  } else if (values.email.length > 254) {
    errors.email = "That email address is too long.";
  }

  // Phone is optional, but if it is filled in it must look like a phone number.
  if (values.phone.length > 0 && !PHONE_PATTERN.test(values.phone)) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (values.address.length < 5) {
    errors.address = "Please enter your street address.";
  }

  if (values.city.length < 2) {
    errors.city = "Please enter your town or city.";
  }

  /**
   * The state decides the delivery fee, so it must be one we can deliver to.
   * Checking it against the real list stops anyone posting a made-up state to
   * get a cheaper fee.
   */
  if (!isValidState(values.state)) {
    errors.state = "Please choose your state from the list.";
  }

  if (values.postcode.length < 3) {
    errors.postcode = "Please enter your postcode or ZIP code.";
  }

  if (values.country.length < 2) {
    errors.country = "Please enter your country.";
  }

  if (values.notes.length > 500) {
    errors.notes = "Please keep delivery notes under 500 characters.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values,
    email: values.email.toLowerCase(),
  };
}