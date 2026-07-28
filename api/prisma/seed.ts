import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const departments = [
  { slug: 'grocery', name: 'Grocery', blurb: 'Pantry staples, dairy & frozen', art: 'cereal', hue: 30 },
  { slug: 'drinks', name: 'Drinks', blurb: 'Soda, coffee, energy & water', art: 'soda', hue: 205 },
  { slug: 'snacks', name: 'Snacks', blurb: 'Chips, candy, nuts & jerky', art: 'chips', hue: 45 },
  { slug: 'bakery', name: 'Bakery', blurb: 'Fresh bread, donuts & hot food', art: 'donut', hue: 25 },
  { slug: 'automotive', name: 'Automotive', blurb: 'Oil, wipers, chargers & fluids', art: 'oil', hue: 200 },
  { slug: 'household', name: 'Household', blurb: 'Cleaning, paper goods & batteries', art: 'cleaner', hue: 165 },
  { slug: 'medicine', name: 'Medicine', blurb: 'Pain relief, first aid & care', art: 'pills', hue: 190 },
  { slug: 'tobacco', name: 'Tobacco', blurb: 'Age-restricted — ID required', art: 'cigarettes', hue: 15, ageRestricted: true },
  { slug: 'pet-supplies', name: 'Pet Supplies', blurb: 'Food, treats & essentials', art: 'petFood', hue: 100 },
];

const categories = [
  { slug: 'soft-drinks', name: 'Soft Drinks', departmentSlug: 'drinks', art: 'soda', hue: 205 },
  { slug: 'energy-drinks', name: 'Energy Drinks', departmentSlug: 'drinks', art: 'energy', hue: 265 },
  { slug: 'water', name: 'Water', departmentSlug: 'drinks', art: 'water', hue: 195 },
  { slug: 'coffee-tea', name: 'Coffee & Tea', departmentSlug: 'drinks', art: 'coffee', hue: 25 },
  { slug: 'juice', name: 'Juice', departmentSlug: 'drinks', art: 'juice', hue: 35 },
  { slug: 'chips', name: 'Chips & Crisps', departmentSlug: 'snacks', art: 'chips', hue: 45 },
  { slug: 'candy', name: 'Candy & Chocolate', departmentSlug: 'snacks', art: 'candy', hue: 330 },
  { slug: 'nuts-jerky', name: 'Nuts & Jerky', departmentSlug: 'snacks', art: 'jerky', hue: 20 },
  { slug: 'gum-mints', name: 'Gum & Mints', departmentSlug: 'snacks', art: 'gum', hue: 175 },
  { slug: 'fresh-bakery', name: 'Fresh Bakery', departmentSlug: 'bakery', art: 'donut', hue: 25 },
  { slug: 'hot-food', name: 'Hot Food', departmentSlug: 'bakery', art: 'hotdog', hue: 15 },
  { slug: 'dairy', name: 'Dairy & Eggs', departmentSlug: 'grocery', art: 'milk', hue: 200 },
  { slug: 'pantry', name: 'Pantry', departmentSlug: 'grocery', art: 'pasta', hue: 40 },
  { slug: 'frozen', name: 'Frozen', departmentSlug: 'grocery', art: 'iceCream', hue: 300 },
  { slug: 'fluids', name: 'Oils & Fluids', departmentSlug: 'automotive', art: 'oil', hue: 200 },
  { slug: 'car-accessories', name: 'Car Accessories', departmentSlug: 'automotive', art: 'phoneCharger', hue: 220 },
  { slug: 'cleaning', name: 'Cleaning', departmentSlug: 'household', art: 'cleaner', hue: 165 },
  { slug: 'paper-goods', name: 'Paper Goods', departmentSlug: 'household', art: 'paperTowel', hue: 150 },
  { slug: 'batteries', name: 'Batteries & Bulbs', departmentSlug: 'household', art: 'battery', hue: 55 },
  { slug: 'pain-relief', name: 'Pain Relief', departmentSlug: 'medicine', art: 'pills', hue: 190 },
  { slug: 'first-aid', name: 'First Aid', departmentSlug: 'medicine', art: 'bandage', hue: 210 },
  { slug: 'personal-care', name: 'Personal Care', departmentSlug: 'medicine', art: 'toothpaste', hue: 180 },
  { slug: 'cigarettes', name: 'Cigarettes', departmentSlug: 'tobacco', art: 'cigarettes', hue: 15 },
  { slug: 'lighters', name: 'Lighters & Accessories', departmentSlug: 'tobacco', art: 'lighter', hue: 10 },
  { slug: 'pet-food', name: 'Pet Food', departmentSlug: 'pet-supplies', art: 'petFood', hue: 100 },
  { slug: 'pet-treats', name: 'Pet Treats', departmentSlug: 'pet-supplies', art: 'petTreat', hue: 85 },
];

