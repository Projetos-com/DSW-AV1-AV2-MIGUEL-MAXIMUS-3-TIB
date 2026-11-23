// Validação de formato dos dados recebidos (campos obrigatórios, tipos e tamanhos).
// As REGRAS DE NEGÓCIO ficam nos services, não aqui.
import { z } from 'zod';

const textoObrigatorio = (campo, max) =>
  z
    .string({ error: `${campo} é obrigatório.` })
    .trim()
    .min(1, { error: `${campo} é obrigatório.` })
    .max(max, { error: `${campo} deve ter no máximo ${max} caracteres.` });

const dataHora = (campo) =>
  z.coerce.date({ error: `${campo} deve ser uma data/hora válida.` });

export const cadastroSchema = z.object({
  nome: textoObrigatorio('Nome', 100).refine((v) => v.length >= 3, {
    error: 'Nome deve ter pelo menos 3 caracteres.',
  }),
  email: z
    .string({ error: 'E-mail é obrigatório.' })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: 'E-mail inválido.' })),
  senha: z
    .string({ error: 'Senha é obrigatória.' })
    .min(6, { error: 'Senha deve ter pelo menos 6 caracteres.' })
    .max(72, { error: 'Senha deve ter no máximo 72 caracteres.' }),
});

export const loginSchema = z.object({
  email: z.string({ error: 'E-mail é obrigatório.' }).trim().toLowerCase().min(1, { error: 'E-mail é obrigatório.' }),
  senha: z.string({ error: 'Senha é obrigatória.' }).min(1, { error: 'Senha é obrigatória.' }),
});

export const equipamentoSchema = z.object({
  nome: textoObrigatorio('Nome', 100),
  categoria: textoObrigatorio('Categoria', 60),
  patrimonio: textoObrigatorio('Patrimônio', 30).transform((v) => v.toUpperCase()),
  descricao: z
    .string()
    .trim()
    .max(500, { error: 'Descrição deve ter no máximo 500 caracteres.' })
    .optional()
    .nullable()
    .transform((v) => v || null),
  ativo: z.boolean({ error: 'Ativo deve ser verdadeiro ou falso.' }).optional().default(true),
});

export const reservaSchema = z.object({
  equipamentoId: z.coerce
    .number({ error: 'Equipamento é obrigatório.' })
    .int({ error: 'Equipamento inválido.' })
    .positive({ error: 'Equipamento é obrigatório.' }),
  inicio: dataHora('Início'),
  fim: dataHora('Fim'),
  finalidade: textoObrigatorio('Finalidade', 200),
});

export const idParamSchema = z.object({
  id: z.coerce.number({ error: 'ID inválido.' }).int({ error: 'ID inválido.' }).positive({ error: 'ID inválido.' }),
});
