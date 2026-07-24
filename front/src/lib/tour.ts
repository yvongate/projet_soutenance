'use client';

import { driver, type DriveStep } from 'driver.js';
import type { User } from '@/lib/types';
import { aRole, estStaff } from '@/lib/types';

/** Rôle principal (le plus large) : sert au choix des étapes du tour. */
export type ProfilTour = 'admin' | 'staff' | 'etudiant';

function profilTour(user: User): ProfilTour {
  if (aRole(user, 'ADMINISTRATEUR')) return 'admin';
  if (estStaff(user)) return 'staff';
  return 'etudiant';
}

const bienvenue: DriveStep = {
  popover: {
    title: 'Bienvenue sur BiblioSmart 📚',
    description:
      'Voici une visite rapide des fonctionnalités. Vous pourrez la revoir à tout moment depuis votre profil (en haut à droite).',
  },
};

const notifications: DriveStep = {
  element: '[data-tour="notifications"]',
  popover: {
    title: 'Notifications 🔔',
    description:
      'Rappels de retour, disponibilité d’un livre réservé, réponses… tout arrive ici.',
  },
};

function etapes(profil: ProfilTour): DriveStep[] {
  if (profil === 'admin') {
    return [
      bienvenue,
      {
        element: '[data-tour="/admin/comptes"]',
        popover: {
          title: 'Gestion des comptes 👥',
          description:
            'Créez et gérez les utilisateurs : étudiants, bibliothécaires et administrateurs.',
        },
      },
      {
        element: '[data-tour="/catalogue"]',
        popover: {
          title: 'Le catalogue 📖',
          description:
            'Consultez les livres. La gestion complète (ajout de livres, exemplaires et QR Codes) se fait depuis l’Accueil → Catalogue.',
        },
      },
      {
        element: '[data-tour="/stats"]',
        popover: {
          title: 'Statistiques 📊',
          description:
            'Le tableau de bord complet : emprunts, retards, livres et catégories populaires.',
        },
      },
      {
        popover: {
          title: 'Le guichet 🎫',
          description:
            'En tant qu’administrateur, vous avez aussi accès au guichet (depuis l’accueil) : y valider les emprunts en scannant le QR de transaction, et enregistrer les retours en scannant le QR du livre.',
        },
      },
      {
        element: '[data-tour="/tickets"]',
        popover: {
          title: 'Messagerie 💬',
          description: 'La boîte partagée regroupant toutes les demandes des étudiants.',
        },
      },
      notifications,
    ];
  }

  if (profil === 'staff') {
    return [
      bienvenue,
      {
        element: '[data-tour="/guichet"]',
        popover: {
          title: 'Le guichet 🎫',
          description:
            'Validez les emprunts (scan du QR de transaction), enregistrez les retours et inscrivez de nouveaux étudiants.',
        },
      },
      {
        element: '[data-tour="/catalogue"]',
        popover: {
          title: 'Le catalogue 📖',
          description: 'Consultez les livres et la disponibilité des exemplaires.',
        },
      },
      {
        element: '[data-tour="/stats"]',
        popover: {
          title: 'Statistiques 📊',
          description: 'Suivez l’activité : emprunts en cours, retards, livres populaires.',
        },
      },
      {
        element: '[data-tour="/tickets"]',
        popover: {
          title: 'Messagerie 💬',
          description: 'La boîte partagée des demandes des étudiants — répondez-y ici.',
        },
      },
      notifications,
    ];
  }

  // Étudiant
  return [
    bienvenue,
    {
      element: '[data-tour="/catalogue"]',
      popover: {
        title: 'Le catalogue 📖',
        description: 'Recherchez et parcourez tous les livres de la bibliothèque.',
      },
    },
    {
      element: '[data-tour="/emprunts"]',
      popover: {
        title: 'Emprunter un livre 📲',
        description:
          'Scannez le QR Code d’un livre pour générer votre demande, puis présentez-la au guichet. Vos emprunts en cours apparaissent ici.',
      },
    },
    {
      element: '[data-tour="/reservations"]',
      popover: {
        title: 'Réserver 🔖',
        description:
          'Un livre est indisponible ? Réservez-le : vous serez notifié dès qu’il revient.',
      },
    },
    {
      element: '[data-tour="/tickets"]',
      popover: {
        title: 'Messagerie 💬',
        description: 'Une question ? Ouvrez un ticket, la bibliothèque vous répond.',
      },
    },
    notifications,
  ];
}

/**
 * Lance la visite guidée pour l'utilisateur donné.
 * @param onTermine appelé quand le tour se ferme (fin ou abandon).
 */
export function lancerTour(user: User, onTermine?: () => void): void {
  const instance = driver({
    showProgress: true,
    allowClose: true,
    overlayColor: 'rgba(0,0,0,0.6)',
    nextBtnText: 'Suivant',
    prevBtnText: 'Précédent',
    doneBtnText: 'Terminer',
    progressText: '{{current}} / {{total}}',
    steps: etapes(profilTour(user)),
    onDestroyed: () => onTermine?.(),
  });
  instance.drive();
}
