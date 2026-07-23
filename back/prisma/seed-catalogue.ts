import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

/** Récupère DATABASE_URL depuis l'environnement ou le fichier .env. */
function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const env = readFileSync(join(__dirname, '..', '.env'), 'utf8');
  const m = env.match(/^DATABASE_URL="(.+)"$/m);
  if (!m) throw new Error('DATABASE_URL introuvable dans .env');
  return m[1];
}

const prisma = new PrismaClient({ datasourceUrl: getDatabaseUrl() });

const qr = () => 'BS-' + randomBytes(6).toString('hex').toUpperCase();
const couverture = (isbn: string) =>
  // default=false : renvoie 404 si pas de couverture (au lieu d'une image vide 1×1)
  `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`;

interface LivreSeed {
  titre: string;
  auteur: string;
  isbn: string;
  categorie: string;
  cote: string;
  description: string;
  exemplaires: number;
}

const LIVRES: LivreSeed[] = [
  // --- Informatique ---
  { titre: 'Clean Code', auteur: 'Robert C. Martin', isbn: '9780132350884', categorie: 'Informatique', cote: 'INFO-101', description: "Un manuel de savoir-faire pour écrire du code lisible, maintenable et élégant.", exemplaires: 3 },
  { titre: 'The Pragmatic Programmer', auteur: 'Hunt & Thomas', isbn: '9780135957059', categorie: 'Informatique', cote: 'INFO-102', description: "Les bonnes pratiques et l'état d'esprit du développeur pragmatique.", exemplaires: 2 },
  { titre: 'Introduction to Algorithms', auteur: 'Thomas H. Cormen', isbn: '9780262033848', categorie: 'Informatique', cote: 'INFO-103', description: "La référence incontournable sur les algorithmes et les structures de données.", exemplaires: 4 },
  { titre: 'Design Patterns', auteur: 'Gang of Four', isbn: '9780201633610', categorie: 'Informatique', cote: 'INFO-104', description: "Les 23 patrons de conception orientée objet réutilisables.", exemplaires: 2 },
  { titre: 'Code Complete', auteur: 'Steve McConnell', isbn: '9780735619678', categorie: 'Informatique', cote: 'INFO-105', description: "Guide pratique de la construction logicielle.", exemplaires: 2 },

  // --- Littérature ---
  { titre: 'Le Petit Prince', auteur: 'Antoine de Saint-Exupéry', isbn: '9782070408504', categorie: 'Littérature', cote: 'LITT-201', description: "Un conte poétique et philosophique, le plus lu au monde.", exemplaires: 4 },
  { titre: "L'Étranger", auteur: 'Albert Camus', isbn: '9782070360024', categorie: 'Littérature', cote: 'LITT-202', description: "Le roman emblématique de l'absurde et de l'indifférence.", exemplaires: 3 },
  { titre: 'Les Misérables', auteur: 'Victor Hugo', isbn: '9782070409228', categorie: 'Littérature', cote: 'LITT-203', description: "Fresque sociale de la France du XIXe siècle autour de Jean Valjean.", exemplaires: 2 },
  { titre: 'Candide', auteur: 'Voltaire', isbn: '9782070392582', categorie: 'Littérature', cote: 'LITT-204', description: "Conte philosophique satirique sur l'optimisme.", exemplaires: 3 },
  { titre: 'Le Comte de Monte-Cristo', auteur: 'Alexandre Dumas', isbn: '9782253098058', categorie: 'Littérature', cote: 'LITT-205', description: "Un chef-d'œuvre d'aventure et de vengeance.", exemplaires: 2 },

  // --- Science ---
  { titre: 'Une brève histoire du temps', auteur: 'Stephen Hawking', isbn: '9782081450486', categorie: 'Science', cote: 'SCI-301', description: "Du Big Bang aux trous noirs, la cosmologie accessible à tous.", exemplaires: 2 },
  { titre: 'Cosmos', auteur: 'Carl Sagan', isbn: '9780345539435', categorie: 'Science', cote: 'SCI-302', description: "Un voyage émerveillé à travers l'univers et la science.", exemplaires: 2 },

  // --- Histoire ---
  { titre: 'Sapiens', auteur: 'Yuval Noah Harari', isbn: '9782226257017', categorie: 'Histoire', cote: 'HIST-401', description: "Une brève histoire de l'humanité, de la préhistoire à aujourd'hui.", exemplaires: 3 },

  // --- Philosophie ---
  { titre: 'Ainsi parlait Zarathoustra', auteur: 'Friedrich Nietzsche', isbn: '9782070329304', categorie: 'Philosophie', cote: 'PHIL-501', description: "L'œuvre poétique et philosophique majeure de Nietzsche.", exemplaires: 1 },
  { titre: 'Méditations', auteur: 'Marc Aurèle', isbn: '9782070424924', categorie: 'Philosophie', cote: 'PHIL-502', description: "Les pensées stoïciennes d'un empereur philosophe.", exemplaires: 2 },

  // --- Roman / Fantasy ---
  { titre: "Harry Potter à l'école des sorciers", auteur: 'J.K. Rowling', isbn: '9782070584628', categorie: 'Roman', cote: 'ROM-601', description: "Le premier tome des aventures du célèbre apprenti sorcier.", exemplaires: 4 },
  { titre: 'Le Seigneur des Anneaux', auteur: 'J.R.R. Tolkien', isbn: '9782266282314', categorie: 'Roman', cote: 'ROM-602', description: "L'épopée fondatrice de la fantasy moderne.", exemplaires: 3 },
  { titre: '1984', auteur: 'George Orwell', isbn: '9782070368228', categorie: 'Roman', cote: 'ROM-603', description: "Le roman dystopique sur la surveillance et le totalitarisme.", exemplaires: 3 },
];

async function main() {
  let crees = 0;
  let ignores = 0;

  for (const l of LIVRES) {
    const existe = await prisma.livre.findFirst({ where: { titre: l.titre } });
    if (existe) {
      ignores++;
      console.log(`⏭️  ${l.titre} (déjà présent)`);
      continue;
    }
    await prisma.livre.create({
      data: {
        titre: l.titre,
        auteur: l.auteur,
        isbn: l.isbn,
        categorie: l.categorie,
        description: l.description,
        couverture: couverture(l.isbn),
        cote: l.cote,
        exemplaires: {
          create: Array.from({ length: l.exemplaires }, () => ({ qrCode: qr() })),
        },
      },
    });
    crees++;
    console.log(`✅ ${l.titre} (${l.exemplaires} exemplaires)`);
  }

  console.log(`\nTerminé : ${crees} livre(s) créé(s), ${ignores} ignoré(s).`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed catalogue :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
