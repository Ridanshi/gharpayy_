import { Lead } from "../models/Lead.js";
import { Note } from "../models/Note.js";
import { Property } from "../models/Property.js";
import { Task } from "../models/Task.js";
import { Visit } from "../models/Visit.js";
import { Activity } from "../models/Activity.js";
import { matchProperty, scoreLead } from "../services/aiService.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created, ok } from "../utils/apiResponse.js";

export const listLeads = asyncHandler(async (req, res) => {
  const { q, stage, agent, sort = "-aiScore" } = req.query;
  const filter: Record<string, unknown> = {};
  if (stage) filter.stage = stage;
  if (agent) filter.assignedAgent = agent;
  if (req.user?.role === "Sales Agent") filter.assignedAgent = req.user.id;
  if (q) filter.$text = { $search: String(q) };
  const leads = await Lead.find(filter).populate("assignedAgent", "name avatar role").sort(String(sort)).limit(100);
  ok(res, leads.map((lead) => {
    const intelligence = scoreLead(lead.toObject());
    return { ...lead.toObject(), aiScore: intelligence.urgencyScore, conversionProbability: intelligence.conversionProbability, intelligence };
  }));
});

export const createLead = asyncHandler(async (req, res) => {
  const lead = await Lead.create({
    ...req.body,
    assignedAgent: req.body.assignedAgent ?? req.user?.id,
    activity: [{ type: "lead.created", title: "Lead captured", actor: req.user?.id }]
  });
  await Activity.create({ type: "lead.created", title: "New lead captured", actor: req.user?.id, lead: lead.id });
  created(res, lead);
});

export const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id).populate("assignedAgent", "name avatar role");
  if (!lead) throw new AppError("Lead not found", 404);
  if (req.user?.role === "Sales Agent" && String(lead.assignedAgent?._id) !== req.user.id) {
    throw new AppError("Lead not found", 404);
  }
  const [notes, tasks, visits, properties] = await Promise.all([
    Note.find({ lead: lead.id }).populate("author", "name avatar").sort({ createdAt: -1 }),
    Task.find({ lead: lead.id }).populate("owner", "name avatar").sort({ dueAt: 1 }),
    Visit.find({ lead: lead.id }).populate("property agent").sort({ scheduledAt: 1 }),
    Property.find({ locality: lead.preferredLocation }).limit(10)
  ]);
  const recommendations = properties
    .map((property) => ({ property, match: matchProperty(lead.toObject(), property.toObject()) }))
    .sort((a, b) => b.match.score - a.match.score);
  const intelligence = scoreLead(lead.toObject());
  ok(res, { lead: { ...lead.toObject(), aiScore: intelligence.urgencyScore, conversionProbability: intelligence.conversionProbability, intelligence }, notes, tasks, visits, recommendations });
});

export const updateLead = asyncHandler(async (req, res) => {
  const current = await Lead.findById(req.params.id);
  if (!current) throw new AppError("Lead not found", 404);
  const stageChanged = req.body.stage && req.body.stage !== current.stage;
  Object.assign(current, req.body, { lastActivityAt: new Date() });
  if (stageChanged) current.statusHistory.push({ stage: req.body.stage, changedBy: req.user?.id as never, changedAt: new Date() } as never);
  const ai = scoreLead(current.toObject());
  current.aiScore = ai.urgencyScore;
  current.conversionProbability = ai.conversionProbability;
  await current.save();
  await Activity.create({ type: "lead.updated", title: stageChanged ? `Lead moved to ${req.body.stage}` : "Lead updated", actor: req.user?.id, lead: current.id });
  ok(res, current);
});

export const addNote = asyncHandler(async (req, res) => {
  const note = await Note.create({ lead: req.params.id, author: req.user?.id, body: req.body.body, attachments: req.body.attachments ?? [] });
  await Lead.findByIdAndUpdate(req.params.id, {
    $inc: { notesCount: 1 },
    $push: { activity: { type: "note.added", title: "Note added", description: req.body.body, actor: req.user?.id, createdAt: new Date() } },
    lastActivityAt: new Date()
  });
  await Activity.create({ type: "note.added", title: "Note added", description: req.body.body, actor: req.user?.id, lead: req.params.id });
  created(res, note);
});

export const scheduleVisit = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw new AppError("Lead not found", 404);

  const visit = await Visit.create({
    lead: lead.id,
    property: req.body.property,
    agent: lead.assignedAgent ?? req.user?.id,
    scheduledAt: req.body.scheduledAt,
    status: "Scheduled"
  });

  lead.stage = lead.stage === "New" || lead.stage === "Contacted" ? "Tour Scheduled" : lead.stage;
  lead.nextFollowUpAt = new Date(req.body.scheduledAt);
  lead.lastActivityAt = new Date();
  lead.activity.push({
    type: "tour.scheduled",
    title: "Tour scheduled",
    description: req.body.note ?? "Property visit scheduled from lead workspace.",
    actor: req.user?.id as never,
    createdAt: new Date()
  } as never);
  await lead.save();
  await Activity.create({ type: "tour.scheduled", title: "Tour scheduled", description: req.body.note, actor: req.user?.id, lead: lead.id, property: req.body.property });
  created(res, await visit.populate("property agent lead"));
});

export const logCall = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        activity: {
          type: "call.logged",
          title: req.body.outcome ? `Call logged: ${req.body.outcome}` : "Call logged",
          description: req.body.summary ?? "Call activity recorded.",
          actor: req.user?.id,
          createdAt: new Date()
        }
      },
      lastContactedAt: new Date(),
      lastActivityAt: new Date()
    },
    { new: true }
  );
  if (!lead) throw new AppError("Lead not found", 404);
  await Activity.create({ type: "call.logged", title: "Call logged", description: req.body.summary, actor: req.user?.id, lead: lead.id });
  ok(res, lead);
});
