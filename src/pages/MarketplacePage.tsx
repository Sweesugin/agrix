import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Plus,
  Star,
  CheckCircle2,
  Info,
  ShieldCheck,
  Tag,
  Eye,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MarketplaceProduct } from '../types';

interface MarketplacePageProps {
  onOpenCart: () => void;
}

const PRODUCT_CATEGORIES = [
  'All',
  'Seeds',
  'Organic fertilizers',
  'Compost',
  'Irrigation equipment',
  'Farming tools',
  'Sustainable products',
];

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ onOpenCart }) => {
  const { refreshCartCount } = useAuth();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts({
        category: category !== 'All' ? category : undefined,
        search: search.trim() || undefined,
      });
      setProducts(data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const handleAddToCart = async (product: MarketplaceProduct) => {
    try {
      setAddingId(product.id);
      await api.addToCart(product.id, 1);
      await refreshCartCount();
      // Brief feedback
    } catch (err: any) {
      alert(err.message || 'Could not add to cart');
    } finally {
      setTimeout(() => setAddingId(null), 600);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              Sustainable Inputs Marketplace
            </h1>
          </div>
          <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Discover verified organic fertilizers, traditional heirloom seeds, water conservation tools, and biological pest controls.
          </p>
        </div>

        <button
          onClick={onOpenCart}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>View Cart</span>
        </button>
      </div>

      {/* Conceptual Notice Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Conceptual Research Prototype:</strong> This marketplace catalogues verified ecological farm inputs with transparent EcoScores and origin traceability. Real payments are disabled; orders simulate dispatch to local bio-input producer cooperatives.
        </p>
      </div>

      {/* Search & Category Tabs */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search heirloom seeds, vermicompost, drip tubes, Trichoderma..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
                category === cat
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-stone-400">
            Loading sustainable products...
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full py-16 text-center text-stone-400 bg-white rounded-3xl border border-stone-200">
            No products matched your search. Try another category!
          </div>
        ) : (
          products.map((product) => {
            const isAdding = addingId === product.id;

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div>
                  <div className="relative h-44 overflow-hidden bg-stone-100">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-[10px] font-bold text-stone-800">
                      {product.category}
                    </div>

                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold shadow-sm">
                      Eco: {product.ecoScore}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{product.rating}</span>
                      <span className="text-stone-400">({product.reviewsCount})</span>
                    </div>

                    <h3 className="font-bold text-stone-900 text-sm line-clamp-2 leading-snug">
                      {product.name}
                    </h3>

                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="p-2 bg-emerald-50 rounded-xl text-[10px] text-emerald-800 font-medium">
                      🌿 {product.sustainabilityBenefit}
                    </div>

                    <div className="text-[11px] text-stone-400 pt-1">
                      Seller: <span className="font-semibold text-stone-600">{product.seller}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-lg font-black text-stone-900">₹{product.price}</span>
                      <span className="text-[11px] text-stone-400 ml-1">/ {product.unit}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                      title="Product Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isAdding}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isAdding
                          ? 'bg-emerald-800 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      }`}
                    >
                      {isAdding ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 p-2 text-stone-600 hover:text-stone-900 bg-white/80 rounded-full backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={selectedProduct.imageUrl}
              alt={selectedProduct.name}
              className="w-full h-56 object-cover"
            />

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {selectedProduct.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-bold">
                  EcoScore: {selectedProduct.ecoScore}
                </span>
              </div>

              <h3 className="text-xl font-bold text-stone-900">{selectedProduct.name}</h3>

              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {selectedProduct.description}
              </p>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-950 space-y-1">
                <div className="font-bold text-emerald-900">Agro-Ecological Benefit:</div>
                <p>{selectedProduct.sustainabilityBenefit}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="text-2xl font-black text-stone-900">₹{selectedProduct.price}</div>
                  <div className="text-xs text-stone-500">Packaging: {selectedProduct.unit}</div>
                </div>

                <button
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
