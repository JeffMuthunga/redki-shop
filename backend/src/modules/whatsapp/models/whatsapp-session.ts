import { model } from "@medusajs/framework/utils";


const WhatsappSession = model.define('whatsapp_session', {
    id: model.id().primaryKey(),
    phone: model.text(),                    // customer's WhatsApp number
    language: model.text().default("en"),   // en or sw
    source: model.text().default("organic"),// ad or organic
    current_intent: model.text().nullable(),
    selected_category: model.text().nullable(),
    selected_product_id: model.text().nullable(),
    cart_items: model.json().nullable(),
    status: model.text().default("browsing"),
    order_id: model.text().nullable(),
    metadata: model.json().nullable(),
})

export default WhatsappSession
