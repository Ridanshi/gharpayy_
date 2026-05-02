import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import { createActivity, createProperty, createReservation, createTask, getProperty, listActivity, listAnalytics, listProperties, listReservations, listTasks, listUsers, listVisits, updateProperty, updateReservation, updateTask, updateUser, updateVisit } from "../controllers/resourceControllers.js";
import { authorize, protect } from "../middleware/auth.js";

export const resourceRoutes = Router();

resourceRoutes.use(protect);
resourceRoutes.get("/dashboard", getDashboard);
resourceRoutes.route("/activity").get(listActivity).post(createActivity);
resourceRoutes.get("/users", authorize("Admin", "Sales Ops"), listUsers);
resourceRoutes.patch("/users/:id", authorize("Admin"), updateUser);
resourceRoutes.route("/properties").get(listProperties).post(createProperty);
resourceRoutes.route("/properties/:id").get(getProperty).patch(updateProperty);
resourceRoutes.get("/visits", listVisits);
resourceRoutes.patch("/visits/:id", updateVisit);
resourceRoutes.get("/reservations", listReservations);
resourceRoutes.post("/reservations", createReservation);
resourceRoutes.patch("/reservations/:id", updateReservation);
resourceRoutes.route("/tasks").get(listTasks).post(createTask);
resourceRoutes.patch("/tasks/:id", updateTask);
resourceRoutes.get("/analytics", listAnalytics);
