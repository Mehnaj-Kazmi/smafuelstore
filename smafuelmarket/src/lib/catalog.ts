export type ArtKey =
  | "soda" | "water" | "energy" | "coffee" | "juice" | "milk" | "beer"
  | "chips" | "candy" | "chocolate" | "nuts" | "jerky" | "gum"
  | "bread" | "donut" | "sandwich" | "muffin" | "hotdog" | "pizza"
  | "cereal" | "soup" | "pasta" | "eggs" | "iceCream"
  | "oil" | "wiper" | "coolant" | "airFreshener" | "phoneCharger"
  | "cleaner" | "paperTowel" | "detergent" | "battery" | "lightbulb"
  | "pills" | "bandage" | "sanitizer" | "toothpaste"
  | "cigarettes" | "lighter"
  | "petFood" | "petTreat";

export type DepartmentSlug =
  | "grocery" | "drinks" | "snacks" | "bakery" | "automotive"
  | "household" | "medicine" | "tobacco" | "pet-supplies";

export type Department = {
  slug: DepartmentSlug;
  name: string;
  blurb: string;
  /** Uploaded artwork for the department circle; falls back to `art` + `hue`. */
  imageUrl?: string | null;
  art: ArtKey;
  hue: number;
  /** Blocks purchase without age confirmation at checkout. */
  ageRestricted?: boolean;
};

export type Category = { slug: string; name: string; department: DepartmentSlug; art: ArtKey; hue: number };

export type Product = {
  id: number;
  sku: string;
  barcode: string;
  title: string;
  brand: string;
  department: DepartmentSlug;
  category: string;
  /** Pack size or serving, e.g. "20 fl oz" — shown next to the title. */
  unit: string;
  price: number;
  listPrice?: number;
  stock: number;
  /** Stock level at or below which the admin inventory view flags it. */
  lowStockAt: number;
  rating: number;
  reviews: number;
  /**
   * Uploaded photograph, as returned by the API's upload endpoint. Absent for
   * every product in the seed catalogue below, which is drawn as generated
   * artwork from `art` + `hue` instead.
   */
  imageUrl?: string | null;
  art: ArtKey;
  hue: number;
  ageRestricted?: boolean;
  tags: string[];
  bullets: string[];
  description: string;
};

export const departments: Department[] = [
  { slug: "grocery", name: "Grocery", blurb: "Pantry staples, dairy & frozen", art: "cereal", hue: 30 },
  { slug: "drinks", name: "Drinks", blurb: "Soda, coffee, energy & water", art: "soda", hue: 205 },
  { slug: "snacks", name: "Snacks", blurb: "Chips, candy, nuts & jerky", art: "chips", hue: 45 },
  { slug: "bakery", name: "Bakery", blurb: "Fresh bread, donuts & hot food", art: "donut", hue: 25 },
  { slug: "automotive", name: "Automotive", blurb: "Oil, wipers, chargers & fluids", art: "oil", hue: 200 },
  { slug: "household", name: "Household", blurb: "Cleaning, paper goods & batteries", art: "cleaner", hue: 165 },
  { slug: "medicine", name: "Medicine", blurb: "Pain relief, first aid & care", art: "pills", hue: 190 },
  { slug: "tobacco", name: "Tobacco", blurb: "Age-restricted — ID required", art: "cigarettes", hue: 15, ageRestricted: true },
  { slug: "pet-supplies", name: "Pet Supplies", blurb: "Food, treats & essentials", art: "petFood", hue: 100 },
];

export const departmentMap = Object.fromEntries(
  departments.map((d) => [d.slug, d]),
) as Record<DepartmentSlug, Department>;