const products = [
  { id: 'gs-1001', sku: 'DRK-SOD-001', barcode: '0490112340017', title: 'Cascade Springs Cola', brand: 'Cascade Springs', departmentSlug: 'drinks', categorySlug: 'soft-drinks', unit: '20 fl oz bottle', price: 2.29, listPrice: 2.79, stock: 240, lowStockAt: 48, rating: 4.4, reviews: 1820, art: 'soda', hue: 205, tags: ['cold', 'single-serve'], bullets: ['Classic cola, cane sugar sweetened', 'Sold cold from the front cooler', '20 fl oz resealable bottle', 'Caffeine 57mg per bottle'], description: 'The everyday cola, pulled straight from the cooler. Cane sugar rather than corn syrup, and the cap reseals so it survives the rest of the drive.' },
  { id: 'gs-1002', sku: 'DRK-ENG-002', barcode: '0490112340024', title: 'Voltix Energy Drink — Citrus Surge', brand: 'Voltix', departmentSlug: 'drinks', categorySlug: 'energy-drinks', unit: '16 fl oz can', price: 3.49, listPrice: 4.29, stock: 156, lowStockAt: 36, rating: 4.2, reviews: 3410, art: 'energy', hue: 265, tags: ['cold', 'caffeine'], bullets: ['200mg caffeine plus B-vitamin blend', 'Zero sugar, 10 calories', 'Citrus flavour with no aftertaste', 'Chilled and ready to drink'], description: 'A zero-sugar energy can that does not taste like cough syrup. 200mg of caffeine puts it around two strong coffees, so treat it accordingly on a long haul.' },
  { id: 'gs-1003', sku: 'DRK-WTR-003', barcode: '0490112340031', title: 'Cascade Springs Purified Water 6-Pack', brand: 'Cascade Springs', departmentSlug: 'drinks', categorySlug: 'water', unit: '6 × 16.9 fl oz', price: 4.99, stock: 88, lowStockAt: 24, rating: 4.7, reviews: 2260, art: 'water', hue: 195, tags: ['multipack'], bullets: ['Reverse-osmosis purified, mineral balanced', 'Six 16.9 fl oz bottles', '100% recycled PET bottles', 'Shelf stable — no refrigeration needed'], description: 'Six bottles in a carry pack. Purified by reverse osmosis then remineralised, so it does not have the flat taste distilled water gets.' },
  { id: 'gs-1004', sku: 'DRK-COF-004', barcode: '0490112340048', title: 'RoastWorks Fresh Brew Coffee — Large', brand: 'RoastWorks', departmentSlug: 'drinks', categorySlug: 'coffee-tea', unit: '20 fl oz cup', price: 2.49, stock: 999, lowStockAt: 0, rating: 4.6, reviews: 5140, art: 'coffee', hue: 25, tags: ['hot', 'made-to-order'], bullets: ['Brewed fresh every 30 minutes', 'Medium roast, 100% arabica', 'Free refills on the same visit', 'Cream, sugar and syrups at the counter'], description: 'Brewed on a 30-minute cycle so it is never sitting on a hot plate going bitter. Medium roast arabica, and refills are free if you come back with the cup.' },
  { id: 'gs-1005', sku: 'DRK-JCE-005', barcode: '0490112340055', title: 'Orchard Lane Orange Juice', brand: 'Orchard Lane', departmentSlug: 'drinks', categorySlug: 'juice', unit: '15.2 fl oz', price: 3.19, stock: 64, lowStockAt: 18, rating: 4.5, reviews: 940, art: 'juice', hue: 35, tags: ['cold', 'chilled'], bullets: ['Not from concentrate', 'No added sugar', 'Pasteurised, keep refrigerated', 'One full serving of fruit'], description: 'Not-from-concentrate orange juice kept in the cold case. No added sugar, so it tastes like oranges rather than orange candy.' },
  { id: 'gs-1006', sku: 'SNK-CHP-006', barcode: '0490112340062', title: 'Crisp County Kettle Chips — Sea Salt', brand: 'Crisp County', departmentSlug: 'snacks', categorySlug: 'chips', unit: '8 oz bag', price: 3.99, listPrice: 4.99, stock: 132, lowStockAt: 30, rating: 4.6, reviews: 2870, art: 'chips', hue: 45, tags: ['sharing'], bullets: ['Kettle cooked in small batches', 'Just potatoes, oil and sea salt', '8 oz sharing bag', 'No artificial flavours or colours'], description: 'Kettle cooked so they actually crunch instead of shattering. Three ingredients on the back of the bag, which is rare for a crisp.' },
  { id: 'gs-1007', sku: 'SNK-CND-007', barcode: '0490112340079', title: 'SweetPeak Milk Chocolate Bar', brand: 'SweetPeak', departmentSlug: 'snacks', categorySlug: 'candy', unit: '1.55 oz bar', price: 1.89, stock: 310, lowStockAt: 60, rating: 4.5, reviews: 4120, art: 'chocolate', hue: 20, tags: ['impulse', 'checkout'], bullets: ['32% cocoa milk chocolate', 'Rainforest Alliance certified cocoa', 'Classic 1.55 oz bar', 'Also sold in king size'], description: 'The standard checkout chocolate bar, made with certified cocoa. Melts properly rather than going waxy, which is the giveaway on cheap compound chocolate.' },
  { id: 'gs-1008', sku: 'SNK-JRK-008', barcode: '0490112340086', title: 'Trailhead Beef Jerky — Original', brand: 'Trailhead', departmentSlug: 'snacks', categorySlug: 'nuts-jerky', unit: '3.25 oz bag', price: 7.49, listPrice: 8.99, stock: 74, lowStockAt: 20, rating: 4.7, reviews: 1980, art: 'jerky', hue: 20, tags: ['protein', 'road-trip'], bullets: ['11g protein per serving', 'No added nitrates or MSG', 'Slow marinated for 12 hours', 'Resealable 3.25 oz bag'], description: 'Actually tender jerky rather than the shoe-leather kind. Marinated overnight before smoking, with no nitrates added.' },
  { id: 'gs-1009', sku: 'SNK-NUT-009', barcode: '0490112340093', title: 'Trailhead Roasted Mixed Nuts', brand: 'Trailhead', departmentSlug: 'snacks', categorySlug: 'nuts-jerky', unit: '6 oz canister', price: 5.99, stock: 96, lowStockAt: 24, rating: 4.4, reviews: 1130, art: 'nuts', hue: 30, tags: ['protein'], bullets: ['Almonds, cashews, pecans and hazelnuts', 'Dry roasted with sea salt', 'Resealable canister', 'Good source of protein and fibre'], description: 'Dry roasted rather than oil roasted, so they are not greasy in the cupholder. The canister reseals, which a bag never really does.' },
  { id: 'gs-1010', sku: 'SNK-GUM-010', barcode: '0490112340109', title: 'FreshBake Spearmint Gum', brand: 'SweetPeak', departmentSlug: 'snacks', categorySlug: 'gum-mints', unit: '15-stick pack', price: 1.49, stock: 420, lowStockAt: 80, rating: 4.3, reviews: 760, art: 'gum', hue: 175, tags: ['impulse', 'checkout'], bullets: ['Sugar free, sweetened with xylitol', '15 sticks per pack', 'Long-lasting spearmint', 'Helps neutralise mouth acid'], description: 'Sugar-free spearmint that keeps its flavour past the first minute. Fifteen sticks in a slim pack that fits a shirt pocket.' },
  { id: 'gs-1011', sku: 'BAK-DNT-011', barcode: '0490112340116', title: 'FreshBake Glazed Donut', brand: 'FreshBake', departmentSlug: 'bakery', categorySlug: 'fresh-bakery', unit: 'each', price: 1.29, stock: 9, lowStockAt: 12, rating: 4.6, reviews: 2240, art: 'donut', hue: 25, tags: ['fresh-daily', 'hot'], bullets: ['Baked fresh on site each morning', 'Classic sugar glaze', 'Buy 6 and get the 7th free', 'Best eaten same day'], description: 'Made on site before opening, not shipped in frozen. Sells out most mornings by nine, which tells you what you need to know.' },
  { id: 'gs-1012', sku: 'BAK-SND-012', barcode: '0490112340123', title: 'HotStop Breakfast Sandwich — Egg & Cheese', brand: 'HotStop', departmentSlug: 'bakery', categorySlug: 'hot-food', unit: 'each', price: 4.49, listPrice: 5.49, stock: 6, lowStockAt: 8, rating: 4.3, reviews: 1610, art: 'sandwich', hue: 40, tags: ['hot', 'breakfast'], bullets: ['Cage-free egg with melted cheddar', 'Served on a toasted English muffin', 'Ready hot from 5am to 11am', 'Add bacon or sausage at the counter'], description: 'Hot from five in the morning. Cage-free egg and real cheddar on a toasted muffin — it holds together in one hand while you drive.' },
  { id: 'gs-1013', sku: 'BAK-HTD-013', barcode: '0490112340130', title: 'HotStop Roller Grill Hot Dog', brand: 'HotStop', departmentSlug: 'bakery', categorySlug: 'hot-food', unit: 'each', price: 2.99, stock: 34, lowStockAt: 10, rating: 4.1, reviews: 2890, art: 'hotdog', hue: 15, tags: ['hot', 'all-day'], bullets: ['All-beef frank', 'Free toppings bar', 'Available all day, every day', 'Two for $5 deal'], description: 'All-beef frank off the roller, with the toppings bar included. Two for five dollars if you are feeding someone else.' },
  { id: 'gs-1014', sku: 'BAK-MUF-014', barcode: '0490112340147', title: 'FreshBake Blueberry Muffin', brand: 'FreshBake', departmentSlug: 'bakery', categorySlug: 'fresh-bakery', unit: 'each', price: 2.19, stock: 0, lowStockAt: 10, rating: 4.4, reviews: 870, art: 'muffin', hue: 280, tags: ['fresh-daily'], bullets: ['Real blueberries, not flavoured pieces', 'Baked on site daily', 'Individually wrapped', 'Warms well in 15 seconds'], description: 'Baked on site with real blueberries — you can see them in the crumb. Fifteen seconds in the microwave brings it back to fresh.' },
  { id: 'gs-1015', sku: 'GRO-DRY-015', barcode: '0490112340154', title: 'Meadowvale Whole Milk', brand: 'Meadowvale', departmentSlug: 'grocery', categorySlug: 'dairy', unit: '1 gallon', price: 4.29, stock: 42, lowStockAt: 12, rating: 4.6, reviews: 1440, art: 'milk', hue: 200, tags: ['chilled', 'essential'], bullets: ['Grade A whole milk', 'From local dairies within 100 miles', 'Keep refrigerated', 'Vitamin D fortified'], description: 'Grade A whole milk from dairies inside a hundred miles, so it arrives with plenty of date left on it.' },
  { id: 'gs-1016', sku: 'GRO-DRY-016', barcode: '0490112340161', title: 'Meadowvale Large Eggs', brand: 'Meadowvale', departmentSlug: 'grocery', categorySlug: 'dairy', unit: 'dozen', price: 3.99, listPrice: 4.79, stock: 38, lowStockAt: 12, rating: 4.5, reviews: 1020, art: 'eggs', hue: 45, tags: ['chilled', 'essential'], bullets: ['Grade A large, cage-free', 'Dozen in a recycled pulp carton', 'Keep refrigerated', 'Candled and graded on farm'], description: 'Cage-free grade A large eggs in a pulp carton that composts. The one thing everyone forgets until they are already home.' },
  { id: 'gs-1017', sku: 'GRO-BRD-017', barcode: '0490112340178', title: 'FreshBake Sliced White Bread', brand: 'FreshBake', departmentSlug: 'grocery', categorySlug: 'pantry', unit: '20 oz loaf', price: 2.99, stock: 56, lowStockAt: 16, rating: 4.2, reviews: 690, art: 'bread', hue: 35, tags: ['essential'], bullets: ['Soft sandwich loaf, 20 slices', 'No high-fructose corn syrup', 'Baked within 24 hours of delivery', 'Freezes well'], description: 'A plain soft sandwich loaf without the corn syrup most cheap bread carries. Twenty slices, so eighteen sandwiches and two heels nobody wants.' },
  { id: 'gs-1018', sku: 'GRO-PAN-018', barcode: '0490112340185', title: 'PantryCo Instant Ramen — Chicken', brand: 'PantryCo', departmentSlug: 'grocery', categorySlug: 'pantry', unit: '3 oz cup', price: 1.29, stock: 180, lowStockAt: 40, rating: 4.0, reviews: 1520, art: 'soup', hue: 30, tags: ['shelf-stable', 'hot-water'], bullets: ['Ready in 3 minutes with hot water', 'Free hot water at the coffee station', 'Fork included under the lid', 'Shelf stable for 12 months'], description: 'Three minutes and hot water, which we give away free at the coffee station. The fork is under the lid so you are not stuck in the car without one.' },
  { id: 'gs-1019', sku: 'GRO-FRZ-019', barcode: '0490112340192', title: 'FrostLine Vanilla Ice Cream Pint', brand: 'FrostLine', departmentSlug: 'grocery', categorySlug: 'frozen', unit: '1 pint', price: 5.49, listPrice: 6.99, stock: 7, lowStockAt: 10, rating: 4.7, reviews: 1340, art: 'iceCream', hue: 300, tags: ['frozen'], bullets: ['Made with real vanilla bean', '14% butterfat — a true premium base', 'Pint size', 'Keep frozen'], description: 'Real vanilla bean and a 14% butterfat base, which is what separates premium from the airy stuff. You can see the seeds in it.' },
  { id: 'gs-1020', sku: 'AUT-OIL-020', barcode: '0490112340208', title: 'MotorMax Full Synthetic Motor Oil 5W-30', brand: 'MotorMax', departmentSlug: 'automotive', categorySlug: 'fluids', unit: '5 quart jug', price: 27.99, listPrice: 34.99, stock: 22, lowStockAt: 6, rating: 4.7, reviews: 2140, art: 'oil', hue: 200, tags: ['bulk'], bullets: ['Full synthetic, API SP rated', 'Protects up to 10,000 miles between changes', 'Suits most petrol engines needing 5W-30', '5 quart jug with a pour spout'], description: 'Full synthetic rated to the current API SP standard, in the five-quart jug that covers most oil changes in one go.' },
  { id: 'gs-1021', sku: 'AUT-WIP-021', barcode: '0490112340215', title: 'DriveTech All-Season Wiper Blade 22"', brand: 'DriveTech', departmentSlug: 'automotive', categorySlug: 'car-accessories', unit: 'each', price: 14.99, stock: 5, lowStockAt: 8, rating: 4.3, reviews: 880, art: 'wiper', hue: 210, tags: [], bullets: ['22-inch beam blade, no exposed frame', 'Graphite-coated rubber for quiet wiping', 'Fits most J-hook wiper arms', 'Tool-free install in about a minute'], description: 'A beam-style blade with no frame to pack with ice. Clips onto standard J-hook arms without tools — about a minute a side.' },
  { id: 'gs-1022', sku: 'AUT-FLD-022', barcode: '0490112340222', title: 'MotorMax Windshield Washer Fluid', brand: 'MotorMax', departmentSlug: 'automotive', categorySlug: 'fluids', unit: '1 gallon', price: 4.49, stock: 64, lowStockAt: 16, rating: 4.4, reviews: 610, art: 'coolant', hue: 195, tags: [], bullets: ['Effective to -20°F', 'Cuts bug splatter and road film', 'Safe on paint and rubber trim', '1 gallon jug'], description: 'Rated to twenty below, so it will not freeze in the reservoir and split it. Cuts road film without leaving a smear.' },
  { id: 'gs-1023', sku: 'AUT-ACC-023', barcode: '0490112340239', title: 'DriveTech 30W USB-C Car Charger', brand: 'DriveTech', departmentSlug: 'automotive', categorySlug: 'car-accessories', unit: 'each', price: 16.99, listPrice: 22.99, stock: 44, lowStockAt: 12, rating: 4.5, reviews: 1290, art: 'phoneCharger', hue: 220, tags: ['electronics'], bullets: ['30W USB-C Power Delivery plus 12W USB-A', 'Charges most phones to 50% in 30 minutes', 'Built-in surge protection', 'Fits standard 12V sockets'], description: 'Thirty watts over USB-C, which is enough to fast charge a phone rather than just holding it steady while the map runs.' },
  { id: 'gs-1024', sku: 'AUT-ACC-024', barcode: '0490112340246', title: 'DriveTech Air Freshener — Black Ice', brand: 'DriveTech', departmentSlug: 'automotive', categorySlug: 'car-accessories', unit: '3-pack', price: 3.99, stock: 120, lowStockAt: 30, rating: 4.2, reviews: 2010, art: 'airFreshener', hue: 250, tags: ['impulse'], bullets: ['Three hanging fresheners per pack', 'Lasts around 30 days each', 'Adjustable-release sleeve', 'Classic cool fragrance'], description: 'Three to a pack with a sleeve you slide down to control how strong it is — pull it all the way out on day one and it is gone in a week.' },
  { id: 'gs-1025', sku: 'HOU-CLN-025', barcode: '0490112340253', title: 'PureHome Multi-Surface Cleaner', brand: 'PureHome', departmentSlug: 'household', categorySlug: 'cleaning', unit: '28 fl oz spray', price: 4.79, stock: 58, lowStockAt: 15, rating: 4.4, reviews: 720, art: 'cleaner', hue: 165, tags: [], bullets: ['Safe on sealed counters, glass and stainless', 'Plant-derived surfactants', 'No bleach or ammonia', '28 fl oz trigger spray'], description: 'One bottle for counters, glass and stainless, without the ammonia smell that lingers for an hour afterwards.' },
  { id: 'gs-1026', sku: 'HOU-PPR-026', barcode: '0490112340260', title: 'SoftFold Paper Towels 6-Roll', brand: 'SoftFold', departmentSlug: 'household', categorySlug: 'paper-goods', unit: '6 mega rolls', price: 11.99, listPrice: 14.99, stock: 36, lowStockAt: 10, rating: 4.5, reviews: 1180, art: 'paperTowel', hue: 150, tags: ['bulk'], bullets: ['Six mega rolls, equal to 15 regular', '2-ply with a select-a-size sheet', 'Strong when wet', 'Made from responsibly sourced fibre'], description: 'Six mega rolls that work out to about fifteen regular ones. Half-sheet perforation means you are not wasting a full sheet on a small spill.' },
  { id: 'gs-1027', sku: 'HOU-BAT-027', barcode: '0490112340277', title: 'PowerCell AA Alkaline Batteries 8-Pack', brand: 'PowerCell', departmentSlug: 'household', categorySlug: 'batteries', unit: '8-pack', price: 9.49, stock: 92, lowStockAt: 24, rating: 4.6, reviews: 1560, art: 'battery', hue: 55, tags: ['essential'], bullets: ['Eight AA alkaline cells', '10-year shelf life in storage', 'Leak-resistant construction', 'Suits remotes, toys and torches'], description: 'Eight AA cells with a ten-year shelf life, so a spare pack in the drawer will still work when you finally need it.' },
  { id: 'gs-1028', sku: 'HOU-DET-028', barcode: '0490112340284', title: 'PureHome Laundry Detergent Pods 20ct', brand: 'PureHome', departmentSlug: 'household', categorySlug: 'cleaning', unit: '20 pods', price: 8.99, stock: 40, lowStockAt: 12, rating: 4.3, reviews: 830, art: 'detergent', hue: 210, tags: [], bullets: ['20 pre-measured pods', 'Works in hot and cold water', 'HE machine compatible', 'Child-resistant tub'], description: 'Pre-measured pods that dissolve in cold water, which most cheap ones do not — you find the shell stuck to a sleeve afterwards.' },
  { id: 'gs-1029', sku: 'MED-PAI-029', barcode: '0490112340291', title: 'ReliefRx Ibuprofen 200mg', brand: 'ReliefRx', departmentSlug: 'medicine', categorySlug: 'pain-relief', unit: '24 tablets', price: 6.49, stock: 70, lowStockAt: 18, rating: 4.6, reviews: 1410, art: 'pills', hue: 190, tags: ['otc'], bullets: ['200mg ibuprofen per coated tablet', 'For headache, muscle ache and fever', '24 tablets in a sealed bottle', 'Read the label before use'], description: 'Standard 200mg ibuprofen in a 24-count bottle. Coated tablets, which go down easier than the chalky uncoated kind.' },
  { id: 'gs-1030', sku: 'MED-FST-030', barcode: '0490112340307', title: 'MediKit Adhesive Bandages Variety Pack', brand: 'MediKit', departmentSlug: 'medicine', categorySlug: 'first-aid', unit: '40 count', price: 4.99, stock: 84, lowStockAt: 20, rating: 4.5, reviews: 640, art: 'bandage', hue: 210, tags: ['otc'], bullets: ['40 bandages across four sizes', 'Flexible fabric that moves with skin', 'Sterile until opened', 'Latex free'], description: 'Forty bandages in four sizes, on flexible fabric rather than plastic so they stay on knuckles and knees.' },
  { id: 'gs-1031', sku: 'MED-PER-031', barcode: '0490112340314', title: 'DailyCare Hand Sanitizer Gel', brand: 'DailyCare', departmentSlug: 'medicine', categorySlug: 'personal-care', unit: '8 fl oz', price: 3.49, stock: 110, lowStockAt: 25, rating: 4.4, reviews: 980, art: 'sanitizer', hue: 175, tags: ['otc'], bullets: ['70% ethyl alcohol', 'Kills 99.9% of common germs', 'Aloe and vitamin E to reduce drying', '8 fl oz pump bottle'], description: 'Seventy percent alcohol, which is the level that actually works, with aloe added so your hands are not cracked by Wednesday.' },
  { id: 'gs-1032', sku: 'MED-PER-032', barcode: '0490112340321', title: 'DailyCare Travel Toothpaste', brand: 'DailyCare', departmentSlug: 'medicine', categorySlug: 'personal-care', unit: '0.85 oz', price: 2.29, stock: 96, lowStockAt: 24, rating: 4.2, reviews: 410, art: 'toothpaste', hue: 180, tags: ['travel'], bullets: ['Fluoride toothpaste, cavity protection', 'TSA carry-on approved size', 'Fresh mint', '0.85 oz travel tube'], description: 'Carry-on sized fluoride toothpaste for the trip you packed for in a hurry. Fits the liquids bag without argument.' },
  { id: 'gs-1033', sku: 'TOB-CIG-033', barcode: '0490112340338', title: 'Summit Original Cigarettes', brand: 'Summit', departmentSlug: 'tobacco', categorySlug: 'cigarettes', unit: 'pack of 20', price: 9.99, stock: 60, lowStockAt: 15, rating: 3.9, reviews: 240, art: 'cigarettes', hue: 15, ageRestricted: true, tags: ['age-restricted', 'id-required'], bullets: ['Pack of 20', 'Photo ID required — 21 and over', 'Not eligible for delivery in all areas', 'Sold from behind the counter'], description: 'Sold from behind the counter. Photo ID is required at handover for anyone appearing under 40, without exception.' },
  { id: 'gs-1034', sku: 'TOB-LTR-034', barcode: '0490112340345', title: 'FlameCo Refillable Lighter', brand: 'FlameCo', departmentSlug: 'tobacco', categorySlug: 'lighters', unit: 'each', price: 2.49, stock: 140, lowStockAt: 30, rating: 4.1, reviews: 520, art: 'lighter', hue: 10, ageRestricted: true, tags: ['age-restricted', 'impulse'], bullets: ['Adjustable flame height', 'Refillable with standard butane', 'Child-resistant mechanism', 'Photo ID required — 18 and over'], description: 'Refillable rather than disposable, with an adjustable flame. Child-resistant catch as required by law.' },
  { id: 'gs-1035', sku: 'PET-FUD-035', barcode: '0490112340352', title: 'PawPantry Complete Dry Dog Food', brand: 'PawPantry', departmentSlug: 'pet-supplies', categorySlug: 'pet-food', unit: '4 lb bag', price: 12.99, listPrice: 15.99, stock: 26, lowStockAt: 8, rating: 4.5, reviews: 780, art: 'petFood', hue: 100, tags: ['bulk'], bullets: ['Real chicken as the first ingredient', 'Complete and balanced for adult dogs', 'No corn, wheat or soy fillers', '4 lb resealable bag'], description: 'Chicken first on the ingredient list rather than corn, and complete-and-balanced certified for adult dogs. The bag reseals.' },
  { id: 'gs-1036', sku: 'PET-TRT-036', barcode: '0490112340369', title: 'PawPantry Dental Chew Treats', brand: 'PawPantry', departmentSlug: 'pet-supplies', categorySlug: 'pet-treats', unit: '12 chews', price: 8.49, stock: 48, lowStockAt: 12, rating: 4.6, reviews: 1090, art: 'petTreat', hue: 85, tags: [], bullets: ['Ridged texture helps reduce plaque', '12 chews per pack', 'For dogs over 20 lb', 'No artificial colours'], description: 'Ridged chews that scrape plaque while the dog works on them. Twelve to a pack, sized for dogs over twenty pounds.' },
];

