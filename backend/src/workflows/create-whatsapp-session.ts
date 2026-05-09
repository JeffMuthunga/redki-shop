import {
    createStep,
    StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { WHATSAPP_MODULE } from "../modules/whatsapp"
import WhatsappModuleService from "../modules/whatsapp/service"


export const createWhatsappSessionStep = createStep(
    "create-whatsapp-session-step",
    async (input: CreateWhatsappSessionInput, { container }) => {
        const whatsappModuleService: WhatsappModuleService = container.resolve(
            WHATSAPP_MODULE
        )

        const whatsappSession = await whatsappModuleService.createWhatsappSessions(input)

        return new StepResponse(whatsappSession, whatsappSession.id)
    }
)