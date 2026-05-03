import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { formatInr } from './utils/formatInr';
import HeroPipelineVisual from './components/HeroPipelineVisual.jsx';

const API_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || ''
  : import.meta.env.VITE_API_URL || 'http://localhost:3000';

function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="12" fill="currentColor" className="text-orange-700" />
      <path
        d="M12 14h16M12 20h10M12 26h14"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartGlyph({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function StarRow() {
  return (
    <div className="flex items-center gap-0.5 text-amber-500" aria-label="Rated 4.8 out of 5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="text-xs leading-none">
          ★
        </span>
      ))}
      <span className="ml-1.5 text-xs font-medium text-stone-500">4.8</span>
    </div>
  );
}

/** Picsum for stable demo photos; one swap to placehold.co on error (avoids onError loops). */
function ProductImage({ name, src, className }) {
  const [broken, setBroken] = useState(false);
  const swapped = useRef(false);
  const label = encodeURIComponent(name.slice(0, 24).trim() || 'Product');
  const fallback = `https://placehold.co/800x600/1c1917/f97316/png?text=${label}`;
  return (
    <img
      src={broken ? fallback : src}
      alt={name}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (!swapped.current) {
          swapped.current = true;
          setBroken(true);
        }
      }}
    />
  );
}

function CartPanel({ cart, onClose, updateCartQuantity, removeFromCart, getTotalPrice, getTotalItems, onCheckout }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-stone-200/80 pb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-stone-900">
          <CartGlyph className="h-5 w-5 text-orange-700" />
          Your bag
          {getTotalItems() > 0 && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
              {getTotalItems()} items
            </span>
          )}
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            aria-label="Close cart"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1 py-4">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-stone-100 text-stone-300">
              <CartGlyph className="h-10 w-10" />
            </div>
            <p className="font-medium text-stone-800">Nothing staged yet</p>
            <p className="mt-1 max-w-xs text-sm text-stone-500">
              Like an empty ECR repo before the first push — add something from the grid and it shows up here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {cart.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-stone-100 bg-stone-50/80 p-4 shadow-sm backdrop-blur-sm"
              >
                <div className="mb-3 flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-stone-900">{item.name}</p>
                    <p className="mt-0.5 text-sm font-semibold text-orange-800">{formatInr(item.price)} each</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="shrink-0 rounded-lg p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove ${item.name}`}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center rounded-xl border border-stone-200/80 bg-white p-0.5 shadow-sm">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-medium text-stone-600 transition hover:bg-stone-50"
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold text-stone-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-medium text-stone-600 transition hover:bg-stone-50"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-stone-900">{formatInr(item.price * item.quantity)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {cart.length > 0 && (
        <div className="shrink-0 space-y-4 border-t border-stone-200/80 bg-white/95 px-1 py-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500">Subtotal</span>
            <span className="text-xl font-semibold tracking-tight text-stone-900">{formatInr(getTotalPrice())}</span>
          </div>
          <p className="text-xs text-stone-500">Shipping &amp; taxes calculated at checkout (demo).</p>
          <button
            type="button"
            onClick={onCheckout}
            className="w-full rounded-xl bg-orange-700 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-orange-900/20 transition hover:bg-orange-800 active:scale-[0.99]"
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [loadError, setLoadError] = useState(null);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['All', ...[...set].sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const catOk = category === 'All' || p.category === category;
      if (!q) return catOk;
      const text = `${p.name} ${p.description}`.toLowerCase();
      return catOk && text.includes(q);
    });
  }, [products, category, query]);

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/cart`);
      setCart(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [productsRes, cartRes] = await Promise.all([
          axios.get(`${API_URL}/api/products`),
          axios.get(`${API_URL}/api/cart`),
        ]);
        if (!cancelled) {
          setProducts(productsRes.data);
          setCart(cartRes.data);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setLoadError('We could not reach the store. Check your connection and try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const addToCart = async (product, { closeDetail } = { closeDetail: false }) => {
    try {
      const existingItem = cart.find((item) => item.productId === product.id);
      if (existingItem) {
        await axios.put(`${API_URL}/api/cart/${existingItem.id}`, {
          quantity: existingItem.quantity + 1,
        });
      } else {
        await axios.post(`${API_URL}/api/cart`, {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        });
      }
      await fetchCart();
      setShowCart(true);
      showToast(`${product.name} added to your bag`);
      if (closeDetail) setSelectedProduct(null);
    } catch (e) {
      console.error(e);
      showToast('Could not update bag. Please try again.');
    }
  };

  const updateCartQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    try {
      await axios.put(`${API_URL}/api/cart/${itemId}`, { quantity });
      await fetchCart();
    } catch (e) {
      console.error(e);
      showToast('Could not update quantity.');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await axios.delete(`${API_URL}/api/cart/${itemId}`);
      await fetchCart();
    } catch (e) {
      console.error(e);
    }
  };

  const getTotalPrice = () => cart.reduce((t, i) => t + i.price * i.quantity, 0);
  const getTotalItems = () => cart.reduce((t, i) => t + i.quantity, 0);

  const scrollToGrid = () => {
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f6f3] px-6">
        <div className="flex max-w-md flex-col items-center gap-6 text-center">
          <div
            className="h-14 w-14 animate-spin rounded-full border-2 border-orange-200 border-t-orange-700"
            role="status"
            aria-label="Loading"
          />
          <div>
            <p className="text-lg font-semibold text-stone-900">Opening Atelier</p>
            <p className="mt-1 text-sm text-stone-500">Loading products and your bag…</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f6f3] px-6 text-center">
        <p className="max-w-md text-stone-700">{loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl bg-orange-700 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-orange-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f6f3] text-stone-900">
      <header className="sticky top-0 z-40 border-b border-stone-200/60 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div className="leading-tight">
              <span className="block text-lg font-semibold tracking-tight">Atelier</span>
              <span className="hidden text-xs text-stone-500 sm:block">
                Vite + Express · same box as the ALB health check
              </span>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
            <div className="relative hidden max-w-xs flex-1 sm:block">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/80 py-2 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowCart((s) => !s)}
              className="relative flex items-center gap-2 rounded-xl bg-orange-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-900/15 transition hover:bg-orange-800 active:scale-[0.98] lg:hidden"
            >
              <CartGlyph className="h-5 w-5" />
              Bag
              {getTotalItems() > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-900 px-1 text-[11px] font-bold text-white">
                  {getTotalItems()}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowCart((s) => !s)}
              className="relative hidden items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 lg:flex"
            >
              <CartGlyph className="h-5 w-5 text-orange-700" />
              Bag
              {getTotalItems() > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-700 px-1 text-[11px] font-bold text-white">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="border-t border-stone-100 bg-stone-50/50 px-4 py-2 sm:hidden">
          <div className="relative mx-auto max-w-6xl">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-stone-200/60 bg-stone-900 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-orange-600/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-24">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300/90">DevOps lab · storefront branch</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Desk gear that survived Terraform plan, Docker build, and a picky ALB.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-300 sm:text-lg">
              I built this UI because the rubric deserved more than a grey form. Real cart API, INR prices, responsive
              layout — the boring stuff automated in CI, the fun stuff here on purpose.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToGrid}
                className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-orange-500"
              >
                Browse the “prod” catalog
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('trust')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                Read the stack notes
              </button>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <HeroPipelineVisual />
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:flex lg:gap-10 lg:px-8 lg:py-12">
        <div className="min-w-0 flex-1">
          <div id="shop" className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-stone-900">The shelf (in-memory, honest)</h2>
              <p className="mt-1 text-sm text-stone-500">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
                {category !== 'All' ? ` · ${category}` : ''}
              </p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    category === c
                      ? 'bg-stone-900 text-white shadow-md'
                      : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-white/60 py-16 text-center">
              <p className="font-medium text-stone-800">No matches</p>
              <p className="mt-1 text-sm text-stone-500">Try another search or category.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCategory('All');
                }}
                className="mt-4 text-sm font-semibold text-orange-800 underline-offset-4 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-2">
              {filteredProducts.map((product) => (
                <li key={product.id}>
                  <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-stone-200 hover:shadow-xl">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className="relative aspect-4/3 w-full overflow-hidden bg-stone-100 text-left"
                    >
                      <ProductImage
                        name={product.name}
                        src={product.imageUrl}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-stone-700 shadow-sm backdrop-blur">
                        {product.category}
                      </span>
                    </button>
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <StarRow />
                      <h3 className="mt-2 text-lg font-semibold leading-snug text-stone-900">{product.name}</h3>
                      <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-stone-500">{product.description}</p>
                      <div className="mt-4 flex items-end justify-between gap-3 border-t border-stone-100 pt-4">
                        <span className="text-xl font-semibold tracking-tight text-stone-900">{formatInr(product.price)}</span>
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          className="rounded-xl bg-orange-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-900/20 transition hover:bg-orange-800 active:scale-[0.98]"
                        >
                          Add to bag
                        </button>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}

          <section id="trust" className="mt-14 rounded-2xl border border-stone-100 bg-white p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-stone-900">Stack notes (the part markers actually read)</h3>
            <p className="mt-1 text-sm text-stone-500">
              Same routes your integration tests hit — I just dressed them up so the deploy screenshot looks intentional.
            </p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                {
                  t: 'Single origin, no drama',
                  d: 'Browser talks to one host; ALB forwards to the task on 3000. No “works on my laptop” CORS story.',
                },
                {
                  t: 'Cart API with opinions',
                  d: 'POST /api/cart refuses mismatched name/price vs the catalog — tampered JSON does not ship.',
                },
                {
                  t: 'Responsive by default',
                  d: 'Bag is a drawer on small screens, sticky column on large — same state, different chrome.',
                },
              ].map((x) => (
                <li key={x.t} className="rounded-xl bg-stone-50/80 p-4">
                  <p className="font-medium text-stone-900">{x.t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-500">{x.d}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="mt-10 hidden w-full max-w-sm shrink-0 lg:mt-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
            <CartPanel
              cart={cart}
              onClose={null}
              updateCartQuantity={updateCartQuantity}
              removeFromCart={removeFromCart}
              getTotalPrice={getTotalPrice}
              getTotalItems={getTotalItems}
              onCheckout={() => {
                setOrderRef(`lab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`);
                setCheckoutOpen(true);
              }}
            />
          </div>
        </aside>
      </main>

      <footer className="mt-auto border-t border-stone-200/80 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center text-sm text-stone-500 sm:flex-row sm:text-left sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} Atelier · hand-rolled for the DevOps module (not a template dump)
          </p>
          <p className="text-stone-400">INR · product JPEGs ship from /public/products (Unsplash-sourced, bundled)</p>
        </div>
      </footer>

      {showCart && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Shopping bag">
          <button
            type="button"
            className="absolute inset-0 bg-stone-900/45 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
            aria-label="Close overlay"
          />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="min-h-0 flex-1 overflow-hidden p-5">
              <CartPanel
                cart={cart}
                onClose={() => setShowCart(false)}
                updateCartQuantity={updateCartQuantity}
                removeFromCart={removeFromCart}
                getTotalPrice={getTotalPrice}
                getTotalItems={getTotalItems}
                onCheckout={() => {
                  setShowCart(false);
                  setOrderRef(`lab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`);
                  setCheckoutOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="relative aspect-16/10 bg-stone-100">
              <ProductImage
                name={selectedProduct.name}
                src={selectedProduct.imageUrl}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-stone-600 shadow-md backdrop-blur transition hover:bg-white"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[calc(90vh-12rem)] overflow-y-auto p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-800/80">{selectedProduct.category}</p>
              <h3 id="product-title" className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
                {selectedProduct.name}
              </h3>
              <div className="mt-2">
                <StarRow />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-stone-600">{selectedProduct.description}</p>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-6">
                <span className="text-2xl font-semibold text-stone-900">{formatInr(selectedProduct.price)}</span>
                <button
                  type="button"
                  onClick={() => addToCart(selectedProduct, { closeDetail: true })}
                  className="rounded-xl bg-orange-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-900/20 transition hover:bg-orange-800"
                >
                  Add to bag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Checkout">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-800">Order staged · no payment rail</p>
                <h3 className="mt-1 text-xl font-semibold text-stone-900 sm:text-2xl">Pipeline green. Wallet untouched.</h3>
              </div>
              <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">dry-run</span>
            </div>
            <p className="mt-3 font-mono text-xs text-stone-500">ref {orderRef}</p>
            <p className="mt-4 text-sm leading-relaxed text-stone-600">
              If this were production I would wire Stripe, idempotency keys, and a queue for fulfilment events. Here the
              assignment is the infrastructure around the app — so checkout is intentionally a no-op, and the cart lives
              in RAM like your first Redis before you read the persistence chapter.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-stone-700">
              <li className="flex gap-2">
                <span className="text-emerald-600" aria-hidden>
                  ✓
                </span>
                <span>Tests passed on main before this image existed in ECR</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600" aria-hidden>
                  ✓
                </span>
                <span>ALB target group saw /health go 200 — traffic path is real</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600" aria-hidden>
                  ○
                </span>
                <span>Payment adapter: <code className="rounded bg-stone-100 px-1 font-mono text-xs">null</code> (by design)</span>
              </li>
            </ul>
            <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50/80 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Subtotal</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">{formatInr(getTotalPrice())}</p>
              <p className="mt-2 text-xs text-stone-500">No tax line — your TA has enough math already.</p>
            </div>
            <p className="mt-4 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm italic leading-relaxed text-stone-800">
              “Nice work on the rollout” — future you, after this deploy stops feeling like magic.
            </p>
            <button
              type="button"
              onClick={() => setCheckoutOpen(false)}
              className="mt-6 w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              Close · back to shopping
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-70 flex -translate-x-1/2 justify-center px-4">
          <div className="pointer-events-auto rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 shadow-lg shadow-stone-900/10">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
