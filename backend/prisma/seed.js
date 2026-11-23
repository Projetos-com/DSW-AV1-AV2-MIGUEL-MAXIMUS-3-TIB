// Popula o banco com o administrador e alguns equipamentos de exemplo.
// Uso: npm run db:seed   (lê SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD do .env)
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma.js';

const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const senha = process.env.SEED_ADMIN_PASSWORD;

if (!email || !senha) {
  console.error('Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD no .env antes de rodar o seed.');
  process.exit(1);
}

const admin = await prisma.usuario.upsert({
  where: { email },
  update: {},
  create: { nome: 'Administrador', email, senhaHash: await bcrypt.hash(senha, 10), papel: 'ADMIN' },
});
console.log(`Administrador: ${admin.email}`);

const equipamentos = [
  { nome: 'Projetor Epson PowerLite', categoria: 'Projetor', patrimonio: 'PRJ-001', descricao: 'Projetor 3LCD com cabo HDMI e controle remoto.' },
  { nome: 'Notebook Dell Inspiron', categoria: 'Notebook', patrimonio: 'NTB-014', descricao: 'Intel i5, 8 GB de RAM, com carregador.' },
  { nome: 'Caixa de som JBL', categoria: 'Áudio', patrimonio: 'AUD-003', descricao: 'Caixa amplificada com microfone sem fio.' },
  { nome: 'Câmera Canon T7', categoria: 'Fotografia', patrimonio: 'CAM-002', descricao: 'Câmera DSLR com lente 18-55 mm.' },
  { nome: 'Kit Arduino Uno', categoria: 'Robótica', patrimonio: 'ROB-021', descricao: 'Placa, protoboard, sensores e jumpers.', ativo: false },
];

for (const equipamento of equipamentos) {
  await prisma.equipamento.upsert({ where: { patrimonio: equipamento.patrimonio }, update: {}, create: equipamento });
}
console.log(`${equipamentos.length} equipamentos de exemplo garantidos.`);

await prisma.$disconnect();
