import { Router } from "express";

const router = Router();

const RESOURCES: Record<string, unknown> = {
  students: {
    name: "élève",
    primaryKey: "id",
    titleField: "name",
    fields: [
      { key: "name", label: "Nom", type: "text", required: true, sortable: true, showInTable: true, showInForm: true },
      { key: "subject", label: "Matière", type: "badge", required: true, sortable: true, showInTable: true, showInForm: true,
        options: [
          { value: "Mathématiques", label: "Mathématiques", tone: "info" },
          { value: "Algorithmique", label: "Algorithmique", tone: "info" },
          { value: "C", label: "C", tone: "neutral" },
          { value: "Python", label: "Python", tone: "success" },
          { value: "JavaScript", label: "JavaScript", tone: "warning" },
          { value: "Autre", label: "Autre", tone: "neutral" },
        ] },
      { key: "level", label: "Niveau", type: "select", required: true, sortable: true, showInTable: true, showInForm: true,
        options: [
          { value: "Collège", label: "Collège" },
          { value: "Lycée", label: "Lycée" },
          { value: "Université", label: "Université" },
          { value: "Pro", label: "Pro" },
        ] },
      { key: "hourlyRate", label: "Tarif / h", type: "currency", required: true, sortable: true, showInTable: true, showInForm: true, currencyField: "currency" },
      { key: "currency", label: "Devise", type: "text", required: true, showInTable: false, showInForm: true, defaultValue: "EUR" },
      { key: "status", label: "Statut", type: "badge", required: true, sortable: true, showInTable: true, showInForm: true,
        options: [
          { value: "active", label: "Actif", tone: "success" },
          { value: "paused", label: "En pause", tone: "warning" },
          { value: "ended", label: "Terminé", tone: "neutral" },
        ] },
      { key: "contact", label: "Contact", type: "text", showInTable: false, showInForm: true },
      { key: "notes", label: "Notes", type: "textarea", showInTable: false, showInForm: true },
      { key: "updatedAt", label: "Mis à jour", type: "date", sortable: true, showInTable: true, showInForm: false },
    ],
  },
  sessions: {
    name: "séance",
    primaryKey: "id",
    titleField: "studentName",
    fields: [
      { key: "studentName", label: "Élève", type: "text", sortable: true, showInTable: true, showInForm: false },
      { key: "studentId", label: "ID Élève", type: "integer", required: true, sortable: false, showInTable: false, showInForm: true },
      { key: "occurredAt", label: "Date", type: "datetime", required: true, sortable: true, showInTable: true, showInForm: true },
      { key: "durationMinutes", label: "Durée (min)", type: "integer", required: true, sortable: true, showInTable: true, showInForm: true, defaultValue: 60 },
      { key: "ratePerHour", label: "Tarif / h", type: "currency", required: true, sortable: true, showInTable: true, showInForm: true, currencyField: "currency" },
      { key: "currency", label: "Devise", type: "text", required: true, showInTable: false, showInForm: true, defaultValue: "EUR" },
      { key: "amount", label: "Montant", type: "currency", sortable: true, showInTable: true, showInForm: false, currencyField: "currency" },
      { key: "paid", label: "Payé", type: "boolean", sortable: true, showInTable: true, showInForm: true, defaultValue: false },
      { key: "notes", label: "Notes", type: "textarea", showInTable: false, showInForm: true },
    ],
  },
  transactions: {
    name: "opération",
    primaryKey: "id",
    titleField: "category",
    fields: [
      { key: "type", label: "Type", type: "badge", required: true, sortable: true, showInTable: true, showInForm: true,
        options: [
          { value: "income", label: "Revenu", tone: "success" },
          { value: "expense", label: "Dépense", tone: "danger" },
        ] },
      { key: "source", label: "Source", type: "badge", required: true, sortable: true, showInTable: true, showInForm: true,
        options: [
          { value: "tutoring", label: "Cours", tone: "info" },
          { value: "apps", label: "Apps", tone: "success" },
          { value: "pdfs", label: "PDFs", tone: "warning" },
          { value: "other", label: "Autre", tone: "neutral" },
        ] },
      { key: "category", label: "Catégorie", type: "text", required: true, sortable: true, showInTable: true, showInForm: true },
      { key: "amount", label: "Montant", type: "currency", required: true, sortable: true, showInTable: true, showInForm: true, currencyField: "currency" },
      { key: "currency", label: "Devise", type: "text", required: true, showInTable: false, showInForm: true, defaultValue: "EUR" },
      { key: "occurredAt", label: "Date", type: "datetime", required: true, sortable: true, showInTable: true, showInForm: true },
      { key: "description", label: "Description", type: "textarea", showInTable: false, showInForm: true },
    ],
  },
  products: {
    name: "produit",
    primaryKey: "id",
    titleField: "name",
    fields: [
      { key: "name", label: "Nom", type: "text", required: true, sortable: true, showInTable: true, showInForm: true },
      { key: "category", label: "Catégorie", type: "text", required: true, sortable: true, showInTable: true, showInForm: true },
      { key: "price", label: "Prix", type: "currency", required: true, sortable: true, showInTable: true, showInForm: true, currencyField: "currency" },
      { key: "currency", label: "Devise", type: "text", required: true, showInTable: false, showInForm: true, defaultValue: "EUR" },
      { key: "status", label: "Statut", type: "badge", required: true, sortable: true, showInTable: true, showInForm: true,
        options: [
          { value: "active", label: "Actif", tone: "success" },
          { value: "inactive", label: "Inactif", tone: "neutral" },
          { value: "pending", label: "En attente", tone: "warning" },
        ] },
      { key: "notes", label: "Notes", type: "textarea", showInTable: false, showInForm: true },
    ],
  },
};

router.get("/schema/:resource", (req, res) => {
  const r = RESOURCES[req.params.resource];
  if (!r) return res.status(404).json({ error: "Unknown resource" });
  res.json(r);
});

export default router;
