import { list, put } from "@vercel/blob";
import { seedCatalog } from "../../../../lib/catalog";
import { isAdmin } from "../../../../lib/admin";

export const dynamic = "force-dynamic";

const CATALOG_PATH = "data/catalog.json";

async function readCatalog() {
  try {
    const result = await list({
      prefix: CATALOG_PATH,
    });

    const blob = result.blobs?.find(
      (item) => item.pathname === CATALOG_PATH
    );

    if (!blob) {
      return seedCatalog;
    }

    const response = await fetch(blob.url, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Catalog fetch failed:",
        response.status,
        response.statusText
      );

      return seedCatalog;
    }

    const catalog = await response.json();

    if (
      !catalog ||
      !Array.isArray(catalog.collections) ||
      !Array.isArray(catalog.products)
    ) {
      console.error("Invalid catalog stored in Blob.");
      return seedCatalog;
    }

    return catalog;
  } catch (error) {
    console.error("Catalog read failed:", error);
    return seedCatalog;
  }
}

async function writeCatalog(catalog) {
  const blob = await put(
    CATALOG_PATH,
    JSON.stringify(catalog, null, 2),
    {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    }
  );

  return blob;
}

export async function GET(request) {
  if (!isAdmin(request)) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const catalog = await readCatalog();

  return Response.json(catalog, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
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
        { error: "Invalid catalog data." },
        { status: 400 }
      );
    }

    await writeCatalog(catalog);

    return Response.json(
      {
        ok: true,
        catalog,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Catalog save failed:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save catalog.",
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
    const body = await request.json();

    const type = body?.type;
    const id = body?.id;

    if (!type || !id) {
      return Response.json(
        { error: "Missing item type or id." },
        { status: 400 }
      );
    }

    if (type !== "collection" && type !== "product") {
      return Response.json(
        { error: "Invalid item type." },
        { status: 400 }
      );
    }

    const catalog = await readCatalog();

    if (type === "collection") {
      const collection = catalog.collections.find(
        (item) => item.id === id
      );

      if (!collection) {
        return Response.json(
          { error: "Collection not found." },
          { status: 404 }
        );
      }

      const updatedCatalog = {
        ...catalog,

        collections: catalog.collections.filter(
          (item) => item.id !== id
        ),

        products: catalog.products.filter(
          (product) =>
            product.collection !== collection.slug
        ),
      };

      await writeCatalog(updatedCatalog);

      return Response.json({
        ok: true,
        catalog: updatedCatalog,
      });
    }

    const productExists = catalog.products.some(
      (item) => item.id === id
    );

    if (!productExists) {
      return Response.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const updatedCatalog = {
      ...catalog,

      products: catalog.products.filter(
        (item) => item.id !== id
      ),
    };

    await writeCatalog(updatedCatalog);

    return Response.json({
      ok: true,
      catalog: updatedCatalog,
    });
  } catch (error) {
    console.error("Catalog delete failed:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not delete item.",
      },
      { status: 500 }
    );
  }
}