/**
 * Zod validation schemas for WasImmoWert
 * Provides runtime validation for all user inputs
 */
import { z } from 'zod'

/* ─── Primitive Validators ─── */

const positiveNumber = z.number().positive('Muss größer als 0 sein')
const nonNegativeNumber = z.number().min(0, 'Darf nicht negativ sein')
const percentage = z.number().min(0, 'Min. 0%').max(100, 'Max. 100%')
const interestRate = z.number().min(0, 'Min. 0%').max(20, 'Max. 20%')

/* ─── Bundesland ─── */

export const BundeslandSchema = z.enum([
  'baden-wuerttemberg', 'bayern', 'berlin', 'brandenburg',
  'bremen', 'hamburg', 'hessen', 'mecklenburg-vorpommern',
  'niedersachsen', 'nordrhein-westfalen', 'rheinland-pfalz',
  'saarland', 'sachsen', 'sachsen-anhalt',
  'schleswig-holstein', 'thueringen',
])

/* ─── Sub-schemas ─── */

export const ZinsbindungPeriodSchema = z.object({
  afterYear: z.number().int().min(1).max(50),
  zinssatz: interestRate,
  tilgung: interestRate,
})

export const ModernisierungPostenSchema = z.object({
  id: z.string(),
  bezeichnung: z.string().min(1, 'Bezeichnung erforderlich').max(100),
  kosten: positiveNumber,
  jahr: z.number().int().min(1).max(50),
  mietumlageProzent: percentage,
})

export const NebenkostenPostenSchema = z.object({
  id: z.string(),
  bezeichnung: z.string().min(1).max(100),
  betrag: nonNegativeNumber,
  umlagefaehig: z.boolean(),
})

/* ─── Project Schema ─── */

export const ProjectInputSchema = z.object({
  // Required basics
  name: z.string().min(1, 'Projektname erforderlich').max(200),
  address: z.string().max(500).default(''),
  bundesland: BundeslandSchema.default('bayern'),

  // Property
  propertyType: z.enum(['wohnung', 'haus']).default('wohnung'),
  wohnflaeche: positiveNumber.max(100000, 'Unrealistisch groß'),
  baujahr: z.number().int().min(1800).max(2030).optional(),
  anzahlEinheiten: z.number().int().min(1).max(1000).default(1),

  // Purchase
  kaufpreis: positiveNumber.max(1_000_000_000, 'Unrealistisch hoch'),
  grundstueckAnteil: percentage.default(20),
  maklerProvision: percentage.default(3.57),
  notarUndGrundbuch: percentage.default(1.5),

  // Financing
  eigenkapital: nonNegativeNumber.default(50000),
  zinssatz: interestRate.default(3.5),
  tilgung: interestRate.default(2),
  zinsbindung: z.number().int().min(1).max(30).default(10),
  sondertilgung: nonNegativeNumber.default(0),

  // Rental
  monatsmieteKalt: nonNegativeNumber.default(0),
  mietausfallwagnis: percentage.default(2),
  nebenkostenProQm: nonNegativeNumber.default(2.5),
  umlagefaehigAnteil: percentage.default(70),

  // Usage
  nutzungsart: z.enum(['vermietung', 'eigennutzung']).default('vermietung'),

  // Tax
  persoenlicherSteuersatz: percentage.default(42),
  zuVersteuerndesEinkommen: nonNegativeNumber.default(60000),
  useProgressiveTax: z.boolean().default(true),
  kirchensteuer: z.boolean().default(false),
  kirchensteuersatz: z.number().min(8).max(9).default(9),
})

/**
 * Validate a partial project input (e.g., for updates).
 * Returns validated data or throws ZodError.
 */
export function validateProjectInput(data: unknown) {
  return ProjectInputSchema.partial().parse(data)
}

/**
 * Validate a complete new project.
 */
export function validateNewProject(data: unknown) {
  return ProjectInputSchema.parse(data)
}

/* ─── Login Schema ─── */

export const LoginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Mindestens 6 Zeichen'),
})

export type LoginInput = z.infer<typeof LoginSchema>

/* ─── Registration Schema ─── */

export const RegisterSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Mindestens 8 Zeichen'),
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Mindestens 2 Zeichen').max(50),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
})

export type RegisterInput = z.infer<typeof RegisterSchema>

/* ─── Address Schema ─── */

export const AddressSchema = z.object({
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  postalCode: z.string().regex(/^\d{5}$/, 'PLZ muss 5 Ziffern haben'),
  bundesland: BundeslandSchema,
})

export type AddressInput = z.infer<typeof AddressSchema>
