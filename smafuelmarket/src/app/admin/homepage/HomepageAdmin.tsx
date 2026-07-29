"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Panel, Stat } from "@/components/admin/Ui";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { imageSrc } from "@/components/ProductImage";

type HeroSlide = {
  id: string;
  sortOrder: number;
  eyebrow: string;
  title: string;
  blurb: string;
  badgeBig: string;
  badgeSmall: string;
  ctaLabel: string;
  ctaHref: string;
  accent: string;
  tileImages: string[];
  fallbackArt: string[];
  active: boolean;
};

type ShowcaseTile = {
  label: string;
  href: string;
  imageUrl?: string | null;
  art: string;
  hue: number;
};

type Department = {
  slug: string;
  name: string;
  blurb: string;
  imageUrl: string | null;
  art: string;
  hue: number;
  sortOrder: number;
};

type ShowcaseCard = {
  id: string;
  sortOrder: number;
  title: string;
  linkLabel: string;
  linkHref: string;
  variant: string;
  tiles: ShowcaseTile[];
  active: boolean;
};

export default function HomepageAdmin() {
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);
  const [cards, setCards] = useState<ShowcaseCard[] | null>(null);
  const [departments, setDepartments] = useState<Department[] | null>(null);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, c, d] = await Promise.all([
        api.get<HeroSlide[]>("/home/hero-slides?includeInactive=true"),
        api.get<ShowcaseCard[]>("/home/showcase-cards?includeInactive=true"),
        api.get<Department[]>("/departments"),
      ]);
      setSlides(s);
      setCards(c);
      setDepartments(d);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load homepage content");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Local edit — nothing is sent until Save is pressed for that block. */
  function editSlide(id: string, patch: Partial<HeroSlide>) {
    setSlides((prev) => prev?.map((s) => (s.id === id ? { ...s, ...patch } : s)) ?? null);
    setSavedId(null);
  }

  function editCard(id: string, patch: Partial<ShowcaseCard>) {
    setCards((prev) => prev?.map((c) => (c.id === id ? { ...c, ...patch } : c)) ?? null);
    setSavedId(null);
  }

  function editTile(cardId: string, index: number, patch: Partial<ShowcaseTile>) {
    setCards(
      (prev) =>
        prev?.map((c) =>
          c.id === cardId
            ? { ...c, tiles: c.tiles.map((t, i) => (i === index ? { ...t, ...patch } : t)) }
            : c,
        ) ?? null,
    );
    setSavedId(null);
  }

  function editDepartment(slug: string, patch: Partial<Department>) {
    setDepartments((prev) => prev?.map((d) => (d.slug === slug ? { ...d, ...patch } : d)) ?? null);
    setSavedId(null);
  }

  async function saveDepartment(dept: Department) {
    setSavingId(dept.slug);
    setError("");
    try {
      await api.patch(`/departments/${dept.slug}`, {
        name: dept.name,
        blurb: dept.blurb,
        imageUrl: dept.imageUrl,
        art: dept.art,
        hue: dept.hue,
        sortOrder: dept.sortOrder,
      });
      setSavedId(dept.slug);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  }

  async function saveSlide(slide: HeroSlide) {
    setSavingId(slide.id);
    setError("");
    try {
      await api.patch(`/home/hero-slides/${slide.id}`, {
        eyebrow: slide.eyebrow,
        title: slide.title,
        blurb: slide.blurb,
        badgeBig: slide.badgeBig,
        badgeSmall: slide.badgeSmall,
        ctaLabel: slide.ctaLabel,
        ctaHref: slide.ctaHref,
        accent: slide.accent,
        tileImages: slide.tileImages,
        fallbackArt: slide.fallbackArt,
        active: slide.active,
        sortOrder: slide.sortOrder,
      });
      setSavedId(slide.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  }

  async function saveCard(card: ShowcaseCard) {
    setSavingId(card.id);
    setError("");
    try {
      await api.patch(`/home/showcase-cards/${card.id}`, {
        title: card.title,
        linkLabel: card.linkLabel,
        linkHref: card.linkHref,
        variant: card.variant,
        tiles: card.tiles,
        active: card.active,
        sortOrder: card.sortOrder,
      });
      setSavedId(card.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  }

  if (error && !slides) {
    return (
      <Panel title="Homepage">
        <p className="text-[13px] font-semibold text-sma-deal">{error}</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Hero slides" value={String(slides?.length ?? 0)} tone="good" />
        <Stat
          label="Slide photos set"
          value={String(slides?.reduce((n, s) => n + s.tileImages.filter(Boolean).length, 0) ?? 0)}
          sub={`of ${(slides?.length ?? 0) * 4} tiles`}
        />
        <Stat
          label="Department photos"
          value={String(departments?.filter((d) => d.imageUrl).length ?? 0)}
          sub={`of ${departments?.length ?? 0} departments`}
        />
        <Stat
          label="Card photos set"
          value={String(cards?.reduce((n, c) => n + c.tiles.filter((t) => t.imageUrl).length, 0) ?? 0)}
          sub={`of ${cards?.reduce((n, c) => n + c.tiles.length, 0) ?? 0} tiles`}
        />
      </div>

      {error && <p role="alert" className="text-[13px] font-semibold text-sma-deal">{error}</p>}

      <Panel title="Hero carousel">
        <p className="mb-5 text-[13px] text-ink-faint">
          The rotating banner at the top of the home page. Each slide has four floating tiles —
          upload a photo for any of them, or leave it empty to keep the drawn artwork. Backgrounds are removed automatically so the product sits directly on the slide.
        </p>

        {!slides ? (
          <p className="text-[13px] text-ink-faint">Loading…</p>
        ) : (
          <div className="space-y-5">
            {slides.map((slide) => (
              <div key={slide.id} className="rounded-xl border border-line bg-surface-2 p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span
                      className="h-6 w-6 shrink-0 rounded-md border border-line"
                      style={{ background: slide.accent }}
                      aria-hidden="true"
                    />
                    <strong className="text-white">{slide.title.split("\n")[0]}</strong>
                  </span>
                  <label className="flex items-center gap-2 text-[13px] text-ink-soft">
                    <input
                      type="checkbox"
                      checked={slide.active}
                      onChange={(e) => editSlide(slide.id, { active: e.target.checked })}
                    />
                    Show on site
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Eyebrow" value={slide.eyebrow} onChange={(v) => editSlide(slide.id, { eyebrow: v })} />
                  <Field label="Accent colour (hex)" value={slide.accent} onChange={(v) => editSlide(slide.id, { accent: v })} />

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">
                      Headline (use a new line to break it)
                    </label>
                    <textarea
                      value={slide.title}
                      onChange={(e) => editSlide(slide.id, { title: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-white outline-none focus:border-brand-green"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">Body text</label>
                    <textarea
                      value={slide.blurb}
                      onChange={(e) => editSlide(slide.id, { blurb: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-white outline-none focus:border-brand-green"
                    />
                  </div>

                  <Field label="Badge — big text" value={slide.badgeBig} onChange={(v) => editSlide(slide.id, { badgeBig: v })} />
                  <Field label="Badge — small text" value={slide.badgeSmall} onChange={(v) => editSlide(slide.id, { badgeSmall: v })} />
                  <Field label="Button label" value={slide.ctaLabel} onChange={(v) => editSlide(slide.id, { ctaLabel: v })} />
                  <Field label="Button link" value={slide.ctaHref} onChange={(v) => editSlide(slide.id, { ctaHref: v })} />
                </div>

                <p className="mb-3 mt-6 text-[13px] font-bold text-ink-soft">Floating tile photos</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <ImageUploadField
                      key={i}
                      mode="cutout"
                      label={`Tile ${i + 1} photo`}
                      value={slide.tileImages[i] ?? ""}
                      onChange={(url) => {
                        const next = [...slide.tileImages];
                        while (next.length < 4) next.push("");
                        next[i] = url;
                        editSlide(slide.id, { tileImages: next });
                      }}
                    />
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => saveSlide(slide)}
                    disabled={savingId === slide.id}
                    className="btn-pill btn-cart disabled:opacity-60"
                  >
                    {savingId === slide.id ? "Saving…" : "Save slide"}
                  </button>
                  {savedId === slide.id && (
                    <span className="text-[13px] font-bold text-brand-green">Saved ✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Shop by department">
        <p className="mb-5 text-[13px] text-ink-faint">
          The circular icons in the &ldquo;Shop by department&rdquo; row, also used on the departments
          page. Upload a photo to replace the drawn icon, or leave it empty to keep the drawing.
        </p>

        {!departments ? (
          <p className="text-[13px] text-ink-faint">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {departments.map((dept) => (
              <div key={dept.slug} className="rounded-xl border border-line bg-surface-2 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-white">
                    {dept.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */
                      <img src={imageSrc(dept.imageUrl)} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-[9px] text-black/50">drawn</span>
                    )}
                  </span>
                  <strong className="text-white">{dept.name}</strong>
                  <span className="ml-auto font-mono text-[11px] text-ink-faint">{dept.slug}</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Name" value={dept.name} onChange={(v) => editDepartment(dept.slug, { name: v })} />
                  <Field
                    label="Position in the row"
                    value={String(dept.sortOrder)}
                    onChange={(v) => editDepartment(dept.slug, { sortOrder: Number(v) || 0 })}
                  />
                  <div className="sm:col-span-2">
                    <Field label="Blurb" value={dept.blurb} onChange={(v) => editDepartment(dept.slug, { blurb: v })} />
                  </div>
                </div>

                <div className="mt-4">
                  <ImageUploadField
                    mode="cutout"
                    label="Department photo"
                    value={dept.imageUrl ?? ""}
                    onChange={(url) => editDepartment(dept.slug, { imageUrl: url || null })}
                  />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => saveDepartment(dept)}
                    disabled={savingId === dept.slug}
                    className="btn-pill btn-cart disabled:opacity-60"
                  >
                    {savingId === dept.slug ? "Saving…" : "Save department"}
                  </button>
                  {savedId === dept.slug && (
                    <span className="text-[13px] font-bold text-brand-green">Saved ✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Showcase cards">
        <p className="mb-5 text-[13px] text-ink-faint">
          The grid of cards under the hero. The first three sit beside the fuel prices; any others
          appear in the second grid further down.
        </p>

        {!cards ? (
          <p className="text-[13px] text-ink-faint">Loading…</p>
        ) : (
          <div className="space-y-5">
            {cards.map((card) => (
              <div key={card.id} className="rounded-xl border border-line bg-surface-2 p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <strong className="text-white">{card.title}</strong>
                  <label className="flex items-center gap-2 text-[13px] text-ink-soft">
                    <input
                      type="checkbox"
                      checked={card.active}
                      onChange={(e) => editCard(card.id, { active: e.target.checked })}
                    />
                    Show on site
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Card title" value={card.title} onChange={(v) => editCard(card.id, { title: v })} />
                  <Field label="Link label" value={card.linkLabel} onChange={(v) => editCard(card.id, { linkLabel: v })} />
                  <Field label="Link URL" value={card.linkHref} onChange={(v) => editCard(card.id, { linkHref: v })} />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {card.tiles.map((tile, i) => (
                    <div key={i} className="rounded-lg border border-line p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-white">
                          {tile.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */
                            <img src={imageSrc(tile.imageUrl)} alt="" className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-[9px] text-black/50">drawn</span>
                          )}
                        </span>
                        <span className="text-[13px] font-bold text-white">Tile {i + 1}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="Label" value={tile.label} onChange={(v) => editTile(card.id, i, { label: v })} />
                        <Field label="Link" value={tile.href} onChange={(v) => editTile(card.id, i, { href: v })} />
                      </div>

                      <div className="mt-3">
                        <ImageUploadField
                          mode="cutout"
                          label="Tile photo"
                          value={tile.imageUrl ?? ""}
                          onChange={(url) => editTile(card.id, i, { imageUrl: url || null })}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => saveCard(card)}
                    disabled={savingId === card.id}
                    className="btn-pill btn-cart disabled:opacity-60"
                  >
                    {savingId === card.id ? "Saving…" : "Save card"}
                  </button>
                  {savedId === card.id && (
                    <span className="text-[13px] font-bold text-brand-green">Saved ✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-white outline-none focus:border-brand-green"
      />
    </div>
  );
}
