// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ValidationPipe } from '@nestjs/common';
// import helmet from 'helmet';

// async function bootstrap() {

//   const app =
//     await NestFactory.create(AppModule);

//   app.use(helmet());

//   app.enableCors({
//     origin: 'http://localhost:3001',
//     credentials: true,
//   });

//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       transform: true,
//     }),
//   );

//   app.setGlobalPrefix('api');

//   const PORT = 3000;

//   await app.listen(PORT);

//   console.log(
//     `🚀 Backend running on http://localhost:${PORT}/api`,
//   );
// }

// bootstrap();





import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.enableCors({
    origin: 'http://localhost:3001', // Frontend URL
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const PORT = 3000; // <-- Change this

  await app.listen(PORT);

  console.log(
    `🚀 Backend running on http://localhost:${PORT}/api`,
  );
}

bootstrap();