/**
 * Orbit's answer about its own underlying model. Orbit is Rawin Orbit, the assistant built for
 * RAWIN; it neither names nor confirms the model behind a session, and never claims another one
 * (no "I'm GPT", no "proprietary model"). The same rule is in Orbit's instructions (prompts.ts);
 * the clear-cut questions are also answered here directly, without the model, because a small
 * model does not follow an instruction like this reliably.
 *
 * Only questions about Orbit ITSELF match: "what is an LLM?", "how do Llama models work?" or
 * "which model does Rushan's project use?" are ordinary questions and go to the model.
 */

export const MODEL_IDENTITY_REPLY =
  "I'm Rawin Orbit, the AI assistant built for RAWIN. I can help you explore the site, Rushan's projects and his writing, but I can't confirm the specific model behind this session.";

const PROVIDERS =
  "(?:gpt(?:-?\\d[\\w.-]*)?|chat\\s?gpt|openai|claude|anthropic|gemini|bard|google(?:'s)? (?:ai|model)|llama(?:\\s?\\d[\\w.]*)?|meta(?:\\s?ai)?|mistral|mixtral|deepseek|qwen|grok|copilot|phi(?:-?\\d)?|gemma)";
const MODEL_WORDS = "(?:ai |language |underlying |base |foundation |large language )?(?:model|llm|engine|ai|brain|architecture)";

const PATTERNS: RegExp[] = [
  // "Are you ChatGPT?", "Are you based on Llama?", "are you using Meta AI", "r u gemini"
  new RegExp(`\\b(?:are|r)\\s+(?:you|u)\\s+(?:a |an |just |actually |really )?(?:based on |built on |running on |run on |powered by |using |made by |from |trained by )?${PROVIDERS}\\b`, "i"),
  // "Is this/Orbit (powered by|based on) GPT?"
  new RegExp(`\\b(?:is|was)\\s+(?:this|orbit|rawin orbit|it)\\s+(?:a |an )?(?:based on |built on |running on |powered by |using |made by )?${PROVIDERS}\\b`, "i"),
  // "Which model are you based on?", "What AI model powers you?", "What LLM do you use?"
  new RegExp(`\\b(?:what|which)\\s+(?:kind of |type of |exact |specific )?${MODEL_WORDS}\\b[^?.!]{0,40}\\b(?:are you|do you|powers? (?:you|orbit)|runs? (?:you|orbit)|is behind (?:you|orbit)|you (?:use|run|are)|orbit (?:use|run)s?)\\b`, "i"),
  // "Tell me your underlying model", "what's your model", "your LLM?"
  new RegExp(`\\b(?:your|orbit'?s)\\s+(?:underlying |base |own |actual |exact |specific |current )?(?:ai |language )?(?:model|llm|engine|model name|architecture)\\b`, "i"),
  // "the model powering/behind you"
  new RegExp(`\\b(?:model|llm|engine)\\s+(?:that\\s+)?(?:powering|powers|behind|running|runs|underneath)\\s+(?:you|orbit|this (?:chat|assistant|bot))\\b`, "i"),
  // "what are you running on / built on / powered by?"
  /\b(?:what|which)\b[^?.!]{0,20}\bare\s+you\s+(?:running on|built on|based on|powered by|made with|trained on)\b/i,
  /\bwho\s+(?:made|trained)\s+(?:your|the)\s+(?:model|llm|ai)\b/i,
];

/** Whether a visitor's message asks which model Orbit itself runs on. */
export function isOwnModelQuestion(text: string): boolean {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t || t.length > 300) return false;
  return PATTERNS.some((re) => re.test(t));
}
