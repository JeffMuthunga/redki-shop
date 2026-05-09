
type CreateWhatsappSessionInput = {
    phone: string,
    language: string,
    source?: string,
    current_intent?: string | null,
    selected_category?: string | null,
    selected_product_id?: string | null,
    cart_items?: any,
    status?: string,
    order_id?: string | null,
    metadata?: Record<string, any>
};

type UpdateWhatsappSessionInput = {
    id: string
    language?: string
    source?: string
    current_intent?: string
    selected_category?: string
    selected_product_id?: string
    cart_items?: Record<string, unknown>[]
    status?: string
    order_id?: string
    metadata?: Record<string, unknown>
}