import { Router } from "express";
import { addNote, createLead, getLead, listLeads, logCall, scheduleVisit, updateLead } from "../controllers/leadController.js";
import { protect } from "../middleware/auth.js";

export const leadRoutes = Router();

leadRoutes.use(protect);
leadRoutes.route("/").get(listLeads).post(createLead);
leadRoutes.route("/:id").get(getLead).patch(updateLead);
leadRoutes.post("/:id/notes", addNote);
leadRoutes.post("/:id/visits", scheduleVisit);
leadRoutes.post("/:id/calls", logCall);
