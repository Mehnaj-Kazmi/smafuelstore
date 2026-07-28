import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import ShowcaseCard from "@/components/ShowcaseCard";
import ProductRail from "@/components/ProductRail";
import ProductArt from "@/components/ProductArt";
import FuelPrices from "@/components/FuelPrices";
import Ticker from "@/components/Ticker";
import Reveal from "@/components/Reveal";
import WordReveal from "@/components/WordReveal";
import { byDepartment, departments, stockState } from "@/lib/catalog";
import { getCatalogProducts } from "@/lib/catalog-source";
import { getHeroSlides, getShowcaseCards } from "@/lib/home-content";
import { dealProducts } from "@/lib/deals";

const tickerItems = [
  "Open 24 hours",
  "Delivery in 30 minutes",
  "Hot food from 5am",
  "Fuel + market in one stop",
  "Free delivery over $35",
];

export default async function HomePage() {
  const [products, heroSlides, showcaseCards] = await Promise.all([
    getCatalogProducts(),
    getHeroSlides(),
    getShowcaseCards(),
  ]);

  /* The first three cards sit beside the fuel panel; anything the admin adds
     beyond that flows into the second grid further down the page. */
  const topCards = showcaseCards.slice(0, 3);
  const moreCards = showcaseCards.slice(3);
  const deals = dealProducts(products);
  const hotFood = byDepartment("bakery", products);
  const drinks = byDepartment("drinks", products);
  const essentials = products.filter((p) => p.tags.includes("essential") || p.tags.includes("impulse"));
  const lowStock = products.filter((p) => stockState(p) === "low").slice(0, 10);

  return (
    <>
      <HeroCarousel slides={heroSlides} />
      <Ticker items={tickerItems} />

      <div className="mx-auto max-w-[1500px] space-y-16 px-4 py-14 sm:px-6 lg:px-10">
        <Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {topCards.map((card) => (
              <ShowcaseCard
                key={card.id}
                title={card.title}
                tiles={card.tiles}
                linkLabel={card.linkLabel}
                linkHref={card.linkHref}
                variant={card.variant}
              />
            ))}
            <FuelPrices />
          </div>
        </Reveal>

        <Reveal>
          <ProductRail title="Today's deals" products={deals} seeAllHref="/deals" seeAllLabel="See all deals" />
        </Reveal>

        <Reveal>
          <ProductRail title="Hot food & fresh bakery" products={hotFood} seeAllHref="/department/bakery" />
        </Reveal>

        <Reveal>
          <section>
            <WordReveal
              as="h2"
              text="Shop by department"
              className="mb-6 text-[22px] font-extrabold tracking-tight text-white sm:text-[26px]"
            />
            <div className="grid grid-cols-3 gap-5 sm:grid-cols-5 lg:grid-cols-9">
              {departments.map((d, i) => (
                <Reveal key={d.slug} delay={i * 45}>
                  <Link href={`/department/${d.slug}`} className="group block text-center">
                    <div className="overflow-hidden rounded-full border border-line bg-surface transition-colors duration-300 group-hover:border-brand-green">
                      <ProductArt
                        art={d.art}
                        hue={d.hue}
                        className="aspect-square w-full transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <p className="mt-2.5 text-[13px] font-semibold text-ink-soft transition-colors group-hover:text-brand-green">
                      {d.name}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <ProductRail title="Cold drinks" products={drinks} seeAllHref="/department/drinks" />
        </Reveal>

        {moreCards.length > 0 && (
          <Reveal>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {moreCards.map((card) => (
                <ShowcaseCard
                  key={card.id}
                  title={card.title}
                  tiles={card.tiles}
                  linkLabel={card.linkLabel}
                  linkHref={card.linkHref}
                  variant={card.variant}
                />
              ))}
            </div>
          </Reveal>
        )}

        <Reveal>
          <ProductRail title="Everyday essentials" products={essentials} seeAllHref="/shop" />
        </Reveal>

        {lowStock.length > 0 && (
          <Reveal>
            <ProductRail title="Selling fast — low stock" products={lowStock} seeAllHref="/shop" />
          </Reveal>
        )}
      </div>
    </>
  );
}
