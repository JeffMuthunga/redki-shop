import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WHATSAPP_MODULE } from "../../../modules/whatsapp"
import WhatsappModuleService from "../../../modules/whatsapp/service"

// GET /whatsapp/session?phone=254712345678
export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const { phone } = req.query as { phone: string }

    if (!phone) {
        return res.status(400).json({
            success: false,
            error: "phone query parameter is required",
        })
    }

    const whatsappService: WhatsappModuleService =
        req.scope.resolve(WHATSAPP_MODULE)

    const session = await whatsappService.findByPhone(phone)

    if (!session) {
        return res.status(404).json({
            success: false,
            error: `No session found for phone: ${phone}`,
        })
    }

    return res.json({
        success: true,
        session: {
            id: session.id,
            phone: session.phone,
            language: session.language,
            source: session.source,
            current_intent: session.current_intent,
            selected_category: session.selected_category,
            selected_product_id: session.selected_product_id,
            cart_items: session.cart_items,
            // cart_total: (session.cart_items as any[] || []).reduce(
            //     (sum, item) => sum + item.price * item.quantity, 0
            // ),
            status: session.status,
            order_id: session.order_id,
            metadata: session.metadata,
        },
    })
}