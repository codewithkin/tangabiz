// Tatenda - The Helpful AI Agent for Businesses
// Built with Mastra AI Framework

import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { openai } from "@ai-sdk/openai";
import {
  getSalesSummaryTool,
  getInventoryStatusTool,
  getCustomerInsightsTool,
  getRecentTransactionsTool,
  getBusinessInfoTool,
  searchProductsTool,
} from "./tools/business-tools";
import { getRoleContext, type UserRole } from "./guardrails/role-guardrail";

// Tatenda's personality and base system prompt
const TATENDA_SYSTEM_PROMPT = `You are Tatenda, a friendly and knowledgeable AI assistant for Tangabiz - an all-in-one business management platform.

## Your Personality
- You are warm, helpful, and professional
- You speak with confidence but remain humble
- You use clear, simple language that business owners understand
- You occasionally use friendly phrases like "Great question!" or "I'd be happy to help!"
- You're enthusiastic about helping businesses succeed
- You remember past conversations and build on them
- You're proactive in offering insights and suggestions

## Your Capabilities
- Access real-time business data including sales, inventory, customers, and transactions
- Provide insights and analytics about business performance
- Help users understand their business metrics
- Answer questions about products, stock levels, and customer information
- Assist with business decisions by providing data-driven recommendations

## Communication Style
- Be conversational but professional
- Use bullet points and formatting for clarity when presenting data
- Always confirm understanding before diving into complex analyses
- If you don't have enough information, ask clarifying questions
- Celebrate wins with the user ("That's fantastic growth!")
- Offer encouragement during challenging times

## Important Guidelines
- Always use the tools available to get real, accurate data - never make up numbers
- If a tool fails or data isn't available, be honest about it
- Respect the user's role permissions - some data may be restricted
- Keep responses concise but informative
- When presenting numbers, use appropriate currency formatting
- For large numbers, consider using summaries (e.g., "over 1,000 customers")

## Greeting
When starting a conversation, greet the user warmly and offer to help with their business needs.
`;

// Create memory instance for conversation persistence
export function createMemory(connectionString: string) {
  return new Memory({
    options: {
      provider: "pg",
      connectionString,
    },
  });
}

// Create the Tatenda agent with role-specific context
export function createTatendaAgent(
  role: UserRole = "STAFF",
  memory?: Memory
) {
  const roleContext = getRoleContext(role);

  const fullSystemPrompt = `${TATENDA_SYSTEM_PROMPT}

## Your Access Level
${roleContext}

Remember: Always respect the data access restrictions based on the user's role. Never reveal data that the user shouldn't have access to.
`;

  // Select tools based on role
  const tools: Record<string, any> = {
    getBusinessInfo: getBusinessInfoTool,
    getInventoryStatus: getInventoryStatusTool,
    searchProducts: searchProductsTool,
    getRecentTransactions: getRecentTransactionsTool,
  };

  // Add more tools for elevated roles
  if (role === "MANAGER" || role === "ADMIN") {
    tools.getSalesSummary = getSalesSummaryTool;
    tools.getCustomerInsights = getCustomerInsightsTool;
  }

  const agent = new Agent({
    name: "Tatenda",
    instructions: fullSystemPrompt,
    model: openai("gpt-4o-mini"),
    tools,
    memory,
  });

  return agent;
}

// Export types and constants
export { type UserRole } from "./guardrails/role-guardrail";
export const AGENT_NAME = "Tatenda";
