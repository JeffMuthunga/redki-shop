import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, QueryContext } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const { category } = req.query as { category: string }

    if (!category) {
        return res.status(400).json({
            success: false,
            error: "category is required. Use: phones | laptops | accessories",
        })
    }

    const validCategories = ["phones", "laptops", "accessories"]
    if (!validCategories.includes(category)) {
        return res.status(400).json({
            success: false,
            error: `Invalid category: ${category}`,
        })
    }

    try {
        const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

        const { data: products } = await query.graph({
            entity: "product",
            fields: [
                "id",
                "title",
                "description",
                "thumbnail",
                "handle",
                "status",
                "variants.*",
                "variants.calculated_price.*",
                "categories.*",
            ],
            filters: {
                categories: { handle: category },
                status: "published",
            },
            context: {
                variants: {
                    calculated_price: QueryContext({
                        currency_code: "kes",
                    }),
                },
            },
        })

        if (!products || products.length === 0) {
            return res.json({
                success: true,
                category,
                total: 0,
                products: [],
                message: `No ${category} available at the moment. Check back soon!`,
            })
        }

        const formattedProducts = products.map((product) => {
            const variant = product.variants?.[0]
            const rawPrice = variant?.calculated_price?.calculated_amount || 0
            const price = Number(rawPrice)

            return {
                product_id: product.id,
                variant_id: variant?.id || null,
                title: product.title,
                description: product.description
                    ? product.description.slice(0, 60) + (product.description.length > 60 ? "..." : "")
                    : "",
                price: price,
                price_formatted: `KES ${price.toLocaleString("en-KE")}`,
                image_url: product.thumbnail || "",
                product_url: `${process.env.STORE_URL}/products/${product.handle}`,
                handle: product.handle,
            }
        })

        return res.json({
            success: true,
            category,
            total: formattedProducts.length,
            products: formattedProducts,
        })

    } catch (error) {
        console.error("[GET /whatsapp/products] Error:", error)
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}