async function main() {
  for (const d of departments) {
    await prisma.department.upsert({ where: { slug: d.slug }, update: d, create: d });
  }

  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }

  for (const p of products) {
    await prisma.product.upsert({ where: { id: p.id }, update: p, create: p });
  }

  const store = await prisma.storeLocation.upsert({
    where: { id: 'store-001' },
    update: {},
    create: {
      id: 'store-001',
      name: 'SMA Fuel & Market — Riverside',
      address: '1420 Riverside Parkway',
      city: 'Riverside',
      phone: '(555) 018-4420',
      lat: 33.9806,
      lng: -117.3755,
      radiusMiles: 2,
      hours: 'Open 24 hours',
    },
  });

  const fuelPrices = [
    { grade: 'Regular', price: 3.49 },
    { grade: 'Plus', price: 3.79 },
    { grade: 'Premium', price: 4.09 },
    { grade: 'Diesel', price: 3.95 },
  ];
  await prisma.fuelPrice.deleteMany({ where: { storeId: store.id } });
  for (const f of fuelPrices) {
    await prisma.fuelPrice.create({ data: { ...f, storeId: store.id } });
  }

  const adminEmail = 'admin@smafuel.market';
  const adminPassword = 'admin123';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      name: 'Store Admin',
      role: 'ADMIN',
    },
  });

  /*
   * Promotions. Seeded by a stable id so re-running the seed updates the same
   * rows rather than stacking up duplicate deals on every run. Product ids are
   * filtered against what actually exists, so a deal referencing a product that
   * was removed still seeds — just with a shorter product list.
   */
  const seedDeals = [
    {
      id: 'deal-flash-coffee',
      kind: 'flash' as const,
      title: 'Coffee & donut for $3',
      detail: 'Any large fresh brew with a glazed donut. Today only, while stocks last.',
      productIds: ['gs-1004', 'gs-1011'],
      endsInHours: 6,
    },
    {
      id: 'deal-bogo-hotdog',
      kind: 'bogo' as const,
      title: '2 roller grill hot dogs for $5',
      detail: 'Mix and match any two hot dogs from the roller grill.',
      productIds: ['gs-1013'],
    },
    {
      id: 'deal-percent-energy',
      kind: 'percent' as const,
      title: '20% off all energy drinks',
      detail: 'Every energy can in the cooler, no limit.',
      productIds: ['gs-1002'],
      percentOff: 20,
    },
    {
      id: 'deal-weekend-snacks',
      kind: 'weekend' as const,
      title: 'Weekend snack bundle — 25% off',
      detail: 'Chips, jerky and nuts. Friday through Sunday.',
      productIds: ['gs-1006', 'gs-1008', 'gs-1009'],
      percentOff: 25,
    },
  ];

  for (const { productIds, ...deal } of seedDeals) {
    const existing = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    const connect = existing.map((p) => ({ id: p.id }));

    await prisma.deal.upsert({
      where: { id: deal.id },
      update: { ...deal, products: { set: connect } },
      create: { ...deal, products: { connect } },
    });
  }

  /*
   * Home page content. Seeded from what used to be hardcoded in the storefront
   * so the page looks identical the first time it reads from the database, and
   * every part of it is editable from the admin panel afterwards.
   */
  const heroSlides = [
    {
      id: 'hero-delivery',
      sortOrder: 0,
      eyebrow: 'Open 24 hours · Delivered in 30 minutes',
      title: 'The whole store,\nbrought to your door',
      blurb:
        'Snacks, drinks, hot food and everything else on the shelf. Ordered now, on your doorstep in about half an hour.',
      badgeBig: '30',
      badgeSmall: 'MINUTE DELIVERY',
      ctaLabel: 'Start shopping',
      ctaHref: '/shop',
      accent: '#00b04f',
      tileImages: [] as string[],
      fallbackArt: ['coffee', 'donut', 'soda', 'chips'],
    },
    {
      id: 'hero-breakfast',
      sortOrder: 1,
      eyebrow: 'Breakfast served from 5am',
      title: "Your morning's\nplus-one",
      blurb:
        'Grab a breakfast sandwich, hash browns and a coffee before the day gets going. Hot from 5am, every day.',
      badgeBig: '$4',
      badgeSmall: 'BREAKFAST BUNDLE',
      ctaLabel: 'Shop the bakery',
      ctaHref: '/department/bakery',
      accent: '#f37021',
      tileImages: [] as string[],
      fallbackArt: ['sandwich', 'muffin', 'hotdog', 'coffee'],
    },
    {
      id: 'hero-automotive',
      sortOrder: 2,
      eyebrow: 'Everything for the road',
      title: 'Automotive kit\nwithout the detour',
      blurb:
        'Oil, wipers, washer fluid and chargers. The aisle you actually need, without a second stop.',
      badgeBig: '24/7',
      badgeSmall: 'ON THE ROAD',
      ctaLabel: 'Shop automotive',
      ctaHref: '/department/automotive',
      accent: '#2f7fe0',
      tileImages: [] as string[],
      fallbackArt: ['oil', 'wiper', 'phoneCharger', 'coolant'],
    },
    {
      id: 'hero-fuel',
      sortOrder: 3,
      eyebrow: 'Regular $3.49/gal today',
      title: 'Fill up, then\nfill the basket',
      blurb:
        'Today’s pump price is locked in. Add the snacks while you are here and skip the queue inside.',
      badgeBig: '24h',
      badgeSmall: 'FUEL + MARKET',
      ctaLabel: "See today's deals",
      ctaHref: '/deals',
      accent: '#ee1c25',
      tileImages: [] as string[],
      fallbackArt: ['energy', 'candy', 'jerky', 'gum'],
    },
  ];

  for (const slide of heroSlides) {
    await prisma.heroSlide.upsert({
      where: { id: slide.id },
      update: slide,
      create: slide,
    });
  }

  const showcaseCards = [
    {
      id: 'card-breakfast',
      sortOrder: 0,
      title: 'Breakfast, served early',
      linkLabel: 'Shop the bakery',
      linkHref: '/department/bakery',
      variant: 'grid',
      tiles: [
        { label: 'Fresh coffee', href: '/department/bakery', imageUrl: null, art: 'coffee', hue: 25 },
        { label: 'Donuts & muffins', href: '/department/bakery', imageUrl: null, art: 'donut', hue: 25 },
        { label: 'Breakfast sandwiches', href: '/department/bakery', imageUrl: null, art: 'sandwich', hue: 40 },
        { label: 'Juice & milk', href: '/department/drinks', imageUrl: null, art: 'juice', hue: 35 },
      ],
    },
    {
      id: 'card-snacks',
      sortOrder: 1,
      title: 'Snacks for the road',
      linkLabel: 'Shop all snacks',
      linkHref: '/department/snacks',
      variant: 'grid',
      tiles: [
        { label: 'Chips & crisps', href: '/department/snacks', imageUrl: null, art: 'chips', hue: 45 },
        { label: 'Candy & chocolate', href: '/department/snacks', imageUrl: null, art: 'chocolate', hue: 20 },
        { label: 'Jerky & nuts', href: '/department/snacks', imageUrl: null, art: 'jerky', hue: 20 },
        { label: 'Gum & mints', href: '/department/snacks', imageUrl: null, art: 'gum', hue: 175 },
      ],
    },
    {
      id: 'card-automotive',
      sortOrder: 2,
      title: 'Keep the car happy',
      linkLabel: 'Shop automotive',
      linkHref: '/department/automotive',
      variant: 'grid',
      tiles: [
        { label: 'Motor oil', href: '/department/automotive', imageUrl: null, art: 'oil', hue: 200 },
        { label: 'Wiper blades', href: '/department/automotive', imageUrl: null, art: 'wiper', hue: 210 },
        { label: 'Chargers', href: '/department/automotive', imageUrl: null, art: 'phoneCharger', hue: 220 },
        { label: 'Washer fluid', href: '/department/automotive', imageUrl: null, art: 'coolant', hue: 195 },
      ],
    },
    {
      id: 'card-household',
      sortOrder: 3,
      title: 'Household essentials',
      linkLabel: 'Shop household',
      linkHref: '/department/household',
      variant: 'grid',
      tiles: [
        { label: 'Cleaning', href: '/department/household', imageUrl: null, art: 'cleaner', hue: 165 },
        { label: 'Paper goods', href: '/department/household', imageUrl: null, art: 'paperTowel', hue: 150 },
        { label: 'Batteries', href: '/department/household', imageUrl: null, art: 'battery', hue: 55 },
        { label: 'Pain relief', href: '/department/medicine', imageUrl: null, art: 'pills', hue: 190 },
      ],
    },
  ];

  showcaseCards.push(
    {
      id: 'card-dairy',
      sortOrder: 4,
      title: 'Forgot the milk?',
      linkLabel: 'Shop grocery',
      linkHref: '/department/grocery',
      variant: 'single',
      tiles: [
        { label: 'Dairy', href: '/department/grocery', imageUrl: null, art: 'milk', hue: 200 },
      ],
    },
    {
      id: 'card-pet',
      sortOrder: 5,
      title: 'For the dog in the back seat',
      linkLabel: 'Shop pet supplies',
      linkHref: '/department/pet-supplies',
      variant: 'single',
      tiles: [
        { label: 'Pet supplies', href: '/department/pet-supplies', imageUrl: null, art: 'petFood', hue: 100 },
      ],
    },
    {
      id: 'card-pharmacy',
      sortOrder: 6,
      title: 'Pharmacy & first aid',
      linkLabel: 'Shop medicine',
      linkHref: '/department/medicine',
      variant: 'grid',
      tiles: [
        { label: 'Pain relief', href: '/department/medicine', imageUrl: null, art: 'pills', hue: 190 },
        { label: 'First aid', href: '/department/medicine', imageUrl: null, art: 'bandage', hue: 210 },
        { label: 'Sanitiser', href: '/department/medicine', imageUrl: null, art: 'sanitizer', hue: 175 },
        { label: 'Travel size', href: '/department/medicine', imageUrl: null, art: 'toothpaste', hue: 180 },
      ],
    },
  );

  for (const card of showcaseCards) {
    await prisma.showcaseCard.upsert({
      where: { id: card.id },
      update: card,
      create: card,
    });
  }

  console.log(`Seeded ${departments.length} departments, ${categories.length} categories, ${products.length} products.`);
  console.log(`Seeded ${seedDeals.length} deals.`);
  console.log(`Seeded ${heroSlides.length} hero slides and ${showcaseCards.length} showcase cards.`);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
