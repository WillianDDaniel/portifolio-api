import 'dotenv-flow/config';
import { db } from './index.js';
import { users } from './schema.js';
import * as bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Verificando usuário administrador...');
  
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ Erro: ADMIN_EMAIL ou ADMIN_PASSWORD não definidos no .env');
    process.exit(1);
  }
  
  const passwordHash = await bcrypt.hash(password, 10);
  
  try {
    // .onConflictDoNothing() evita o erro de chave duplicada
    const result = await db.insert(users)
      .values({
        email,
        passwordHash,
      })
      .onConflictDoNothing({ target: users.email });

    // O result no Neon/HTTP pode variar, mas podemos checar se houve inserção
    // No driver do Neon, se não houver erro e não inseriu, o código continua
    console.log(`✅ Processo concluído para: ${email}`);
    console.log('💡 Se o usuário não existia, foi criado. Se já existia, nada foi alterado.');
    
  } catch (error) {
    console.error('❌ Erro inesperado ao rodar o seed:');
    console.error(error);
  } finally {
    process.exit(0);
  }
}

seed();