// Tatenda AI Module Exports

export { createTatendaAgent, createMemory, AGENT_NAME, type UserRole } from "./agent";
export { businessTools } from "./tools/business-tools";
export {
  ROLE_PERMISSIONS,
  SENSITIVE_FIELDS,
  hasPermission,
  getRoleContext,
  filterResponseByRole,
  checkRequestGuardrail,
  sanitizeOutput,
} from "./guardrails/role-guardrail";
