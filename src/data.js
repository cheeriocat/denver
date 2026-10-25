// data.js — static config data for Denver store
// Products are now loaded from Firestore (see src/hooks/useProducts.js).
// This file only keeps static UI data (categories, testimonials).

export const categories = ["all", "essentials", "oversized", "signature"];

export const testimonials = [
  {
    id: 1,
    text: "I have tried every premium tee available in Sri Lanka. Denver is in a class of its own. The weight, the drape, the fit - nothing else comes close.",
    author: "Ashan P.",
    location: "Colombo",
    initial: "A",
    stars: 5,
  },
  {
    id: 2,
    text: "Ordered the classic black and white. Both arrived perfectly packaged within two days. The quality is genuinely extraordinary for a local brand.",
    author: "Ruwantha S.",
    location: "Kandy",
    initial: "R",
    stars: 5,
  },
  {
    id: 3,
    text: "The oversized fit is exactly what I have been looking for. Heavyweight, structured, and unbelievably comfortable. Worth every rupee.",
    author: "Dilini W.",
    location: "Galle",
    initial: "D",
    stars: 5,
  },
];