export const categories: Category[] = [
  { slug: "soft-drinks", name: "Soft Drinks", department: "drinks", art: "soda", hue: 205 },
  { slug: "energy-drinks", name: "Energy Drinks", department: "drinks", art: "energy", hue: 265 },
  { slug: "water", name: "Water", department: "drinks", art: "water", hue: 195 },
  { slug: "coffee-tea", name: "Coffee & Tea", department: "drinks", art: "coffee", hue: 25 },
  { slug: "juice", name: "Juice", department: "drinks", art: "juice", hue: 35 },
  { slug: "chips", name: "Chips & Crisps", department: "snacks", art: "chips", hue: 45 },
  { slug: "candy", name: "Candy & Chocolate", department: "snacks", art: "candy", hue: 330 },
  { slug: "nuts-jerky", name: "Nuts & Jerky", department: "snacks", art: "jerky", hue: 20 },
  { slug: "gum-mints", name: "Gum & Mints", department: "snacks", art: "gum", hue: 175 },
  { slug: "fresh-bakery", name: "Fresh Bakery", department: "bakery", art: "donut", hue: 25 },
  { slug: "hot-food", name: "Hot Food", department: "bakery", art: "hotdog", hue: 15 },
  { slug: "dairy", name: "Dairy & Eggs", department: "grocery", art: "milk", hue: 200 },
  { slug: "pantry", name: "Pantry", department: "grocery", art: "pasta", hue: 40 },
  { slug: "frozen", name: "Frozen", department: "grocery", art: "iceCream", hue: 300 },
  { slug: "fluids", name: "Oils & Fluids", department: "automotive", art: "oil", hue: 200 },
  { slug: "car-accessories", name: "Car Accessories", department: "automotive", art: "phoneCharger", hue: 220 },
  { slug: "cleaning", name: "Cleaning", department: "household", art: "cleaner", hue: 165 },
  { slug: "paper-goods", name: "Paper Goods", department: "household", art: "paperTowel", hue: 150 },
  { slug: "batteries", name: "Batteries & Bulbs", department: "household", art: "battery", hue: 55 },
  { slug: "pain-relief", name: "Pain Relief", department: "medicine", art: "pills", hue: 190 },
  { slug: "first-aid", name: "First Aid", department: "medicine", art: "bandage", hue: 210 },
  { slug: "personal-care", name: "Personal Care", department: "medicine", art: "toothpaste", hue: 180 },
  { slug: "cigarettes", name: "Cigarettes", department: "tobacco", art: "cigarettes", hue: 15 },
  { slug: "lighters", name: "Lighters & Accessories", department: "tobacco", art: "lighter", hue: 10 },
  { slug: "pet-food", name: "Pet Food", department: "pet-supplies", art: "petFood", hue: 100 },
  { slug: "pet-treats", name: "Pet Treats", department: "pet-supplies", art: "petTreat", hue: 85 },
];

export const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c])) as Record<string, Category>;

export const brands = [
  "Cascade Springs", "Voltix", "RoastWorks", "Orchard Lane", "Meadowvale",
  "Crisp County", "SweetPeak", "Trailhead", "FreshBake", "HotStop",
  "PantryCo", "FrostLine", "MotorMax", "DriveTech", "PureHome",
  "SoftFold", "PowerCell", "ReliefRx", "MediKit", "DailyCare",
  "Summit", "FlameCo", "PawPantry",
] as const;

function p(x: Product): Product {
  return x;
}

