import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatInr } from './utils/formatInr';

// Production ECS + ALB: same origin (empty base URL). Local dev: default to backend on 3000.
const API_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || '')
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000');

function CartIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function LogoIcon({ className = 'w-8 h-8' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function EmptyCartIcon({ className = 'w-16 h-16' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cart`);
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

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
        }
      } catch (error) {
        if (!cancelled) console.error('Error loading data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const addToCart = async (product) => {
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
      fetchCart();
      setShowCart(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const updateCartQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    try {
      await axios.put(`${API_URL}/api/cart/${itemId}`, { quantity });
      fetchCart();
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await axios.delete(`${API_URL}/api/cart/${itemId}`);
      fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const getTotalPrice = () => cart.reduce((t, i) => t + i.price * i.quantity, 0);
  const getTotalItems = () => cart.reduce((t, i) => t + i.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div
            className="w-14 h-14 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin"
            role="status"
            aria-label="Loading"
          />
          <p className="text-stone-600 font-medium text-lg">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col">
      <header className="bg-white/90 backdrop-blur-sm sticky top-0 z-40 border-b border-stone-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-18">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-teal-600/20">
                <LogoIcon className="w-5 h-5" />
              </div>
              <span className="text-xl font-semibold text-stone-800 tracking-tight">ShopHub</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCart(!showCart)}
              className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-medium shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all duration-200 active:scale-[0.98]"
            >
              <CartIcon />
              <span className="hidden sm:inline">Cart</span>
              {getTotalItems() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 flex-1">
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-stone-800 tracking-tight mb-3">
            Premium tech, made simple
          </h1>
          <p className="text-lg text-stone-600 max-w-xl mx-auto leading-relaxed">
            Thoughtfully chosen accessories for your daily life. No clutter, just what you need.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className="relative h-44 sm:h-52 w-full bg-stone-100 overflow-hidden block text-left"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-3 right-3 bg-teal-600/90 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur">
                      New
                    </span>
                  </button>
                  <div className="p-5 sm:p-6">
                    <h2 className="text-lg font-semibold text-stone-800 mb-1.5">{product.name}</h2>
                    <p className="text-sm text-stone-500 mb-4 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-xl font-semibold text-stone-800">
                        {formatInr(product.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white font-medium shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all duration-200 active:scale-[0.98]"
                      >
                        <span className="text-lg leading-none">+</span>
                        Add
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-stone-800 mb-5 flex items-center gap-2">
                <CartIcon className="w-5 h-5 text-teal-600" />
                Your cart
              </h2>
              {cart.length === 0 ? (
                <div className="text-center py-14">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-300">
                    <EmptyCartIcon className="w-10 h-10" />
                  </div>
                  <p className="text-stone-600 font-medium">Your cart is empty</p>
                  <p className="text-sm text-stone-400 mt-1">Add something you like</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="bg-stone-50 rounded-xl p-4 border border-stone-100"
                      >
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className="min-w-0">
                            <h3 className="font-medium text-stone-800 text-sm truncate">
                              {item.name}
                            </h3>
                            <p className="text-teal-600 font-semibold mt-0.5">
                              {formatInr(item.price)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="shrink-0 p-1 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            aria-label="Remove from cart"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors font-medium"
                            >
                              −
                            </button>
                            <span className="w-9 text-center text-stone-800 font-medium">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors font-medium"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-semibold text-stone-800">
                            {formatInr(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-stone-100 pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-stone-600">Subtotal</span>
                      <span className="text-xl font-semibold text-stone-800">
                        {formatInr(getTotalPrice())}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="w-full py-3.5 rounded-xl bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all duration-200 active:scale-[0.99]"
                    >
                      Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-white border-t border-stone-100 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <span className="text-stone-500 text-sm">© ShopHub. Premium tech, made simple.</span>
            <span className="text-stone-400 text-sm">Built with care.</span>
          </div>
        </div>
      </footer>

      {showCart && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                  <CartIcon className="w-5 h-5 text-teal-600" />
                  Your cart
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCart(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                  aria-label="Close cart"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-300">
                    <EmptyCartIcon className="w-10 h-10" />
                  </div>
                  <p className="text-stone-600 font-medium">Your cart is empty</p>
                  <p className="text-sm text-stone-400 mt-1">Add something you like</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="bg-stone-50 rounded-xl p-4 border border-stone-100"
                      >
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className="min-w-0">
                            <h3 className="font-medium text-stone-800 text-sm truncate">
                              {item.name}
                            </h3>
                            <p className="text-teal-600 font-semibold mt-0.5">
                              {formatInr(item.price)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="shrink-0 p-1 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            aria-label="Remove"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 font-medium"
                            >
                              −
                            </button>
                            <span className="w-9 text-center font-medium text-stone-800">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 font-medium"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-semibold text-stone-800">
                            {formatInr(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-stone-100 pt-4 space-y-4 sticky bottom-0 bg-white pb-6">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-stone-600">Subtotal</span>
                      <span className="text-xl font-semibold text-stone-800">
                        {formatInr(getTotalPrice())}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="w-full py-3.5 rounded-xl bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all duration-200 active:scale-[0.99]"
                    >
                      Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="relative h-56 bg-stone-100">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-8">
              <div className="flex justify-between items-start gap-4 mb-4">
                <h3 className="text-2xl font-semibold text-stone-800">{selectedProduct.name}</h3>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-stone-600 mb-6 leading-relaxed">{selectedProduct.description}</p>
              <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                <span className="text-2xl font-semibold text-stone-800">
                  {formatInr(selectedProduct.price)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="px-6 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-all duration-200 active:scale-[0.98]"
                >
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
