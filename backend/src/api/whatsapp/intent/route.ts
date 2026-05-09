import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import WhatsappModuleService from "../../../modules/whatsapp/service"
import { WHATSAPP_MODULE } from "../../../modules/whatsapp"


type IntentRequestBody = {
    intent: string          // "greeting" | "browse_phones" | "browse_laptops" | "browse_accessories" | "product_details" | "add_to_cart" | "confirm_order" | "cancel_order" | "not_interested" | "fallback"
    phone: string           // e.g. "254712345678"
    language?: string       // "en" | "sw"
    source?: string         // "ad" | "organic"
    category?: string       // "phones" | "laptops" | "accessories"
    product_id?: string     // filled when user views or selects a product
    metadata?: Record<string, unknown>
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const {
        intent,
        phone,
        language,
        source,
        category,
        product_id,
        metadata,
    } = req.body as IntentRequestBody

    // ---- Validation ----
    if (!intent || !phone) {
        return res.status(400).json({
            success: false,
            error: "intent and phone are required",
        })
    }

    const whatsappService: WhatsappModuleService =
        req.scope.resolve(WHATSAPP_MODULE)

    try {
        // ---- Find or create session ----
        let session = await whatsappService.findByPhone(phone)

        if (!session) {
            // First time we see this user — must be a greeting
            session = await whatsappService.createWhatsappSessions({
                phone,
                language: language || "en",
                source: source || "organic",
                current_intent: intent,
                status: "browsing",
                metadata,
            })

            return res.status(201).json({
                success: true,
                action: "session_created",
                session_id: session.id,
                current_intent: session.current_intent,
                status: session.status,
                message: getReplyMessage(intent, language || "en"),
            })
        }

        // ---- Session exists — update based on intent ----
        const updates = resolveIntentUpdates({
            intent,
            category,
            product_id,
            language,
            source,
            metadata,
        })

        session = await whatsappService.updateWhatsappSessions({
            id: session.id,
            ...updates,
        })

        return res.json({
            success: true,
            action: "session_updated",
            session_id: session.id,
            current_intent: session.current_intent,
            status: session.status,
            selected_category: session.selected_category,
            selected_product_id: session.selected_product_id,
            // Send back the right reply message for Infobip to use
            message: getReplyMessage(intent, session.language || "en"),
        })

    } catch (error) {
        console.error("[POST /whatsapp/intent] Error:", error)
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}

// ---- Helper: build DB update object based on intent ----
function resolveIntentUpdates({
    intent,
    category,
    product_id,
    language,
    source,
    metadata,
}: Partial<IntentRequestBody>) {
    const base = { current_intent: intent }

    switch (intent) {
        case "greeting":
            return {
                ...base,
                language: language || "en",
                source: source || "organic",
                status: "browsing",
            }

        case "browse_phones":
            return { ...base, selected_category: "phones", status: "browsing" }

        case "browse_laptops":
            return { ...base, selected_category: "laptops", status: "browsing" }

        case "browse_accessories":
            return { ...base, selected_category: "accessories", status: "browsing" }

        case "product_details":
            return { ...base, selected_product_id: product_id, status: "browsing" }

        case "add_to_cart":
            return {
                ...base,
                selected_product_id: product_id,
                status: "ordering",
            }

        case "confirm_order":
            return { ...base, status: "ordering" }

        case "cancel_order":
            return { ...base, status: "dropped" }

        case "not_interested":
            return { ...base, status: "dropped" }

        case "fallback":
            return { ...base, metadata }

        default:
            return { ...base }
    }
}

// ---- Helper: what message to send back to Infobip ----
// Infobip can use this in the next dialog node response
function getReplyMessage(intent: string, language: string): string {
    const messages: Record<string, Record<string, string>> = {
        greeting: {
            en: "Hi there! 👋 Welcome to Redki Shop — your go-to electronics store in Kenya! What are you looking for today?",
            sw: "Habari! 👋 Karibu Redki Shop — duka lako bora la electronics Kenya! Unatafuta nini leo?",
        },
        browse_phones: {
            en: "Great choice! 📱 Here are our latest phones:",
            sw: "Vizuri! 📱 Hizi ndizo simu zetu za kisasa:",
        },
        browse_laptops: {
            en: "Great choice! 💻 Here are our latest laptops:",
            sw: "Vizuri! 💻 Hizi ndizo laptop zetu za kisasa:",
        },
        browse_accessories: {
            en: "Great choice! 🎧 Here are our accessories:",
            sw: "Vizuri! 🎧 Hizi ndizo accessories zetu:",
        },
        product_details: {
            en: "Here are the details for that product 👇",
            sw: "Hizi ndizo maelezo ya bidhaa hiyo 👇",
        },
        add_to_cart: {
            en: "Added to your cart! 🛒 Want to keep shopping or place your order?",
            sw: "Imeongezwa kwenye cart yako! 🛒 Unataka kuendelea kununua au kutuma order?",
        },
        confirm_order: {
            en: "Perfect! Let's confirm your order. What's your full name?",
            sw: "Sawa! Tuthibitishe order yako. Jina lako kamili ni nani?",
        },
        cancel_order: {
            en: "No problem! Your order has been cancelled. Let us know if you need anything else 😊",
            sw: "Sawa! Order yako imefutwa. Tuambie ukihitaji kitu kingine 😊",
        },
        not_interested: {
            en: "No worries! Feel free to come back anytime 😊",
            sw: "Sawa sawa! Rudi wakati wowote 😊",
        },
        fallback: {
            en: "I didn't quite get that 🤔 You can type: Phones, Laptops, or Accessories",
            sw: "Sijaelewa vizuri 🤔 Unaweza andika: Simu, Laptop, au Accessories",
        },
    }

    return messages[intent]?.[language] ?? messages[intent]?.["en"] ?? "How can I help you?"
}