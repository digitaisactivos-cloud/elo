export type StatusMembro = 'nao_contatado' | 'tentativa_feita' | 'contatado' | 'em_oracao' | 'concluido';

export interface Membro {
  id: string;
  nome: string;
  telefone: string;
  aniversario?: string; // ISO date yyyy-mm-dd
  tags: string[];
  status: StatusMembro;
  responsavel?: string;
  notas?: string;
  ultima_interacao?: string; // ISO datetime
  proximo_contato?: string; // ISO date
  criado_em: string; // ISO datetime
}

export interface Template {
  id: string;
  titulo: string;
  categoria: string;
  conteudo: string;
  versiculo_ref?: string;
  isPadrao?: boolean;
}

export interface Envio {
  id: string;
  membro_id: string;
  template_id?: string;
  conteudo_final: string;
  enviado_em: string;
  respondido: boolean;
  notas?: string;
}

export interface Config {
  nome_igreja: string;
  lider_principal: string;
  horario_cultos: string;
  endereco?: string;
}

export const TAGS = [
  'Novo Convertido',
  'Jovem',
  'Criança',
  'Idoso',
  'Líder',
  'Visitante',
  'Enfermo',
  'Ausente',
] as const;

export const STATUS_LABEL: Record<StatusMembro, string> = {
  nao_contatado: 'Não Contatado',
  tentativa_feita: 'Tentativa Feita',
  contatado: 'Contatado',
  em_oracao: 'Em Oração',
  concluido: 'Concluído',
};

export const CATEGORIAS = [
  '📅 Lembretes',
  '📖 Versículos',
  '🎂 Aniversários',
  '💌 Boas-vindas',
  '🤒 Enfermos e Apoio',
  '😢 Ausência',
  '🙏 Pedidos de Oração',
  '🎉 Datas Especiais',
  '💰 Ofertas e Dízimos',
  '🕊️ Encerramento de Culto',
] as const;
