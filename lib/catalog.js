export const seedCatalog = {
  collections: [
    { id: "raw-silk", slug: "raw-silk", name: "Raw Silk", description: "Rich silk textures with an heirloom feel.", cover: "" },
    { id: "banarasi", slug: "banarasi", name: "Banarasi", description: "Timeless zari and woven artistry.", cover: "" },
    { id: "pochampally", slug: "pochampally", name: "Pochampally", description: "Distinctive ikat stories from Telangana.", cover: "" },
    { id: "cotton", slug: "cotton", name: "Cotton", description: "Light, breathable everyday weaves.", cover: "" }
  ],
  products: [
    { id: "demo-1", slug: "antique-gold-raw-silk", name: "Antique Gold Raw Silk", collection: "raw-silk", category: "Fabrics", description: "A luminous raw silk with a subtle antique finish.", details: "Pure-look raw silk • Rich texture • Occasion-ready", images: [], featured: true, newArrival: true, available: true },
    { id: "demo-2", slug: "classic-banarasi-weave", name: "Classic Banarasi Weave", collection: "banarasi", category: "Fabrics", description: "A traditional Banarasi-inspired weave for statement pieces.", details: "Zari detailing • Structured drape • Festive edit", images: [], featured: true, newArrival: false, available: true },
    { id: "demo-3", slug: "handloom-ikat-story", name: "Handloom Ikat Story", collection: "pochampally", category: "Fabrics", description: "Graphic ikat motifs with an artisanal handloom character.", details: "Ikat weave • Textured handfeel • Limited edit", images: [], featured: true, newArrival: true, available: true }
  ]
};

export function slugify(value) {
  return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
