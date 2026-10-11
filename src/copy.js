// SINGLE SOURCE OF TRUTH for all page copy.
// Every string here is taken word-for-word from the client's "Hope product bible" PDF.
// Check it any time with:  npm run check:copy
// Do not edit wording here without the client's approval.

export const COPY = {
  title: "Your AI Agent for Repetitive Business Work",

  what: {
    heading: "What is Hope?",
    parts: [
      "Think of Hope as a teammate who never clocks out.",
      "She's an AI agent built around your business and your industry, and she handles the research, outreach, support, campaigns, and reporting that eat up your team's week.",
      "That leaves your people free to focus on the big calls.",
      "Unlike a traditional chatbot that waits for a question and returns an answer, Hope is configured around how your business actually works and can carry tasks through from start to finish.",
    ],
  },

  problem: {
    heading: "The problem",
    lead: "Every business has work that is necessary but repetitive.",
    body: [
      "Teams spend hours researching information, responding to customers, following up with leads, scheduling meetings, updating systems, preparing reports, and processing routine requests.",
      "Hope is built to take on that layer of work so your team spends less time on repetitive operations and more time on higher-value work.",
    ],
  },

  can: {
    heading: "What Hope can do",
    intro: "Hope can be configured to handle workflows involving:",
    items: [
      ["Research", "Find and process the information needed to complete a task."],
      ["Communication", "Handle emails, customer conversations, outreach, replies, reminders and updates."],
      ["Decision Support", "Qualify, prioritize, route and recommend next actions within defined rules."],
      ["Workflow Execution", "Carry out multi-step tasks across the systems and processes your business uses."],
      ["Follow-Up", "Continue working after the first action instead of stopping at a single response."],
      ["Human Escalation", "Recognize when a situation requires human judgment and hand it over to the right person."],
    ],
  },

  how: {
    heading: "How Hope works",
    steps: ["Understand", "Research", "Decide", "Execute", "Communicate", "Follow Up", "Escalate"],
    body: [
      "Hope can take a task, work through the required steps, communicate the outcome and continue the process when follow-up is needed.",
      "When something requires human judgment, Hope brings a person into the loop.",
    ],
  },

  built: {
    heading: "Built around your business",
    lead: "Hope is not one-size-fits-all.",
    intro: "It can be configured around a specific:",
    levels: ["Team", "Business", "Industry", "Workflow"],
    body: "That means Hope can learn the information, processes, tools and rules relevant to the work it is responsible for.",
  },

  used: {
    heading: "Where Hope can be used",
    items: [
      ["Personal Assistant", "Manage emails, schedule meetings, organize calendars, conduct research, summarize meetings, set reminders, coordinate follow-ups, prepare reports, and help manage day-to-day tasks."],
      ["Automated Outreach System", "Hope automates the entire outreach process, from researching potential customers and crafting personalized messages to sending emails, managing replies, and following up automatically. It helps businesses reach more prospects, maintain consistent communication, nurture leads, and book more meetings without requiring a team member to manually manage every step."],
      ["Marketing", "Lead research, personalized outreach, follow-ups, reporting, customer support and campaign workflows."],
      ["Sales", "Lead qualification, prospect research, outbound personalization, CRM updates, meeting booking and follow-up."],
      ["E-commerce", "24 hours Customer support, order tracking, returns, product recommendations and abandoned-cart follow-up."],
      ["Financial Services", "24 hours Customer support, KYC intake, document processing, transaction investigations and other structured workflows."],
    ],
    outreach: ["Research", "Personalize", "Reach Out", "Follow Up", "Manage Replies", "Book Meeting"],
  },

  example: {
    heading: "A simple example",
    lead: "A sales team receives a new lead.",
    intro: "Instead of an employee manually researching the prospect, deciding whether they're qualified, writing an email, sending it, following up and updating the CRM:",
    steps: [
      "Hope receives the lead",
      "researches it",
      "qualifies it",
      "personalizes the outreach",
      "sends it",
      "follows up",
      "handles the response",
      "books the meeting",
      "updates the CRM",
    ],
    body: "The team gets the result without having to perform every repetitive step themselves.",
  },

  humans: {
    heading: "The role of humans",
    lead: "Hope is not designed to replace an entire workforce.",
    intro: "The model is:",
    loop: ["Hope handles", "Hope escalates", "Human decides", "Hope continues"],
    body: "People stay focused on judgment, relationships, strategy and decisions where human involvement matters most.",
  },

  outcome: {
    heading: "The outcome",
    lead: "Hope gives businesses a continuous operational layer that can work around the clock.",
    intro: "The goal is simple:",
    goal: "Less repetitive work for your team. More time for the business.",
    simplest: "The simplest way to describe Hope",
    line: "Hope doesn’t just answer. Hope works.",
  },
};

// Interface chrome that is NOT client copy (placeholder until the client supplies a CTA).
export const UI = {
  brand: "Hope",
  cta: "Get in touch",
};
