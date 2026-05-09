import { MedusaService } from "@medusajs/framework/utils"
import WhatsappSession from "./models/whatsapp-session"

class WhatsappModuleService extends MedusaService({
    WhatsappSession,
}) {
    async findByPhone(phone: string) {
        const sessions = await this.listWhatsappSessions({ phone })
        return sessions[0] || null
    }
    async upsertSession(
        phone: string,
        data: Omit<CreateWhatsappSessionInput, "phone">
    ) {
        const existing = await this.findByPhone(phone)

        if (!existing) {
            return await this.createWhatsappSessions({ phone, ...data })
        }

        return await this.updateWhatsappSessions({
            id: existing.id,
            ...data,
        })
    }
    async addToCart(
        phone: string,
        item: { product_id: string; product_name: string; price: number; quantity: number }
    ) {
        const session = await this.findByPhone(phone)

        if (!session) {
            throw new Error(`No session found for phone: ${phone}`)
        }

        const existingCart = (session.cart_items as typeof item[]) || []
        const existingItem = existingCart.find(i => i.product_id === item.product_id)

        const updatedCart = existingItem
            ? existingCart.map(i =>
                i.product_id === item.product_id
                    ? { ...i, quantity: i.quantity + item.quantity }
                    : i
            )
            : [...existingCart, item]

        return await this.updateWhatsappSessions({
            id: session.id,
            cart_items: updatedCart,
            status: "ordering",
        })
    }

    // Calculate cart total
    async getCartTotal(phone: string): Promise<number> {
        const session = await this.findByPhone(phone)
        if (!session || !session.cart_items) return 0

        return (session.cart_items as any[]).reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        )
    }
}

export default WhatsappModuleService