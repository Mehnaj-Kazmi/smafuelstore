import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import ShowcaseCard, { type Tile } from "@/components/ShowcaseCard";
import ProductRail from "@/components/ProductRail";
import ProductArt from "@/components/ProductArt";
import FuelPrices from "@/components/FuelPrices";
import { byDepartment, departments, products, stockState } from "@/lib/catalog";
import { dealProducts } from "@/lib/deals";

const breakfastTiles: Tile[] = [
  { label: "Fresh coffee", href: "/department/bakery", art: "coffee", hue: 25 },
  { label: "Donuts & muffins", href: "/department/bakery", art: "donut", hue: 25 },
  { label: "Breakfast sandwiches", href: "/department/bakery", art: "sandwich", hue: 40 },
  { label: "Juice & milk", href: "/department/drinks", art: "juice", hue: 35 },
];

const snackTiles: Tile[] = [
  { label: "Chips & crisps", href: "/department/snacks", art: "chips", hue: 45 },
  { label: "Candy & chocolate", href: "/department/snacks", art: "chocolate", hue: 20 },
  { label: "Jerky & nuts", href: "/department/snacks", art: "jerky", hue: 20 },
  { label: "Gum & mints", href: "/department/snacks", art: "gum", hue: 175 },
];

const roadTiles: Tile[] = [
  { label: "Motor oil", href: "/department/automotive", art: "oil", hue: 200 },
  { label: "Wiper blades", href: "/department/automotive", art: "wiper", hue: 210 },
  { label: "Chargers", href: "/department/automotive", art: "phoneCharger", hue: 220 },
  { label: "Washer fluid", href: "/department/automotive", art: "coolant", hue: 195 },
];

const homeTiles: Tile[] = [
  { label: "Cleaning", href: "/department/household", art: "cleaner", hue: 165 },
  { label: "Paper goods", href: "/department/household", art: "paperTowel", hue: 150 },
  { label: "Batteries", href: "/department/household", art: "battery", hue: 55 },
  { label: "Pain relief", href: "/department/medicine", art: "pills", hue: 190 },
];

export default function HomePage() {
  const deals = dealProducts();
  const hotFood = byDepartment("bakery");
  const drinks = byDepartment("drinks");
  const essentials = products.filter((p) => p.tags.includes("essential") || p.tags.includes("impulse"));
  const lowStock = products.filter((p) => stockState(p) === "low").slice(0, 10);

  return (
    <>
      <HeroCarousel />

      <div className="relative z-10 mx-auto -mt-16 max-w-[1500px] px-3 sm:-mt-24 lg:-mt-28">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <ShowcaseCard title="Breakfast, served early" tiles={breakfastTiles} linkLabel="Shop the bakery" linkHref="/department/bakery" />
          <ShowcaseCard title="Snacks for the road" tiles={snackTiles} linkLabel="Shop all snacks" linkHref="/department/snacks" />
          <ShowcaseCard title="Keep the car happy" tiles={roadTiles} linkLabel="Shop automotive" linkHref="/department/automotive" />
          <FuelPrices />
        </div>

        <div className="mt-5">
          <ProductRail title="Today's deals" products={deals} seeAllHref="/deals" seeAllLabel="See all deals" />
        </div>

        <div className="mt-5">
          <ProductRail title="Hot food & fresh bakery" products={hotFood} seeAllHref="/department/bakery" />
        </div>

        <section className="mt-5 bg-white p-5">
          <h2 className="mb-4 text-[21px] font-bold">Shop by department</h2>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-9">
            {departments.map((d) => (
              <Link key={d.slug} href={`/department/${d.slug}`} className="group text-center">
                <div className="overflow-hidden rounded-full">
                  <ProductArt art={d.art} hue={d.hue} className="aspect-square w-full transition-transform duration-300 group-hover:scale-105" />
                </div>
                <p className="mt-2 text-[13px] font-medium group-hover:text-sma-link-hover">{d.name}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-5">
          <ProductRail title="Cold drinks" products={drinks} seeAllHref="/department/drinks" />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <ShowcaseCard title="Household essentials" tiles={homeTiles} linkLabel="Shop household" linkHref="/department/household" />
          <ShowcaseCard title="Forgot the milk?" tiles={[{ label: "Dairy", href: "/department/grocery", art: "milk", hue: 200 }]} variant="single" linkLabel="Shop grocery" linkHref="/department/grocery" />
          <ShowcaseCard title="For the dog in the back seat" tiles={[{ label: "Pet supplies", href: "/department/pet-supplies", art: "petFood", hue: 100 }]} variant="single" linkLabel="Shop pet supplies" linkHref="/department/pet-supplies" />
          <ShowcaseCard
            title="Pharmacy & first aid"
            tiles={[
              { label: "Pain relief", href: "/department/medicine", art: "pills", hue: 190 },
              { label: "First aid", href: "/department/medicine", art: "bandage", hue: 210 },
              { label: "Sanitiser", href: "/department/medicine", art: "sanitizer", hue: 175 },
              { label: "Travel size", href: "/department/medicine", art: "toothpaste", hue: 180 },
            ]}
            linkLabel="Shop medicine"
            linkHref="/department/medicine"
          />
        </div>

        <div className="mt-5">
          <ProductRail title="Everyday essentials" products={essentials} seeAllHref="/shop" />
        </div>

        {lowStock.length > 0 && (
          <div className="mt-5 pb-6">
            <ProductRail title="Selling fast — low stock" products={lowStock} seeAllHref="/shop" />
          </div>
        )}
      </div>
    </>
  );
}
