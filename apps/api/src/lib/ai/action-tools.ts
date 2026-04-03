import prisma from "../prisma.js";

export type AiActionToolName =
  | "createCashflowTransaction"
  | "createProperty"
  | "createTenant"
  | "createMaintenanceRequest";

export type AiPlannedToolCall = {
  toolName: AiActionToolName;
  args: Record<string, unknown>;
};

export type AiActionPlan = {
  summary: string;
  toolCalls: AiPlannedToolCall[];
};

export type ActionExecutionContext = {
  userId: string;
  organizationId: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const asString = (value: unknown) => {
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s : null;
};

const asOptionalString = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return asString(value);
};

const asNumber = (value: unknown) => {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
};

const asPositiveNumber = (value: unknown) => {
  const n = asNumber(value);
  if (n == null) return null;
  return n > 0 ? n : null;
};

const asDate = (value: unknown) => {
  const s = asString(value);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

export const supportedActionToolNames: AiActionToolName[] = [
  "createCashflowTransaction",
  "createProperty",
  "createTenant",
  "createMaintenanceRequest"
];

/**
 * Zero-dependency parser used when OPENAI is unavailable.
 * Accepts JSON messages like:
 * {"tool":"createProperty","args":{...}}
 * {"actionType":"createTenant","payload":{...}}
 * {"toolCalls":[{"toolName":"createCashflowTransaction","args":{...}}]}
 */
export const parseMessageToToolCalls = (message: string): AiPlannedToolCall[] => {
  const trimmed = message.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (isRecord(parsed)) {
        if (Array.isArray(parsed.toolCalls)) {
          return parsed.toolCalls
            .map((call) => {
              if (!isRecord(call)) return null;
              const toolName = asString(call.toolName ?? call.tool ?? call.name);
              const args = isRecord(call.args) ? call.args : isRecord(call.arguments) ? call.arguments : {};
              if (!toolName) return null;
              if (!supportedActionToolNames.includes(toolName as AiActionToolName)) return null;
              return { toolName: toolName as AiActionToolName, args };
            })
            .filter(Boolean) as AiPlannedToolCall[];
        }

        const toolName = asString(parsed.tool ?? parsed.toolName ?? parsed.actionType ?? parsed.name);
        const args = isRecord(parsed.args) ? parsed.args : isRecord(parsed.payload) ? parsed.payload : {};
        if (toolName && supportedActionToolNames.includes(toolName as AiActionToolName)) {
          return [{ toolName: toolName as AiActionToolName, args }];
        }
      }
    } catch {
      // ignore
    }
  }

  // Heuristic fallback for offline mode (when OPENAI is unavailable):
  // Detect simple cashflow log intents from natural language.
  // Examples:
  // - "log an expense $85 utilities yesterday"
  // - "record income 1200 rent today"
  const lower = trimmed.toLowerCase();
  const verb = /(log|record|add|enter|create)\b/.test(lower);
  const isExpense = /\bexpense\b/.test(lower) || /\bspent\b/.test(lower);
  const isIncome = /\bincome\b/.test(lower) || /\breceived\b/.test(lower);
  if (verb && (isExpense || isIncome)) {
    // amount: grab first number-like token
    const amountMatch = trimmed.replace(/,/g, "").match(/(\$?)(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? Number(amountMatch[2]) : null;

    // date: today/yesterday only (extend later)
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const date = /\byesterday\b/.test(lower) ? yesterday : today;
    const toISO = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // category: try to pick the word after amount, otherwise null (clarify step will ask)
    let category: string | null = null;
    if (amountMatch) {
      const after = trimmed.slice(amountMatch.index! + amountMatch[0].length).trim();
      if (after) {
        // take first 1-3 tokens until we hit a date-ish word
        const tokens = after.split(/\s+/).filter(Boolean);
        const stopWords = new Set(["today", "yesterday", "on", "for"]);
        const catTokens: string[] = [];
        for (const t of tokens) {
          const tl = t.toLowerCase();
          if (stopWords.has(tl)) break;
          catTokens.push(t.replace(/[^\w-]/g, ""));
          if (catTokens.length >= 3) break;
        }
        const joined = catTokens.join(" ").trim();
        if (joined) category = joined;
      }
    }

    const type = isIncome ? "income" : "expense";
    const args: Record<string, unknown> = {
      type,
      amount: amount ?? undefined,
      date: toISO(date),
      category: category ?? undefined
    };

    return [{ toolName: "createCashflowTransaction", args }];
  }

  // Create tenant heuristic: "create tenant Jane Doe"
  if (/\bcreate\s+tenant\b/.test(lower)) {
    const after = trimmed.replace(/\bcreate\s+tenant\b/i, "").trim();
    const parts = after.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return [
        {
          toolName: "createTenant",
          args: {
            firstName: parts[0],
            lastName: parts.slice(1).join(" ")
          }
        }
      ];
    }
    return [{ toolName: "createTenant", args: {} }];
  }

  // Create property heuristic: "create a property called X at 123 ..."
  if (/\bcreate\s+(a\s+)?property\b/.test(lower)) {
    const nameMatch = trimmed.match(/(?:called|named)\s+([^,]+?)(?:\s+at\s+|,|$)/i);
    const atMatch = trimmed.match(/\bat\s+([^,]+?)(?:,|$)/i);
    const cityStateZipMatch = trimmed.match(/,\s*([^,]+),\s*([A-Z]{2})\s*(\d{5})(?:\b|$)/);
    const name = nameMatch ? nameMatch[1].trim() : undefined;
    const addressLine1 = atMatch ? atMatch[1].trim() : undefined;
    const city = cityStateZipMatch ? cityStateZipMatch[1].trim() : undefined;
    const state = cityStateZipMatch ? cityStateZipMatch[2].trim() : undefined;
    const postalCode = cityStateZipMatch ? cityStateZipMatch[3].trim() : undefined;

    return [
      {
        toolName: "createProperty",
        args: {
          name,
          addressLine1,
          city,
          state,
          postalCode
        }
      }
    ];
  }

  // Create maintenance request heuristic: "create maintenance request ..."
  if (/\bcreate\s+(a\s+)?maintenance\s+request\b/.test(lower)) {
    // We can't reliably resolve propertyId from name without a model/read tool.
    // Still return a planned call so /ai/chat can enter clarify mode and offer property choices.
    const titleMatch = trimmed.replace(/\bcreate\s+(a\s+)?maintenance\s+request\s*:?\s*/i, "").trim();
    return [
      {
        toolName: "createMaintenanceRequest",
        args: {
          title: titleMatch || undefined
        }
      }
    ];
  }

  return [];
};

