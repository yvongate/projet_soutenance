import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // En-têtes HTTP de sécurité. API consommée en cross-origin par le front :
  // on relâche CORP pour ne pas bloquer les réponses lues par le navigateur.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Préfixe toutes les routes par /api
  app.setGlobalPrefix('api');

  // Validation automatique des DTO (class-validator) sur toutes les requêtes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // retire les champs non déclarés dans le DTO
      forbidNonWhitelisted: true, // erreur si champ inconnu envoyé
      transform: true, // convertit les payloads en instances de DTO
    }),
  );

  // CORS resserré : uniquement l'origine (ou les origines) du front déclarées
  // dans FRONT_URL (séparées par des virgules). Fallback en dev local.
  const origins = (process.env.FRONT_URL ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    credentials: true,
  });
  console.log(`🔓 CORS autorisé pour : ${origins.join(', ')}`);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 BiblioSmart API démarrée sur http://localhost:${port}/api`);
}
void bootstrap();
