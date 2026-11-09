import { Router, Response } from 'express';
import { db } from '../db/store';
import { optionalAuthenticate, authenticate, AuthRequest } from '../middleware/auth';
import { CartItem } from '../db/types';

const router = Router();

// GET /api/products
router.get('/', (req, res: Response) => {
  const { category, search, ecoScore } = req.query;

  let products = Array.from(db.products.values());

  if (category && category !== 'All') {
    products = products.filter((p) => p.category === category);
  }

  if (ecoScore && ecoScore !== 'All') {
    products = products.filter((p) => p.ecoScore === ecoScore);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.seller.toLowerCase().includes(q) ||
        p.sustainabilityBenefit.toLowerCase().includes(q)
    );
  }

  return res.json({
    total: products.length,
    products,
  });
});

// GET /api/products/:id
router.get('/:id', (req, res: Response) => {
  const product = db.products.get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  return res.json({ product });
});

// GET /api/cart
router.get('/cart', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || 'guest';
  const items = Array.from(db.cartItems.values()).filter((c) => c.userId === userId);

  const enrichedItems = items.map((item) => {
    const product = db.products.get(item.productId) || item.product;
    return {
      ...item,
      product,
      itemTotal: product ? product.price * item.quantity : 0,
    };
  });

  const subtotal = enrichedItems.reduce((acc, curr) => acc + curr.itemTotal, 0);

  return res.json({
    items: enrichedItems,
    itemCount: enrichedItems.reduce((acc, curr) => acc + curr.quantity, 0),
    subtotal,
  });
});

// POST /api/cart
router.post('/cart', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || 'guest';
  const { productId, quantity = 1 } = req.body;

  const product = db.products.get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  let existing = Array.from(db.cartItems.values()).find(
    (c) => c.userId === userId && c.productId === productId
  );

  if (existing) {
    existing.quantity = Math.max(1, existing.quantity + Number(quantity));
  } else {
    const id = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    existing = {
      id,
      userId,
      productId,
      product,
      quantity: Number(quantity),
    };
    db.cartItems.set(id, existing);
  }

  return res.json({
    message: `Added ${product.name} to cart`,
    item: existing,
  });
});

// DELETE /api/cart/:productId
router.delete('/cart/:productId', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || 'guest';
  const productId = req.params.productId;

  const toDelete = Array.from(db.cartItems.entries()).find(
    ([_, c]) => c.userId === userId && c.productId === productId
  );

  if (toDelete) {
    db.cartItems.delete(toDelete[0]);
  }

  return res.json({ message: 'Item removed from cart' });
});

// POST /api/cart/checkout (Conceptual prototype checkout)
router.post('/cart/checkout', optionalAuthenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || 'guest';
  const userItems = Array.from(db.cartItems.entries()).filter(([_, c]) => c.userId === userId);

  if (userItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Clear cart
  userItems.forEach(([key]) => db.cartItems.delete(key));

  return res.json({
    success: true,
    orderId: `AGX-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    message:
      'Conceptual order received! (Note: Real payments are disabled in this research prototype; items will be coordinated with the respective sustainable producer cooperative).',
  });
});

export default router;