export const products: Product[] = [
  // ---- Drinks -------------------------------------------------------------
  p({
    id: 1001, sku: "DRK-SOD-001", barcode: "0490112340017",
    title: "Cascade Springs Cola", brand: "Cascade Springs",
    department: "drinks", category: "soft-drinks", unit: "20 fl oz bottle",
    price: 2.29, listPrice: 2.79, stock: 240, lowStockAt: 48,
    rating: 0, reviews: 0, art: "soda", hue: 205,
    tags: ["cold", "single-serve"],
    bullets: ["Classic cola, cane sugar sweetened", "Sold cold from the front cooler", "20 fl oz resealable bottle", "Caffeine 57mg per bottle"],
    description: "The everyday cola, pulled straight from the cooler. Cane sugar rather than corn syrup, and the cap reseals so it survives the rest of the drive.",
  }),
  p({
    id: 1002, sku: "DRK-ENG-002", barcode: "0490112340024",
    title: "Voltix Energy Drink — Citrus Surge", brand: "Voltix",
    department: "drinks", category: "energy-drinks", unit: "16 fl oz can",
    price: 3.49, listPrice: 4.29, stock: 156, lowStockAt: 36,
    rating: 0, reviews: 0, art: "energy", hue: 265,
    tags: ["cold", "caffeine"],
    bullets: ["200mg caffeine plus B-vitamin blend", "Zero sugar, 10 calories", "Citrus flavour with no aftertaste", "Chilled and ready to drink"],
    description: "A zero-sugar energy can that does not taste like cough syrup. 200mg of caffeine puts it around two strong coffees, so treat it accordingly on a long haul.",
  }),
  p({
    id: 1003, sku: "DRK-WTR-003", barcode: "0490112340031",
    title: "Cascade Springs Purified Water 6-Pack", brand: "Cascade Springs",
    department: "drinks", category: "water", unit: "6 × 16.9 fl oz",
    price: 4.99, stock: 88, lowStockAt: 24,
    rating: 0, reviews: 0, art: "water", hue: 195,
    tags: ["multipack"],
    bullets: ["Reverse-osmosis purified, mineral balanced", "Six 16.9 fl oz bottles", "100% recycled PET bottles", "Shelf stable — no refrigeration needed"],
    description: "Six bottles in a carry pack. Purified by reverse osmosis then remineralised, so it does not have the flat taste distilled water gets.",
  }),
  p({
    id: 1004, sku: "DRK-COF-004", barcode: "0490112340048",
    title: "RoastWorks Fresh Brew Coffee — Large", brand: "RoastWorks",
    department: "drinks", category: "coffee-tea", unit: "20 fl oz cup",
    price: 2.49, stock: 999, lowStockAt: 0,
    rating: 0, reviews: 0, art: "coffee", hue: 25,
    tags: ["hot", "made-to-order"],
    bullets: ["Brewed fresh every 30 minutes", "Medium roast, 100% arabica", "Free refills on the same visit", "Cream, sugar and syrups at the counter"],
    description: "Brewed on a 30-minute cycle so it is never sitting on a hot plate going bitter. Medium roast arabica, and refills are free if you come back with the cup.",
  }),
  p({
    id: 1005, sku: "DRK-JCE-005", barcode: "0490112340055",
    title: "Orchard Lane Orange Juice", brand: "Orchard Lane",
    department: "drinks", category: "juice", unit: "15.2 fl oz",
    price: 3.19, stock: 64, lowStockAt: 18,
    rating: 0, reviews: 0, art: "juice", hue: 35,
    tags: ["cold", "chilled"],
    bullets: ["Not from concentrate", "No added sugar", "Pasteurised, keep refrigerated", "One full serving of fruit"],
    description: "Not-from-concentrate orange juice kept in the cold case. No added sugar, so it tastes like oranges rather than orange candy.",
  }),

  // ---- Snacks -------------------------------------------------------------
  p({
    id: 1006, sku: "SNK-CHP-006", barcode: "0490112340062",
    title: "Crisp County Kettle Chips — Sea Salt", brand: "Crisp County",
    department: "snacks", category: "chips", unit: "8 oz bag",
    price: 3.99, listPrice: 4.99, stock: 132, lowStockAt: 30,
    rating: 0, reviews: 0, art: "chips", hue: 45,
    tags: ["sharing"],
    bullets: ["Kettle cooked in small batches", "Just potatoes, oil and sea salt", "8 oz sharing bag", "No artificial flavours or colours"],
    description: "Kettle cooked so they actually crunch instead of shattering. Three ingredients on the back of the bag, which is rare for a crisp.",
  }),
  p({
    id: 1007, sku: "SNK-CND-007", barcode: "0490112340079",
    title: "SweetPeak Milk Chocolate Bar", brand: "SweetPeak",
    department: "snacks", category: "candy", unit: "1.55 oz bar",
    price: 1.89, stock: 310, lowStockAt: 60,
    rating: 0, reviews: 0, art: "chocolate", hue: 20,
    tags: ["impulse", "checkout"],
    bullets: ["32% cocoa milk chocolate", "Rainforest Alliance certified cocoa", "Classic 1.55 oz bar", "Also sold in king size"],
    description: "The standard checkout chocolate bar, made with certified cocoa. Melts properly rather than going waxy, which is the giveaway on cheap compound chocolate.",
  }),
  p({
    id: 1008, sku: "SNK-JRK-008", barcode: "0490112340086",
    title: "Trailhead Beef Jerky — Original", brand: "Trailhead",
    department: "snacks", category: "nuts-jerky", unit: "3.25 oz bag",
    price: 7.49, listPrice: 8.99, stock: 74, lowStockAt: 20,
    rating: 0, reviews: 0, art: "jerky", hue: 20,
    tags: ["protein", "road-trip"],
    bullets: ["11g protein per serving", "No added nitrates or MSG", "Slow marinated for 12 hours", "Resealable 3.25 oz bag"],
    description: "Actually tender jerky rather than the shoe-leather kind. Marinated overnight before smoking, with no nitrates added.",
  }),
  p({
    id: 1009, sku: "SNK-NUT-009", barcode: "0490112340093",
    title: "Trailhead Roasted Mixed Nuts", brand: "Trailhead",
    department: "snacks", category: "nuts-jerky", unit: "6 oz canister",
    price: 5.99, stock: 96, lowStockAt: 24,
    rating: 0, reviews: 0, art: "nuts", hue: 30,
    tags: ["protein"],
    bullets: ["Almonds, cashews, pecans and hazelnuts", "Dry roasted with sea salt", "Resealable canister", "Good source of protein and fibre"],
    description: "Dry roasted rather than oil roasted, so they are not greasy in the cupholder. The canister reseals, which a bag never really does.",
  }),
  p({
    id: 1010, sku: "SNK-GUM-010", barcode: "0490112340109",
    title: "FreshBake Spearmint Gum", brand: "SweetPeak",
    department: "snacks", category: "gum-mints", unit: "15-stick pack",
    price: 1.49, stock: 420, lowStockAt: 80,
    rating: 0, reviews: 0, art: "gum", hue: 175,
    tags: ["impulse", "checkout"],
    bullets: ["Sugar free, sweetened with xylitol", "15 sticks per pack", "Long-lasting spearmint", "Helps neutralise mouth acid"],
    description: "Sugar-free spearmint that keeps its flavour past the first minute. Fifteen sticks in a slim pack that fits a shirt pocket.",
  }),

  // ---- Bakery -------------------------------------------------------------
  p({
    id: 1011, sku: "BAK-DNT-011", barcode: "0490112340116",
    title: "FreshBake Glazed Donut", brand: "FreshBake",
    department: "bakery", category: "fresh-bakery", unit: "each",
    price: 1.29, stock: 9, lowStockAt: 12,
    rating: 0, reviews: 0, art: "donut", hue: 25,
    tags: ["fresh-daily", "hot"],
    bullets: ["Baked fresh on site each morning", "Classic sugar glaze", "Buy 6 and get the 7th free", "Best eaten same day"],
    description: "Made on site before opening, not shipped in frozen. Sells out most mornings by nine, which tells you what you need to know.",
  }),
  p({
    id: 1012, sku: "BAK-SND-012", barcode: "0490112340123",
    title: "HotStop Breakfast Sandwich — Egg & Cheese", brand: "HotStop",
    department: "bakery", category: "hot-food", unit: "each",
    price: 4.49, listPrice: 5.49, stock: 6, lowStockAt: 8,
    rating: 0, reviews: 0, art: "sandwich", hue: 40,
    tags: ["hot", "breakfast"],
    bullets: ["Cage-free egg with melted cheddar", "Served on a toasted English muffin", "Ready hot from 5am to 11am", "Add bacon or sausage at the counter"],
    description: "Hot from five in the morning. Cage-free egg and real cheddar on a toasted muffin — it holds together in one hand while you drive.",
  }),
  p({
    id: 1013, sku: "BAK-HTD-013", barcode: "0490112340130",
    title: "HotStop Roller Grill Hot Dog", brand: "HotStop",
    department: "bakery", category: "hot-food", unit: "each",
    price: 2.99, stock: 34, lowStockAt: 10,
    rating: 0, reviews: 0, art: "hotdog", hue: 15,
    tags: ["hot", "all-day"],
    bullets: ["All-beef frank", "Free toppings bar", "Available all day, every day", "Two for $5 deal"],
    description: "All-beef frank off the roller, with the toppings bar included. Two for five dollars if you are feeding someone else.",
  }),
  p({
    id: 1014, sku: "BAK-MUF-014", barcode: "0490112340147",
    title: "FreshBake Blueberry Muffin", brand: "FreshBake",
    department: "bakery", category: "fresh-bakery", unit: "each",
    price: 2.19, stock: 0, lowStockAt: 10,
    rating: 0, reviews: 0, art: "muffin", hue: 280,
    tags: ["fresh-daily"],
    bullets: ["Real blueberries, not flavoured pieces", "Baked on site daily", "Individually wrapped", "Warms well in 15 seconds"],
    description: "Baked on site with real blueberries — you can see them in the crumb. Fifteen seconds in the microwave brings it back to fresh.",
  }),

  // ---- Grocery ------------------------------------------------------------
  p({
    id: 1015, sku: "GRO-DRY-015", barcode: "0490112340154",
    title: "Meadowvale Whole Milk", brand: "Meadowvale",
    department: "grocery", category: "dairy", unit: "1 gallon",
    price: 4.29, stock: 42, lowStockAt: 12,
    rating: 0, reviews: 0, art: "milk", hue: 200,
    tags: ["chilled", "essential"],
    bullets: ["Grade A whole milk", "From local dairies within 100 miles", "Keep refrigerated", "Vitamin D fortified"],
    description: "Grade A whole milk from dairies inside a hundred miles, so it arrives with plenty of date left on it.",
  }),
  p({
    id: 1016, sku: "GRO-DRY-016", barcode: "0490112340161",
    title: "Meadowvale Large Eggs", brand: "Meadowvale",
    department: "grocery", category: "dairy", unit: "dozen",
    price: 3.99, listPrice: 4.79, stock: 38, lowStockAt: 12,
    rating: 0, reviews: 0, art: "eggs", hue: 45,
    tags: ["chilled", "essential"],
    bullets: ["Grade A large, cage-free", "Dozen in a recycled pulp carton", "Keep refrigerated", "Candled and graded on farm"],
    description: "Cage-free grade A large eggs in a pulp carton that composts. The one thing everyone forgets until they are already home.",
  }),
  p({
    id: 1017, sku: "GRO-BRD-017", barcode: "0490112340178",
    title: "FreshBake Sliced White Bread", brand: "FreshBake",
    department: "grocery", category: "pantry", unit: "20 oz loaf",
    price: 2.99, stock: 56, lowStockAt: 16,
    rating: 0, reviews: 0, art: "bread", hue: 35,
    tags: ["essential"],
    bullets: ["Soft sandwich loaf, 20 slices", "No high-fructose corn syrup", "Baked within 24 hours of delivery", "Freezes well"],
    description: "A plain soft sandwich loaf without the corn syrup most cheap bread carries. Twenty slices, so eighteen sandwiches and two heels nobody wants.",
  }),
  p({
    id: 1018, sku: "GRO-PAN-018", barcode: "0490112340185",
    title: "PantryCo Instant Ramen — Chicken", brand: "PantryCo",
    department: "grocery", category: "pantry", unit: "3 oz cup",
    price: 1.29, stock: 180, lowStockAt: 40,
    rating: 0, reviews: 0, art: "soup", hue: 30,
    tags: ["shelf-stable", "hot-water"],
    bullets: ["Ready in 3 minutes with hot water", "Free hot water at the coffee station", "Fork included under the lid", "Shelf stable for 12 months"],
    description: "Three minutes and hot water, which we give away free at the coffee station. The fork is under the lid so you are not stuck in the car without one.",
  }),
  p({
    id: 1019, sku: "GRO-FRZ-019", barcode: "0490112340192",
    title: "FrostLine Vanilla Ice Cream Pint", brand: "FrostLine",
    department: "grocery", category: "frozen", unit: "1 pint",
    price: 5.49, listPrice: 6.99, stock: 7, lowStockAt: 10,
    rating: 0, reviews: 0, art: "iceCream", hue: 300,
    tags: ["frozen"],
    bullets: ["Made with real vanilla bean", "14% butterfat — a true premium base", "Pint size", "Keep frozen"],
    description: "Real vanilla bean and a 14% butterfat base, which is what separates premium from the airy stuff. You can see the seeds in it.",
  }),

  // ---- Automotive ---------------------------------------------------------
  p({
    id: 1020, sku: "AUT-OIL-020", barcode: "0490112340208",
    title: "MotorMax Full Synthetic Motor Oil 5W-30", brand: "MotorMax",
    department: "automotive", category: "fluids", unit: "5 quart jug",
    price: 27.99, listPrice: 34.99, stock: 22, lowStockAt: 6,
    rating: 0, reviews: 0, art: "oil", hue: 200,
    tags: ["bulk"],
    bullets: ["Full synthetic, API SP rated", "Protects up to 10,000 miles between changes", "Suits most petrol engines needing 5W-30", "5 quart jug with a pour spout"],
    description: "Full synthetic rated to the current API SP standard, in the five-quart jug that covers most oil changes in one go.",
  }),
  p({
    id: 1021, sku: "AUT-WIP-021", barcode: "0490112340215",
    title: "DriveTech All-Season Wiper Blade 22\"", brand: "DriveTech",
    department: "automotive", category: "car-accessories", unit: "each",
    price: 14.99, stock: 5, lowStockAt: 8,
    rating: 0, reviews: 0, art: "wiper", hue: 210,
    tags: [],
    bullets: ["22-inch beam blade, no exposed frame", "Graphite-coated rubber for quiet wiping", "Fits most J-hook wiper arms", "Tool-free install in about a minute"],
    description: "A beam-style blade with no frame to pack with ice. Clips onto standard J-hook arms without tools — about a minute a side.",
  }),
  p({
    id: 1022, sku: "AUT-FLD-022", barcode: "0490112340222",
    title: "MotorMax Windshield Washer Fluid", brand: "MotorMax",
    department: "automotive", category: "fluids", unit: "1 gallon",
    price: 4.49, stock: 64, lowStockAt: 16,
    rating: 0, reviews: 0, art: "coolant", hue: 195,
    tags: [],
    bullets: ["Effective to -20°F", "Cuts bug splatter and road film", "Safe on paint and rubber trim", "1 gallon jug"],
    description: "Rated to twenty below, so it will not freeze in the reservoir and split it. Cuts road film without leaving a smear.",
  }),
  p({
    id: 1023, sku: "AUT-ACC-023", barcode: "0490112340239",
    title: "DriveTech 30W USB-C Car Charger", brand: "DriveTech",
    department: "automotive", category: "car-accessories", unit: "each",
    price: 16.99, listPrice: 22.99, stock: 44, lowStockAt: 12,
    rating: 0, reviews: 0, art: "phoneCharger", hue: 220,
    tags: ["electronics"],
    bullets: ["30W USB-C Power Delivery plus 12W USB-A", "Charges most phones to 50% in 30 minutes", "Built-in surge protection", "Fits standard 12V sockets"],
    description: "Thirty watts over USB-C, which is enough to fast charge a phone rather than just holding it steady while the map runs.",
  }),
  p({
    id: 1024, sku: "AUT-ACC-024", barcode: "0490112340246",
    title: "DriveTech Air Freshener — Black Ice", brand: "DriveTech",
    department: "automotive", category: "car-accessories", unit: "3-pack",
    price: 3.99, stock: 120, lowStockAt: 30,
    rating: 0, reviews: 0, art: "airFreshener", hue: 250,
    tags: ["impulse"],
    bullets: ["Three hanging fresheners per pack", "Lasts around 30 days each", "Adjustable-release sleeve", "Classic cool fragrance"],
    description: "Three to a pack with a sleeve you slide down to control how strong it is — pull it all the way out on day one and it is gone in a week.",
  }),

  // ---- Household ----------------------------------------------------------
  p({
    id: 1025, sku: "HOU-CLN-025", barcode: "0490112340253",
    title: "PureHome Multi-Surface Cleaner", brand: "PureHome",
    department: "household", category: "cleaning", unit: "28 fl oz spray",
    price: 4.79, stock: 58, lowStockAt: 15,
    rating: 0, reviews: 0, art: "cleaner", hue: 165,
    tags: [],
    bullets: ["Safe on sealed counters, glass and stainless", "Plant-derived surfactants", "No bleach or ammonia", "28 fl oz trigger spray"],
    description: "One bottle for counters, glass and stainless, without the ammonia smell that lingers for an hour afterwards.",
  }),
  p({
    id: 1026, sku: "HOU-PPR-026", barcode: "0490112340260",
    title: "SoftFold Paper Towels 6-Roll", brand: "SoftFold",
    department: "household", category: "paper-goods", unit: "6 mega rolls",
    price: 11.99, listPrice: 14.99, stock: 36, lowStockAt: 10,
    rating: 0, reviews: 0, art: "paperTowel", hue: 150,
    tags: ["bulk"],
    bullets: ["Six mega rolls, equal to 15 regular", "2-ply with a select-a-size sheet", "Strong when wet", "Made from responsibly sourced fibre"],
    description: "Six mega rolls that work out to about fifteen regular ones. Half-sheet perforation means you are not wasting a full sheet on a small spill.",
  }),
  p({
    id: 1027, sku: "HOU-BAT-027", barcode: "0490112340277",
    title: "PowerCell AA Alkaline Batteries 8-Pack", brand: "PowerCell",
    department: "household", category: "batteries", unit: "8-pack",
    price: 9.49, stock: 92, lowStockAt: 24,
    rating: 0, reviews: 0, art: "battery", hue: 55,
    tags: ["essential"],
    bullets: ["Eight AA alkaline cells", "10-year shelf life in storage", "Leak-resistant construction", "Suits remotes, toys and torches"],
    description: "Eight AA cells with a ten-year shelf life, so a spare pack in the drawer will still work when you finally need it.",
  }),
  p({
    id: 1028, sku: "HOU-DET-028", barcode: "0490112340284",
    title: "PureHome Laundry Detergent Pods 20ct", brand: "PureHome",
    department: "household", category: "cleaning", unit: "20 pods",
    price: 8.99, stock: 40, lowStockAt: 12,
    rating: 0, reviews: 0, art: "detergent", hue: 210,
    tags: [],
    bullets: ["20 pre-measured pods", "Works in hot and cold water", "HE machine compatible", "Child-resistant tub"],
    description: "Pre-measured pods that dissolve in cold water, which most cheap ones do not — you find the shell stuck to a sleeve afterwards.",
  }),

  // ---- Medicine -----------------------------------------------------------
  p({
    id: 1029, sku: "MED-PAI-029", barcode: "0490112340291",
    title: "ReliefRx Ibuprofen 200mg", brand: "ReliefRx",
    department: "medicine", category: "pain-relief", unit: "24 tablets",
    price: 6.49, stock: 70, lowStockAt: 18,
    rating: 0, reviews: 0, art: "pills", hue: 190,
    tags: ["otc"],
    bullets: ["200mg ibuprofen per coated tablet", "For headache, muscle ache and fever", "24 tablets in a sealed bottle", "Read the label before use"],
    description: "Standard 200mg ibuprofen in a 24-count bottle. Coated tablets, which go down easier than the chalky uncoated kind.",
  }),
  p({
    id: 1030, sku: "MED-FST-030", barcode: "0490112340307",
    title: "MediKit Adhesive Bandages Variety Pack", brand: "MediKit",
    department: "medicine", category: "first-aid", unit: "40 count",
    price: 4.99, stock: 84, lowStockAt: 20,
    rating: 0, reviews: 0, art: "bandage", hue: 210,
    tags: ["otc"],
    bullets: ["40 bandages across four sizes", "Flexible fabric that moves with skin", "Sterile until opened", "Latex free"],
    description: "Forty bandages in four sizes, on flexible fabric rather than plastic so they stay on knuckles and knees.",
  }),
  p({
    id: 1031, sku: "MED-PER-031", barcode: "0490112340314",
    title: "DailyCare Hand Sanitizer Gel", brand: "DailyCare",
    department: "medicine", category: "personal-care", unit: "8 fl oz",
    price: 3.49, stock: 110, lowStockAt: 25,
    rating: 0, reviews: 0, art: "sanitizer", hue: 175,
    tags: ["otc"],
    bullets: ["70% ethyl alcohol", "Kills 99.9% of common germs", "Aloe and vitamin E to reduce drying", "8 fl oz pump bottle"],
    description: "Seventy percent alcohol, which is the level that actually works, with aloe added so your hands are not cracked by Wednesday.",
  }),
  p({
    id: 1032, sku: "MED-PER-032", barcode: "0490112340321",
    title: "DailyCare Travel Toothpaste", brand: "DailyCare",
    department: "medicine", category: "personal-care", unit: "0.85 oz",
    price: 2.29, stock: 96, lowStockAt: 24,
    rating: 0, reviews: 0, art: "toothpaste", hue: 180,
    tags: ["travel"],
    bullets: ["Fluoride toothpaste, cavity protection", "TSA carry-on approved size", "Fresh mint", "0.85 oz travel tube"],
    description: "Carry-on sized fluoride toothpaste for the trip you packed for in a hurry. Fits the liquids bag without argument.",
  }),

  // ---- Tobacco (age restricted) -------------------------------------------
  p({
    id: 1033, sku: "TOB-CIG-033", barcode: "0490112340338",
    title: "Summit Original Cigarettes", brand: "Summit",
    department: "tobacco", category: "cigarettes", unit: "pack of 20",
    price: 9.99, stock: 60, lowStockAt: 15,
    rating: 0, reviews: 0, art: "cigarettes", hue: 15,
    ageRestricted: true,
    tags: ["age-restricted", "id-required"],
    bullets: ["Pack of 20", "Photo ID required — 21 and over", "Not eligible for delivery in all areas", "Sold from behind the counter"],
    description: "Sold from behind the counter. Photo ID is required at handover for anyone appearing under 40, without exception.",
  }),
  p({
    id: 1034, sku: "TOB-LTR-034", barcode: "0490112340345",
    title: "FlameCo Refillable Lighter", brand: "FlameCo",
    department: "tobacco", category: "lighters", unit: "each",
    price: 2.49, stock: 140, lowStockAt: 30,
    rating: 0, reviews: 0, art: "lighter", hue: 10,
    ageRestricted: true,
    tags: ["age-restricted", "impulse"],
    bullets: ["Adjustable flame height", "Refillable with standard butane", "Child-resistant mechanism", "Photo ID required — 18 and over"],
    description: "Refillable rather than disposable, with an adjustable flame. Child-resistant catch as required by law.",
  }),

  // ---- Pet supplies -------------------------------------------------------
  p({
    id: 1035, sku: "PET-FUD-035", barcode: "0490112340352",
    title: "PawPantry Complete Dry Dog Food", brand: "PawPantry",
    department: "pet-supplies", category: "pet-food", unit: "4 lb bag",
    price: 12.99, listPrice: 15.99, stock: 26, lowStockAt: 8,
    rating: 0, reviews: 0, art: "petFood", hue: 100,
    tags: ["bulk"],
    bullets: ["Real chicken as the first ingredient", "Complete and balanced for adult dogs", "No corn, wheat or soy fillers", "4 lb resealable bag"],
    description: "Chicken first on the ingredient list rather than corn, and complete-and-balanced certified for adult dogs. The bag reseals.",
  }),
  p({
    id: 1036, sku: "PET-TRT-036", barcode: "0490112340369",
    title: "PawPantry Dental Chew Treats", brand: "PawPantry",
    department: "pet-supplies", category: "pet-treats", unit: "12 chews",
    price: 8.49, stock: 48, lowStockAt: 12,
    rating: 0, reviews: 0, art: "petTreat", hue: 85,
    tags: [],
    bullets: ["Ridged texture helps reduce plaque", "12 chews per pack", "For dogs over 20 lb", "No artificial colours"],
    description: "Ridged chews that scrape plaque while the dog works on them. Twelve to a pack, sized for dogs over twenty pounds.",
  }),
];

