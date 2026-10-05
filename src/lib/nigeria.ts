/**
 * Nigerian states and delivery zones.
 *
 * Ruby Debby Fashion Home ships from Abuja, so the delivery fee is based on how
 * far the customer is from there. Grouping the states into zones (rather than
 * pricing all 37 separately) is how most Nigerian shops do it - it is far
 * easier to maintain.
 *
 * To change a fee, edit the `feeCents` numbers in DELIVERY_ZONES below.
 * Remember these are in kobo: 250000 means N2,500.
 */

/** The 36 states plus the Federal Capital Territory, in alphabetical order. */
export const NIGERIA_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT - Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

export type NigeriaState = (typeof NIGERIA_STATES)[number];

/** The shop is in Abuja, so that is what the form pre-selects. */
export const DEFAULT_STATE: NigeriaState = "FCT - Abuja";

/** Sending from Abuja, so this is the cheapest zone. */
const NEAR_ABUJA = [
  "FCT - Abuja",
  "Nasarawa",
  "Niger",
  "Kogi",
  "Kwara",
  "Benue",
  "Plateau",
];

/** The rest of the North. */
const NORTH = [
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Sokoto",
  "Zamfara",
  "Jigawa",
  "Bauchi",
  "Gombe",
  "Adamawa",
  "Taraba",
  "Borno",
  "Yobe",
];

/** South West. */
const SOUTH_WEST = ["Lagos", "Ogun", "Oyo", "Osun", "Ondo", "Ekiti"];

/** South East. */
const SOUTH_EAST = ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"];

/** South South. */
const SOUTH_SOUTH = [
  "Akwa Ibom",
  "Bayelsa",
  "Cross River",
  "Delta",
  "Edo",
  "Rivers",
];

export type DeliveryZone = {
  name: string;
  /** Shown in the cart and at checkout so the customer knows what to expect. */
  description: string;
  feeCents: number;
  states: readonly string[];
};

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    name: "Abuja & nearby",
    description: "1 to 2 working days",
    feeCents: 250000, // N2,500
    states: NEAR_ABUJA,
  },
  {
    name: "Northern Nigeria",
    description: "3 to 4 working days",
    feeCents: 400000, // N4,000
    states: NORTH,
  },
  {
    name: "South West",
    description: "3 to 4 working days",
    feeCents: 450000, // N4,500
    states: SOUTH_WEST,
  },
  {
    name: "South East",
    description: "3 to 5 working days",
    feeCents: 500000, // N5,000
    states: SOUTH_EAST,
  },
  {
    name: "South South",
    description: "4 to 5 working days",
    feeCents: 550000, // N5,500
    states: SOUTH_SOUTH,
  },
];

/** A lookup built from the zones above, so we do not scan the list each time. */
const ZONE_BY_STATE = new Map<string, DeliveryZone>();
for (const zone of DELIVERY_ZONES) {
  for (const state of zone.states) {
    ZONE_BY_STATE.set(state, zone);
  }
}

/** The delivery zone for a state, or null if the state is not recognised. */
export function zoneForState(state: string | null | undefined): DeliveryZone | null {
  if (!state) return null;
  return ZONE_BY_STATE.get(state) ?? null;
}

/** True when the text is one of Nigeria's 36 states or the FCT. */
export function isValidState(state: string): boolean {
  return (NIGERIA_STATES as readonly string[]).includes(state);
}