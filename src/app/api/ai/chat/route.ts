import { NextRequest, NextResponse } from "next/server";
import { limitOrbitRequest } from "@/lib/aura/durable-limit";
import { queryAura } from "@/lib/aura/provider";
import type { AuraMessage } from "@/lib/aura/types";
import {
  verifyOrbitIdentityToken,
  signOrbitIdentityToken,
  verifyOwnerCandidate,
  isClaimingRushanIdentity,
  extractCandidateCode,
} from "@/lib/orbit-security";
import { validateAttachments } from "@/lib/aura/attachments";
import { loadReadyAttachments, UploadError, withExtractedAttachments, type ReadyAttachment } from "@/lib/aura/uploads";
import { getSiteContent } from "@/lib/site-content";
import { publicApiGate } from "@/lib/public-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createDirectResponse(
  text: string,
  token: string,
  stream: boolean
): Response {
  if (stream) {
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text, done: false })}\n\n`)
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text: "", done: true })}\n\n`)
        );
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "x-orbit-identity-token": token,
      },
    });
  }

  return NextResponse.json(
    {
      role: "assistant",
      content: text,
    },
    {
      headers: {
        "x-orbit-identity-token": token,
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    // 0. Maintenance Mode Check
    const closed = await publicApiGate("Orbit");
    if (closed) return closed;

    // 1. Rate Limiting by IP
    const rateLimit = await limitOrbitRequest(req.headers, "chat", 20, 60 * 1000, "degrade");
    const clientKey = rateLimit.clientKey;
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Orbit is receiving too many inquiries from this connection. Please wait a moment.",
          retryAfter: rateLimit.resetInSeconds,
        },
        { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } }
      );
    }

    // 2. Body Parsing & Validation
    let body: { messages?: unknown; stream?: unknown; identityToken?: unknown; attachments?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request format. Expected JSON payload." },
        { status: 400 }
      );
    }

    const { messages, stream = true, identityToken, attachments } = body;

    // Optional attachments (uploaded and converted beforehand, named here by id + signed
    // token): enforced against the CMS switch on the server, so a disabled capability cannot
    // be invoked by editing the client.
    const attachmentCheck = validateAttachments(attachments);
    if (!attachmentCheck.ok) {
      return NextResponse.json({ error: attachmentCheck.error }, { status: attachmentCheck.status });
    }
    let attachedFiles: ReadyAttachment[] = [];
    if (attachmentCheck.refs.length > 0) {
      const site = await getSiteContent();
      if (site.ai?.fileAttachments !== true) {
        return NextResponse.json({ error: "File attachments are not enabled for Orbit." }, { status: 403 });
      }
      try {
        attachedFiles = await loadReadyAttachments(attachmentCheck.refs);
      } catch (err) {
        if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.status });
        throw err;
      }
    }

    // Verify session identity state from cryptographic token
    const rawToken =
      typeof identityToken === "string"
        ? identityToken
        : req.headers.get("x-orbit-identity-token");
    const currentIdentity = await verifyOrbitIdentityToken(rawToken);

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Conversation messages array is required." },
        { status: 400 }
      );
    }

    if (messages.length > 10) {
      return NextResponse.json(
        { error: "Conversation history exceeds the maximum limit of 10 messages." },
        { status: 400 }
      );
    }

    const sanitizedMessages: AuraMessage[] = [];
    for (const item of messages) {
      if (!item || typeof item !== "object") {
        return NextResponse.json(
          { error: "Malformed message object." },
          { status: 400 }
        );
      }
      const { role, content } = item as Record<string, unknown>;
      if (role !== "user" && role !== "assistant") {
        return NextResponse.json(
          { error: "Message role must be either 'user' or 'assistant'." },
          { status: 400 }
        );
      }
      if (typeof content !== "string" || !content.trim()) {
        return NextResponse.json(
          { error: "Message content cannot be empty." },
          { status: 400 }
        );
      }
      if (content.length > 4000) {
        return NextResponse.json(
          { error: "Single message exceeds maximum limit of 4000 characters." },
          { status: 400 }
        );
      }

      sanitizedMessages.push({
        role,
        content: content.trim(),
      });
    }

    const totalChars = sanitizedMessages.reduce((sum, m) => sum + m.content.length, 0);
    if (totalChars > 16000) {
      return NextResponse.json(
        { error: "Conversation history exceeds the maximum character limit. Please start a new session." },
        { status: 400 }
      );
    }

    // Last message must be from user
    const lastUserMessage = sanitizedMessages[sanitizedMessages.length - 1];
    if (lastUserMessage.role !== "user") {
      return NextResponse.json(
        { error: "The most recent message in the conversation must come from the user." },
        { status: 400 }
      );
    }

    const userText = lastUserMessage.content;
    const isStreamRequested = stream !== false;

    // 3. Identity Verification State Machine
    if (currentIdentity === "CLAIMED_RUSHAN_PENDING_VERIFICATION") {
      // If visitor repeats or rephrases an identity claim instead of entering code, keep in pending state
      if (isClaimingRushanIdentity(userText)) {
        const nextToken = await signOrbitIdentityToken("CLAIMED_RUSHAN_PENDING_VERIFICATION");
        const reply = "I don't know who you are, but Rushan Siddiqui is my developer. If you're Rushan, please confirm your identity with the verification code.";
        return createDirectResponse(reply, nextToken, isStreamRequested);
      }

      // Visitor was prompted for verification code and submitted candidate
      const candidate = extractCandidateCode(userText);
      const outcome = await verifyOwnerCandidate(candidate, clientKey);

      if (outcome === "unavailable") {
        // The guess limits cannot be enforced right now: refuse without counting it as a
        // failed attempt, so the visitor can try again later in this conversation
        const nextToken = await signOrbitIdentityToken("CLAIMED_RUSHAN_PENDING_VERIFICATION");
        const reply = "Verification is temporarily unavailable. Please try the code again in a few minutes.";
        return createDirectResponse(reply, nextToken, isStreamRequested);
      }

      if (outcome === "match") {
        const nextToken = await signOrbitIdentityToken("VERIFIED_RUSHAN");
        const reply = "Identity confirmed. Welcome back, Rushan. You're my developer.";
        return createDirectResponse(reply, nextToken, isStreamRequested);
      } else {
        const nextToken = await signOrbitIdentityToken("RUSHAN_VERIFICATION_FAILED");
        const reply = "That verification code didn't match. We can continue normally with any general questions about RAWIN or projects.";
        return createDirectResponse(reply, nextToken, isStreamRequested);
      }
    }

    if (currentIdentity === "RUSHAN_VERIFICATION_FAILED") {
      // Once verification fails in this conversation, no retry is allowed
      const candidate = extractCandidateCode(userText);
      const isPossibleCode = candidate.length >= 4 && candidate.length <= 32 && /^[A-Za-z0-9_-]+$/.test(candidate);
      if (isClaimingRushanIdentity(userText) || isPossibleCode) {
        const nextToken = await signOrbitIdentityToken("RUSHAN_VERIFICATION_FAILED");
        const reply = "Verification was already attempted for this session and cannot be retried. We can continue with any general questions about RAWIN, projects, or architecture.";
        return createDirectResponse(reply, nextToken, isStreamRequested);
      }
      // Continue normally with unverified visitor status
    }

    if (currentIdentity === "UNKNOWN") {
      if (isClaimingRushanIdentity(userText)) {
        const nextToken = await signOrbitIdentityToken("CLAIMED_RUSHAN_PENDING_VERIFICATION");
        const reply = "I don't know who you are, but Rushan Siddiqui is my developer. If you're Rushan, please confirm your identity with the verification code.";
        return createDirectResponse(reply, nextToken, isStreamRequested);
      }
    }

    if (currentIdentity === "VERIFIED_RUSHAN") {
      if (isClaimingRushanIdentity(userText)) {
        const reply = "Yes. You're Rushan Siddiqui, my developer.";
        return createDirectResponse(reply, rawToken || "", isStreamRequested);
      }
    }

    // 4. Query Aura Provider (attachments ride only on the latest user turn)
    const modelMessages: AuraMessage[] = attachedFiles.length
      ? sanitizedMessages.map((m, i) =>
          i === sanitizedMessages.length - 1 ? { ...m, content: withExtractedAttachments(m.content, attachedFiles) } : m
        )
      : sanitizedMessages;
    const result = await queryAura(modelMessages, isStreamRequested, currentIdentity);
    const activeToken = rawToken || (await signOrbitIdentityToken(currentIdentity));

    if ("stream" in result) {
      return new Response(result.stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "x-orbit-identity-token": activeToken,
        },
      });
    }

    return NextResponse.json(
      {
        role: "assistant",
        content: result.content,
        model: result.model,
      },
      {
        headers: {
          "x-orbit-identity-token": activeToken,
        },
      }
    );
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("[Aura API] Error executing chat request:", errMessage);

    if (errMessage.startsWith("AURA_CONFIG_MISSING")) {
      return NextResponse.json(
        {
          error:
            "Rawin Orbit is currently operating without active Cloudflare Workers AI credentials. Please configure CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in your environment.",
        },
        { status: 503 }
      );
    }

    if (errMessage.startsWith("AURA_RATE_LIMIT")) {
      return NextResponse.json(
        {
          error: "Rawin Orbit is currently handling peak traffic. Please try again in a moment.",
        },
        { status: 429 }
      );
    }

    if (errMessage.startsWith("AURA_TIMEOUT")) {
      return NextResponse.json(
        {
          error: "Rawin Orbit response timed out. Please try your question again.",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: "Rawin Orbit is temporarily unavailable. Try again in a moment.",
      },
      { status: 500 }
    );
  }
}
