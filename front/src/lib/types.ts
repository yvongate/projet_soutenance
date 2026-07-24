// Types partagés, alignés sur le backend BiblioSmart

export type Role = 'ETUDIANT' | 'BIBLIOTHECAIRE' | 'ADMINISTRATEUR';

/** Réponse paginée standard du backend. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface User {
  id: string;
  matricule: string | null;
  nom: string;
  prenom: string;
  email: string;
  roles: Role[];
  premiereConnexion: boolean;
  tutorielVu: boolean;
  actif: boolean;
}

/** Réponse de POST /auth/login */
export interface LoginResponse {
  premiereConnexion: boolean;
  message?: string;
  email?: string;
  access_token?: string;
  user?: User;
}

/** Réponse de POST /auth/change-password */
export interface ChangePasswordResponse {
  message: string;
  access_token: string;
  user: User;
}

// ---------------------- Catalogue ----------------------

export type StatutExemplaire = 'DISPONIBLE' | 'EMPRUNTE' | 'RESERVE';

export interface Livre {
  id: string;
  titre: string;
  auteur: string;
  isbn: string | null;
  categorie: string;
  description: string | null;
  couverture: string | null;
  cote: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Élément de la liste du catalogue (avec compteurs de disponibilité). */
export interface LivreListItem extends Livre {
  nbExemplaires: number;
  nbDisponibles: number;
}

export interface Exemplaire {
  id: string;
  livreId: string;
  qrCode: string;
  statut: StatutExemplaire;
  createdAt: string;
}

/** Détail d'un livre avec ses exemplaires. */
export interface LivreDetail extends Livre {
  exemplaires: Exemplaire[];
  nbDisponibles: number;
}

export const STATUT_EXEMPLAIRE_LABEL: Record<StatutExemplaire, string> = {
  DISPONIBLE: 'Disponible',
  EMPRUNTE: 'Emprunté',
  RESERVE: 'Réservé',
};

// ---------------------- Emprunts ----------------------

/** Réponse de POST /emprunts/scanner (QR de transaction généré). */
export interface ScanTransactionResponse {
  token: string;
  expireAt: string;
  expireDansSecondes: number;
  livre: string;
}

export interface EmpruntBref {
  id: string;
  exemplaireId: string;
  userId: string;
  dateEmprunt: string;
  dateRetourPrevue: string;
  dateRetourEffective: string | null;
}

/** Réponse de POST /emprunts/valider. */
export interface ValiderEmpruntResponse {
  message: string;
  emprunt: EmpruntBref;
  dateRetourPrevue: string;
}

/** Réponse de POST /emprunts/retour. */
export interface RetourResponse {
  message: string;
  reservataireNotifie: string | null;
}

/** Élément de GET /emprunts/mes-emprunts. */
export interface MonEmprunt extends EmpruntBref {
  exemplaire: {
    id: string;
    qrCode: string;
    statut: StatutExemplaire;
    livre: { titre: string; auteur: string };
  };
}

/** Élément de GET /emprunts/historique. */
export interface EmpruntHistorique extends EmpruntBref {
  exemplaire: { qrCode: string; livre: { titre: string } };
  user: { nom: string; prenom: string; matricule: string | null };
}

// ---------------------- Notifications ----------------------

export type TypeNotification =
  | 'BIENVENUE'
  | 'EMPRUNT'
  | 'RAPPEL'
  | 'DISPONIBILITE'
  | 'MESSAGE';

/** Notification interne (nommée AppNotification pour ne pas masquer le global Notification). */
export interface AppNotification {
  id: string;
  userId: string;
  type: TypeNotification;
  message: string;
  lu: boolean;
  dateEnvoi: string;
}

// ---------------------- Administration ----------------------

/** Réponse de POST /users (création de compte par un admin/bibliothécaire). */
export interface CreatedUser {
  user: User;
  motDePasseTemporaire: string;
}

/** Réponse de GET /exemplaires/:id/qrcode. */
export interface QrCodeExemplaire {
  exemplaireId: string;
  qrCode: string;
  titre: string;
  image: string; // data:image/png;base64,...
}

/** Réponse de GET /stats/dashboard. */
export interface StatsDashboard {
  catalogue: {
    livres: number;
    exemplaires: number;
    disponibles: number;
    empruntes: number;
    reserves: number;
  };
  emprunts: { enCours: number; enRetard: number; total: number };
  utilisateurs: { total: number; etudiants: number };
  reservationsEnAttente: number;
  ticketsOuverts: number;
  topLivres: { nom: string; emprunts: number }[];
  topCategories: { nom: string; emprunts: number }[];
}

// ---------------------- Réservations ----------------------

export type StatutReservation =
  | 'EN_ATTENTE'
  | 'NOTIFIEE'
  | 'ANNULEE'
  | 'SATISFAITE';

/** Élément de GET /reservations/mes-reservations. */
export interface MaReservation {
  id: string;
  livreId: string;
  userId: string;
  dateReservation: string;
  statut: StatutReservation;
  position: number;
  positionActuelle: number;
  livre: { titre: string; auteur: string };
}

// ---------------------- Recommandations ----------------------

export interface LivreRecommande {
  id: string;
  titre: string;
  auteur: string;
  categorie: string;
  couverture?: string | null;
  score?: number;
  emprunts?: number;
}

/** Réponse de GET /recommandations. */
export interface Recommandations {
  aDesRecommandations: boolean;
  raison: string;
  categoriesFavorites?: string[];
  parCategories: LivreRecommande[];
  parSimilarite: LivreRecommande[];
}

// ---------------------- Tickets (messagerie) ----------------------

export type StatutTicket = 'OUVERT' | 'EN_COURS' | 'FERME';

export interface TicketListItem {
  id: string;
  sujet: string;
  statut: StatutTicket;
  updatedAt: string;
  dernierMessage: string | null;
  nonLus: number;
  /** Présent uniquement dans la vue staff (boîte partagée). */
  etudiant?: { nom: string; prenom: string; matricule: string | null };
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  expediteurId: string;
  contenu: string;
  lu: boolean;
  createdAt: string;
  expediteur: { id: string; nom: string; prenom: string };
}

export interface TicketDetail {
  id: string;
  etudiantId: string;
  sujet: string;
  statut: StatutTicket;
  prisEnChargeParId: string | null;
  createdAt: string;
  updatedAt: string;
  etudiant: { id: string; nom: string; prenom: string; matricule: string | null };
  prisEnCharge: { id: string; nom: string; prenom: string } | null;
  messages: TicketMessage[];
}

export const STATUT_TICKET_LABEL: Record<StatutTicket, string> = {
  OUVERT: 'Ouvert',
  EN_COURS: 'En cours',
  FERME: 'Fermé',
};

// Réutilise la palette sémantique de statut (globals.css) : Ouvert = actif
// (même bleu que « Emprunté »), En cours = ambre (même que « Réservé »),
// Fermé = neutre via les tokens de thème (s'adapte au mode sombre).
export const STATUT_TICKET_STYLE: Record<StatutTicket, string> = {
  OUVERT: 'badge-emprunte',
  EN_COURS: 'badge-reserve',
  FERME: 'bg-muted text-muted-foreground border-border',
};

// Libellés et couleurs par rôle (charte UML : bleu / vert / ambre)
export const ROLE_LABEL: Record<Role, string> = {
  ETUDIANT: 'Étudiant',
  BIBLIOTHECAIRE: 'Bibliothécaire',
  ADMINISTRATEUR: 'Administrateur',
};

export const ROLE_BADGE: Record<Role, string> = {
  ETUDIANT: 'bg-blue-100 text-blue-800 border-blue-200',
  BIBLIOTHECAIRE: 'bg-green-100 text-green-800 border-green-200',
  ADMINISTRATEUR: 'bg-amber-100 text-amber-800 border-amber-200',
};

/** True si l'utilisateur possède au moins un des rôles demandés. */
export function aRole(user: User | null, ...roles: Role[]): boolean {
  if (!user) return false;
  return user.roles.some((r) => roles.includes(r));
}

export const estStaff = (user: User | null) =>
  aRole(user, 'BIBLIOTHECAIRE', 'ADMINISTRATEUR');
