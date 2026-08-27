/**
 * Telnyx SMS + Voice notifications for the Closing Coordinator.
 * Sends real messages when deal reaches Ready to Close or HOLD state.
 */

// In-memory store for pending TTS messages (call_control_id -> message)
export const pendingTTS = new Map<string, { message: string; apiKey: string }>();

export interface NotifyRequest {
  action: "notify_buyer_agent" | "notify_seller_agent" | "send_to_lender" | "hold_all_parties" | "escalate_compliance";
  dealInfo: {
    property: string;
    fileNumber: string;
    buyers: string[];
    sellers: string[];
    status: "ready" | "hold";
    flags?: string[];
  };
  recipientPhone?: string;
}

interface TelnyxEnv {
  TELNYX_API_KEY: string;
  TELNYX_PHONE_NUMBER: string;
  TELNYX_MESSAGING_PROFILE_ID?: string;
  TELNYX_CALL_CONTROL_APP_ID?: string;
  DEMO_NOTIFY_PHONE?: string;
}

function buildMessage(req: NotifyRequest): { sms: string; voice: string } {
  const { action, dealInfo } = req;
  const addr = dealInfo.property || "property on file";
  const file = dealInfo.fileNumber || "N/A";

  if (dealInfo.status === "hold") {
    const flagText = dealInfo.flags?.join("; ") || "Discrepancy detected";
    return {
      sms: `[TitleWise ALERT] TRANSACTION HOLD - File ${file}\n\n${addr}\n\nReason: ${flagText}\n\nDO NOT proceed with wire transfer. Contact your closing coordinator immediately for verification.`,
      voice: `Attention. This is an urgent alert from TitleWise regarding file number ${file} for the property at ${addr}. A discrepancy has been detected in the transaction documents. Do NOT proceed with any wire transfers. Please contact your closing coordinator immediately for verification. I repeat, do not wire any funds until cleared.`,
    };
  }

  switch (action) {
    case "notify_buyer_agent":
      return {
        sms: `[TitleWise] File ${file} - ${addr}\n\nAll documents verified. Transaction is CLEAR TO CLOSE.\n\nClosing package ready for buyer review. No discrepancies found across ${dealInfo.buyers.length > 0 ? dealInfo.buyers.join(" & ") : "buyers"}'s documents.`,
        voice: `Hello, this is the TitleWise Closing Coordinator. I'm calling regarding file number ${file} for the property at ${addr}. Good news: all documents have been verified by our multi-agent panel and the transaction is clear to close. The closing package is ready for your buyer's review. Please check your email for the full summary. Thank you.`,
      };
    case "notify_seller_agent":
      return {
        sms: `[TitleWise] File ${file} - ${addr}\n\nAll conditions met. Transaction is CLEAR TO CLOSE.\n\nSeller's documents verified. Wire instructions confirmed. Ready to proceed to closing.`,
        voice: `Hello, this is the TitleWise Closing Coordinator. I'm calling regarding file number ${file} for the property at ${addr}. All conditions have been met and the transaction is clear to close. Seller's documents are verified and wire instructions have been confirmed. We are ready to proceed. Thank you.`,
      };
    case "send_to_lender":
      return {
        sms: `[TitleWise] File ${file} - ${addr}\n\nClosing summary generated. All title requirements satisfied. Clear to fund.\n\nDocuments verified: Title Commitment, Closing Disclosure, Wire Instructions, HOA Estoppel.`,
        voice: `Hello, this is the TitleWise Closing Coordinator. I'm calling regarding file number ${file} for ${addr}. The closing summary has been generated. All title requirements are satisfied and the transaction is clear to fund. All documents have been verified including title commitment, closing disclosure, wire instructions, and HOA estoppel letter. Thank you.`,
      };
    default:
      return {
        sms: `[TitleWise] Update on File ${file} - ${addr}. Please check the TitleWise dashboard for details.`,
        voice: `Hello, this is the TitleWise Closing Coordinator with an update on file number ${file}. Please check the TitleWise dashboard for details. Thank you.`,
      };
  }
}

export async function sendSMS(
  env: TelnyxEnv,
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const res = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.TELNYX_API_KEY}`,
      },
      body: JSON.stringify(env.TELNYX_MESSAGING_PROFILE_ID
        ? { from: env.TELNYX_PHONE_NUMBER, to, text: message, messaging_profile_id: env.TELNYX_MESSAGING_PROFILE_ID }
        : { from: env.TELNYX_PHONE_NUMBER, to, text: message }
      ),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `Telnyx SMS error ${res.status}: ${err}` };
    }

    const data: any = await res.json();
    return { success: true, messageId: data.data?.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function makeVoiceCall(
  env: TelnyxEnv,
  to: string,
  ttsMessage: string
): Promise<{ success: boolean; callId?: string; error?: string }> {
  try {
    const res = await fetch("https://api.telnyx.com/v2/calls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.TELNYX_API_KEY}`,
      },
      body: JSON.stringify({
        connection_id: env.TELNYX_CALL_CONTROL_APP_ID || env.TELNYX_MESSAGING_PROFILE_ID,
        to,
        from: env.TELNYX_PHONE_NUMBER,
        answering_machine_detection: "detect",
        custom_headers: [],
        command_id: crypto.randomUUID(),
        webhook_url: "https://titlewise.app/api/telnyx-webhook",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `Telnyx Call error ${res.status}: ${err}` };
    }

    const data: any = await res.json();
    const callControlId = data.data?.call_control_id;

    if (callControlId) {
      pendingTTS.set(callControlId, { message: ttsMessage, apiKey: env.TELNYX_API_KEY });
    }

    return { success: true, callId: callControlId };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function handleNotification(
  req: NotifyRequest,
  env: TelnyxEnv,
  mode: "sms" | "voice" | "both" = "sms"
): Promise<{ sms?: any; voice?: any; message: string }> {
  const phone = req.recipientPhone || env.DEMO_NOTIFY_PHONE;
  if (!phone) {
    return { message: "No recipient phone number configured" };
  }

  const messages = buildMessage(req);
  const results: { sms?: any; voice?: any; message: string } = { message: "" };

  if (mode === "sms" || mode === "both") {
    results.sms = await sendSMS(env, phone, messages.sms);
  }

  if (mode === "voice" || mode === "both") {
    results.voice = { success: false, error: "Voice calls temporarily disabled" };
  }

  const sent = [];
  if (results.sms?.success) sent.push("SMS");
  if (results.voice?.success) sent.push("Voice call");
  results.message = sent.length > 0
    ? `${sent.join(" + ")} sent to ${phone}`
    : `Notification attempted but failed: ${results.sms?.error || results.voice?.error || "unknown"}`;

  return results;
}
