import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Crée le compte Administrateur initial.
 * C'est le seul compte qui ne peut être créé par personne d'autre.
 */
async function main() {
  const email = 'admin@bibliosmart.local';
  const motDePasse = 'Admin@1234'; // ⚠️ à changer en production

  const existant = await prisma.utilisateur.findUnique({ where: { email } });
  if (existant) {
    console.log('ℹ️  Admin déjà existant — seed ignoré.');
    return;
  }

  const hash = await bcrypt.hash(motDePasse, 10);
  await prisma.utilisateur.create({
    data: {
      nom: 'Admin',
      prenom: 'BiblioSmart',
      email,
      roles: [Role.ADMINISTRATEUR],
      motDePasse: hash,
      premiereConnexion: false, // l'admin peut se connecter directement
      actif: true,
    },
  });

  console.log('✅ Administrateur créé');
  console.log(`   Email        : ${email}`);
  console.log(`   Mot de passe : ${motDePasse}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
