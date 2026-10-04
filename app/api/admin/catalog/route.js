import { list, put } from "@vercel/blob";
import { seedCatalog } from "../../../../lib/catalog";
import { isAdmin } from "../../../../lib/admin";

export const dynamic = "force-dynamic";

const CATALOG_PATH = "data/catalog.json";

async function readCatalog() {
  try {
    const { blobs } = await list({
      prefix: CATALOG_PATH,
    });

    const blob = blobs?.find(
      (b) => b.pathname === CATALOG_PATH
    );

    if (!blob) {
      return seedCatalog;
    }

    const response = await fetch(blob.url, {
      cache: "no-store",
    });

    if (!response.ok) {
      return seedCatalog;
    }

    return await response.json();
  } catch (error) {
    console.error("Catalog read failed:", error);
    return seedCatalog;
  }
}

async function writeCatalog(catalog) {
  try {
    return await put(
      CATALOG_PATH,
      JSON.stringify(catalog, null, 2),
      {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
        cacheControlMaxAge: 0,
      }
    );
  } catch (error) {
    console.error("Catalog write failed:", error);
    throw error;
  }
}

export async function GET(request) {
  if (!isAdmin(request)) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const catalog = await readCatalog();

    return Response.json(catalog, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Catalog GET failed:", error);

    return Response.json(
      { error: "Could not load catalog." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  if (!isAdmin(request)) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const catalog = await request.json();

    if (
      !catalog ||
      !Array.isArray(catalog.collections) ||
      !Array.isArray(catalog.products)
    ) {
      return Response.json(
        { error: "Invalid catalog." },
        { status: 400 }
      );
    }

    await writeCatalog(catalog);

    return Response.json({
      ok: true,
      catalog,
    });
  } catch (error) {
    console.error("Catalog save failed:", error);

    return Response.json(
      {
        error:
          error?.message ||
          "Could not save catalog.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  if (!isAdmin(request)) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { type, id } = await request.json();

    if (
      !["collection", "product"].includes(type) ||
      !id
    ) {
      return Response.json(
        { error: "Type and id are required." },
        { status: 400 }
      );
    }

    const catalog = await readCatalog();

    let next = catalog;

    if (type === "product") {
      const exists = catalog.products.some(
        (p) => p.id === id
      );

      if (!exists) {
        return Response.json(
          { error: "Product not found." },
          { status: 404 }
        );
      }

      next = {
        ...catalog,
        products: catalog.products.filter(
          (p) => p.id !== id
        ),
      };
    } else {
      const collection = catalog.collections.find(
        (c) => c.id === id
      );

      if (!collection) {
        return Response.json(
          { error: "Collection not found." },
          { status: 404 }
        );
      }

      next = {
        collections: catalog.collections.filter(
          (c) => c.id !== id
        ),
        products: catalog.products.filter(
          (p) => p.collection !== collection.slug
        ),
      };
    }

    await writeCatalog(next);

    return Response.json({
      ok: true,
      catalog: next,
    });
  } catch (error) {
    console.error("Catalog delete failed:", error);

    return Response.json(
      {
        error:
          error?.message ||
          "Could not delete.",
      },
      { status: 500 }
    );
  }
}