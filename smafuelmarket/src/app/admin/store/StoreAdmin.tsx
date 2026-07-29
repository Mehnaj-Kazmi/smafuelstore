"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Panel, Stat } from "@/components/admin/Ui";

type FuelPrice = { grade: string; price: string | number };

type Store = {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
  radiusMiles: number;
  fuelPrices: FuelPrice[];
};

export default function StoreAdmin() {
  const [stores, setStores] = useState<Store[] | null>(null);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStores(await api.get<Store[]>("/store-locations"));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the store");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function edit(id: string, patch: Partial<Store>) {
    setStores((prev) => prev?.map((s) => (s.id === id ? { ...s, ...patch } : s)) ?? null);
    setSavedId(null);
  }

  function editFuel(id: string, index: number, patch: Partial<FuelPrice>) {
    setStores(
      (prev) =>
        prev?.map((s) =>
          s.id === id ? { ...s, fuelPrices: s.fuelPrices.map((f, i) => (i === index ? { ...f, ...patch } : f)) } : s,
        ) ?? null,
    );
    setSavedId(null);
  }

  async function save(store: Store) {
    setSavingId(store.id);
    setError("");
    try {
      await api.patch(`/store-locations/${store.id}`, {
        name: store.name,
        address: store.address,
        city: store.city,
        phone: store.phone,
        hours: store.hours,
        lat: Number(store.lat),
        lng: Number(store.lng),
        radiusMiles: Number(store.radiusMiles),
        fuelPrices: store.fuelPrices.map((f) => ({ grade: f.grade, price: Number(f.price) })),
      });
      setSavedId(store.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  }

  if (error && !stores) {
    return (
      <Panel title="Store">
        <p className="text-[13px] font-semibold text-sma-deal">{error}</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Stores" value={String(stores?.length ?? 0)} tone="good" />
        <Stat label="Delivery radius" value={stores?.[0] ? `${stores[0].radiusMiles} mi` : "—"} sub="from the store" />
        <Stat label="City" value={stores?.[0]?.city ?? "—"} />
        <Stat label="Fuel grades" value={String(stores?.[0]?.fuelPrices.length ?? 0)} sub="shown on the home page" />
      </div>

      {error && <p role="alert" className="text-[13px] font-semibold text-sma-deal">{error}</p>}

      <Panel title="Store & delivery area">
        <p className="mb-5 text-[13px] text-ink-faint">
          The coordinates below decide who the shop will deliver to — a customer is allowed to order only
          when they are within the radius of this point. Get them from Google Maps by right-clicking your
          shop and copying the pair it shows.
        </p>

        {!stores ? (
          <p className="text-[13px] text-ink-faint">Loading…</p>
        ) : (
          <div className="space-y-5">
            {stores.map((store) => (
              <div key={store.id} className="rounded-xl border border-line bg-surface-2 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Store name" value={store.name} onChange={(v) => edit(store.id, { name: v })} />
                  <Field label="Phone" value={store.phone} onChange={(v) => edit(store.id, { phone: v })} />
                  <Field label="Street address" value={store.address} onChange={(v) => edit(store.id, { address: v })} />
                  <Field label="City" value={store.city} onChange={(v) => edit(store.id, { city: v })} />
                  <Field label="Opening hours" value={store.hours} onChange={(v) => edit(store.id, { hours: v })} className="sm:col-span-2" />
                </div>

                <p className="mb-3 mt-6 text-[13px] font-bold text-ink-soft">Delivery area</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Latitude" value={String(store.lat)} onChange={(v) => edit(store.id, { lat: v as unknown as number })} />
                  <Field label="Longitude" value={String(store.lng)} onChange={(v) => edit(store.id, { lng: v as unknown as number })} />
                  <Field label="Radius (miles)" value={String(store.radiusMiles)} onChange={(v) => edit(store.id, { radiusMiles: v as unknown as number })} />
                </div>

                <p className="mb-3 mt-6 text-[13px] font-bold text-ink-soft">Fuel prices</p>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {store.fuelPrices.map((f, i) => (
                    <div key={i} className="rounded-lg border border-line p-3">
                      <Field label="Grade" value={f.grade} onChange={(v) => editFuel(store.id, i, { grade: v })} />
                      <div className="mt-2">
                        <Field label="Price / gal" value={String(f.price)} onChange={(v) => editFuel(store.id, i, { price: v })} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => save(store)}
                    disabled={savingId === store.id}
                    className="btn-pill btn-cart disabled:opacity-60"
                  >
                    {savingId === store.id ? "Saving…" : "Save store"}
                  </button>
                  {savedId === store.id && <span className="text-[13px] font-bold text-brand-green">Saved ✓</span>}
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
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-white outline-none focus:border-brand-green"
      />
    </div>
  );
}