/* ---- Lookups ------------------------------------------------------------
 *
 * Each lookup takes the list to search, defaulting to the seed catalogue above.
 * Passing a list is how live data from the API flows through: the storefront
 * hands in what it fetched, while anything that has not been converted yet
 * keeps working against the seed unchanged.
 */

export function getProduct(id: number, list: Product[] = products): Product | undefined {
  return list.find((p) => p.id === id);
}

export function byDepartment(slug: DepartmentSlug, list: Product[] = products): Product[] {
  return list.filter((p) => p.department === slug);
}

export function byCategory(slug: string, list: Product[] = products): Product[] {
  return list.filter((p) => p.category === slug);
}

export function categoriesIn(slug: DepartmentSlug): Category[] {
  return categories.filter((c) => c.department === slug);
}

export function discountPercent(p: Product): number | null {
  if (!p.listPrice || p.listPrice <= p.price) return null;
  return Math.round(((p.listPrice - p.price) / p.listPrice) * 100);
}

export function stockState(p: Product): "out" | "low" | "ok" {
  if (p.stock <= 0) return "out";
  if (p.stock <= p.lowStockAt) return "low";
  return "ok";
}

export function relatedProducts(product: Product, limit = 6, list: Product[] = products): Product[] {
  const sameCategory = list.filter((p) => p.category === product.category && p.id !== product.id);
  const sameDept = list.filter(
    (p) => p.department === product.department && p.category !== product.category && p.id !== product.id,
  );
  return [...sameCategory, ...sameDept].slice(0, limit);
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "name";

export function sortProducts(list: Product[], sort: SortKey): Product[] {
  switch (sort) {
    case "price-asc":
      return [...list].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...list].sort((a, b) => b.price - a.price);
    case "rating":
      return [...list].sort((a, b) => b.rating - a.rating);
    case "name":
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    default:
      return list;
  }
}

export function searchProducts(
  query: string,
  opts: { department?: DepartmentSlug | "all"; sort?: SortKey } = {},
  source: Product[] = products,
): Product[] {
  const q = query.trim().toLowerCase();
  const list = source.filter((p) => {
    if (opts.department && opts.department !== "all" && p.department !== opts.department) return false;
    if (!q) return true;
    const hay = `${p.title} ${p.brand} ${p.department} ${p.category} ${p.sku} ${p.tags.join(" ")}`.toLowerCase();
    return q.split(/\s+/).every((t) => hay.includes(t));
  });
  return sortProducts(list, opts.sort ?? "featured");
}
