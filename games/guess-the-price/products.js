const PRODUCTS = [
  { name: 'Organic Saffron (1g)', emoji: '🌸', desc: 'The world\'s most expensive spice by weight', threshold: 8,   actual: 14   },
  { name: 'IKEA BILLY Bookcase',  emoji: '📚', desc: 'Classic white, 80×28×202 cm',               threshold: 65,  actual: 50   },
  { name: 'Fiji Water (1 litre)', emoji: '💧', desc: 'Imported natural artesian water',            threshold: 2,   actual: 3.50 },
  { name: 'AirPods (2nd gen)',    emoji: '🎧', desc: 'Apple wireless earbuds with charging case',  threshold: 100, actual: 129  },
  { name: 'White Truffle (50g)',  emoji: '🍄', desc: 'Fresh Italian white truffle, seasonal',      threshold: 60,  actual: 120  },
  { name: 'BIC Biro (10-pack)',   emoji: '🖊️', desc: 'Ballpoint pens, assorted colours',           threshold: 5,   actual: 3    },
  { name: 'Nespresso Pod (1)',    emoji: '☕', desc: 'Single aluminium capsule, original line',    threshold: 1,   actual: 0.75 },
  { name: 'Lego Classic Box',    emoji: '🧱', desc: '1,000-piece classic bricks set',             threshold: 40,  actual: 55   },
  { name: 'Himalayan Pink Salt (1kg)', emoji: '🧂', desc: 'Coarse grain, mineral-rich salt',      threshold: 3,   actual: 6    },
  { name: 'iPhone 15 (128GB)',   emoji: '📱', desc: 'Base model, brand new retail price',          threshold: 700, actual: 799  },
  { name: 'Avocado (single)',    emoji: '🥑', desc: 'Medium Hass avocado, grocery store price',    threshold: 2,   actual: 1.20 },
  { name: 'Netflix (monthly)',   emoji: '📺', desc: 'Standard HD plan in the US',                  threshold: 12,  actual: 15.49},
  { name: 'Big Mac Burger',      emoji: '🍔', desc: 'McDonald\'s classic, US average price 2024',  threshold: 5,   actual: 5.89 },
  { name: 'Casio F-91W Watch',   emoji: '⌚', desc: 'Iconic budget digital watch',                threshold: 30,  actual: 16   },
  { name: 'Starbucks Latte (grande)', emoji: '☕', desc: 'Tall 16oz latte, US average',           threshold: 5,   actual: 6.45 },
  { name: 'AA Batteries (4-pack)', emoji: '🔋', desc: 'Standard alkaline AAs, supermarket brand', threshold: 4,   actual: 3    },
  { name: 'KitchenAid Stand Mixer', emoji: '🍰', desc: 'Classic tilt-head, 4.5qt bowl',           threshold: 350, actual: 449  },
  { name: 'Spotify Premium',    emoji: '🎵', desc: 'Individual plan, per month in the US',         threshold: 8,   actual: 11.99},
  { name: 'Nike Air Force 1',   emoji: '👟', desc: 'Classic low-top, standard retail',             threshold: 90,  actual: 110  },
  { name: 'Ferrero Rocher (16)', emoji: '🍫', desc: 'Gift box of 16 chocolates',                  threshold: 7,   actual: 9    },
  { name: 'USPS Forever Stamp', emoji: '📬', desc: 'Standard first-class postage stamp',           threshold: 1,   actual: 0.68 },
  { name: 'Kindle Paperwhite',  emoji: '📖', desc: 'E-reader, 6.8" display, 8GB Wi-Fi',           threshold: 100, actual: 140  },
  { name: 'Gillette Fusion Razor', emoji: '🪒', desc: 'Single cartridge, 5-blade refill',         threshold: 2,   actual: 4    },
  { name: 'Monopoly Board Game', emoji: '🎲', desc: 'Classic edition, standard retail',            threshold: 20,  actual: 22   },
  { name: 'Egg (single, free range)', emoji: '🥚', desc: 'One large free-range egg, US average',  threshold: 0.5, actual: 0.35 },
];

function getProducts(n) {
  const copy = PRODUCTS.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