const ensurePropertyInOrg = async (organizationId: string, propertyId: string) => {
  const ok = await prisma.property.findFirst({
    where: { id: propertyId, organizationId },
    select: { id: true }
  });
  return Boolean(ok);
};

const ensureUnitInOrg = async (organizationId: string, unitId: string) => {
  const ok = await prisma.unit.findFirst({
    where: { id: unitId, organizationId },
    select: { id: true, propertyId: true }
  });
  return ok;
};

const ensureTenantInOrg = async (organizationId: string, tenantId: string) => {
  const ok = await prisma.tenant.findFirst({
    where: { id: tenantId, organizationId },
    select: { id: true }
  });
  return Boolean(ok);
};

export const executeActionTool = async (toolName: AiActionToolName, args: Record<string, unknown>, ctx: ActionExecutionContext) => {
  const userId = ctx.userId;
  const organizationId = ctx.organizationId;

  switch (toolName) {
    case "createCashflowTransaction": {
      const typeRaw = asString(args.type);
      const type = typeRaw?.toLowerCase() === "income" || typeRaw === "INCOME" ? "INCOME" : typeRaw?.toLowerCase() === "expense" || typeRaw === "EXPENSE" ? "EXPENSE" : null;
      if (!type) throw new Error("type is required (income|expense)");

      const amount = asPositiveNumber(args.amount);
      if (amount == null) throw new Error("amount must be a positive number");

      const date = asDate(args.date);
      if (!date) throw new Error("date is required and must be a valid ISO date");

      const category = asString(args.category);
      if (!category) throw new Error("category is required");

      const propertyId = asOptionalString(args.propertyId);
      if (propertyId) {
        const ok = await ensurePropertyInOrg(organizationId, propertyId);
        if (!ok) throw new Error("Invalid propertyId");
      }

      const notes = asOptionalString(args.notes);

      return prisma.transaction.create({
        data: {
          organizationId,
          userId,
          type,
          amount,
          date,
          category,
          propertyId: propertyId ?? undefined,
          notes: notes ?? undefined
        }
      });
    }

    case "createProperty": {
      const name = asString(args.name);
      const addressLine1 = asString(args.addressLine1);
      const city = asString(args.city);
      const state = asString(args.state);
      const postalCode = asString(args.postalCode);
      if (!name || !addressLine1 || !city || !state || !postalCode) {
        throw new Error("Missing required fields: name, addressLine1, city, state, postalCode");
      }

      const addressLine2 = asOptionalString(args.addressLine2);
      const country = asString(args.country) ?? "US";
      const notes = asOptionalString(args.notes);

      return prisma.property.create({
        data: {
          userId,
          organizationId,
          name,
          addressLine1,
          addressLine2: addressLine2 ?? undefined,
          city,
          state,
          postalCode,
          country,
          notes: notes ?? undefined
        }
      });
    }

    case "createTenant": {
      const firstName = asString(args.firstName);
      const lastName = asString(args.lastName);
      if (!firstName || !lastName) {
        throw new Error("Missing required fields: firstName, lastName");
      }
      const email = asOptionalString(args.email);
      const phone = asOptionalString(args.phone);

      return prisma.tenant.create({
        data: {
          userId,
          organizationId,
          firstName,
          lastName,
          email: email ?? undefined,
          phone: phone ?? undefined
        }
      });
    }

    case "createMaintenanceRequest": {
      const propertyId = asString(args.propertyId);
      const title = asString(args.title);
      if (!propertyId || !title) {
        throw new Error("Missing required fields: propertyId, title");
      }

      const okProperty = await ensurePropertyInOrg(organizationId, propertyId);
      if (!okProperty) throw new Error("Invalid propertyId");

      const unitId = asOptionalString(args.unitId);
      if (unitId) {
        const unit = await ensureUnitInOrg(organizationId, unitId);
        if (!unit) throw new Error("Invalid unitId");
      }

      const tenantId = asOptionalString(args.tenantId);
      if (tenantId) {
        const okTenant = await ensureTenantInOrg(organizationId, tenantId);
        if (!okTenant) throw new Error("Invalid tenantId");
      }

      const description = asOptionalString(args.description);
      const cost = args.cost == null ? undefined : asPositiveNumber(args.cost) ?? null;
      if (cost === null) throw new Error("cost must be a positive number");

      return prisma.maintenanceRequest.create({
        data: {
          userId,
          organizationId,
          propertyId,
          unitId: unitId ?? undefined,
          tenantId: tenantId ?? undefined,
          title,
          description: description ?? undefined,
          cost: cost ?? undefined
        }
      });
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};
