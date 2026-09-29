import type { Template } from './types';

export const HORARIO_CULTOS_PADRAO = 'Domingo às 16h | Terça e Quinta às 18h';
export const HORARIO_CULTOS_ANTIGO = 'Domingo às 9h | Quarta às 19h';

/** Migração 1x: atualiza textos padrão antigos (só se o utilizador não os editou) */
export const TEMPLATE_MIGRATIONS: Array<{ de: string; para: string }> = [
  {
    de: 'Olá {Nome}! 🙏 Lembrete: amanhã teremos culto às 19h na {Nome_Igreja}. Vai ser uma bênção! Contamos contigo.',
    para: 'Olá {Nome}! 🙏 Lembrete: temos culto na {Nome_Igreja} — Domingo às 16h · Terça e Quinta às 18h. Vai ser uma bênção! Contamos contigo.',
  },
  {
    de: '{Nome}, não te esqueças do culto de domingo! ⛪ Junta-te a nós e traz um amigo. — {Lider}, {Nome_Igreja}',
    para: '{Nome}, não te esqueças do culto de domingo às 16h! ⛪ Junta-te a nós e traz um amigo. — {Lider}, {Nome_Igreja}',
  },
];

export const SEED_TEMPLATES: Omit<Template, 'id'>[] = [
  // 📅 Lembretes (4)
  { titulo: 'Lembrete de culto', categoria: '📅 Lembretes', conteudo: 'Olá {Nome}! 🙏 Lembrete: temos culto na {Nome_Igreja} — Domingo às 16h · Terça e Quinta às 18h. Vai ser uma bênção! Contamos contigo.' },
  { titulo: 'Culto de domingo', categoria: '📅 Lembretes', conteudo: '{Nome}, não te esqueças do culto de domingo às 16h! ⛪ Junta-te a nós e traz um amigo. — {Lider}, {Nome_Igreja}' },
  { titulo: 'Ensaio / reunião de obreiros', categoria: '📅 Lembretes', conteudo: 'Olá {Nome}! 📢 Reunião de obreiros este sábado às 9h. A tua presença é importante. Confirma por favor.' },
  { titulo: 'Evento especial', categoria: '📅 Lembretes', conteudo: '{Nome}, teremos um evento especial esta semana na {Nome_Igreja}! 🎶 Não faltes — Deus tem algo para ti.' },
  // 📖 Versículos (6)
  { titulo: 'Força', categoria: '📖 Versículos', conteudo: "{Nome}, 'Posso todas as coisas naquele que me fortalece' (Fp 4:13). Deus está contigo! 💪", versiculo_ref: 'Filipenses 4:13' },
  { titulo: 'Gratidão', categoria: '📖 Versículos', conteudo: "'Dai graças em todas as circunstâncias' (1Ts 5:18). {Nome}, que o teu coração se encha de gratidão hoje! 🙌", versiculo_ref: '1 Tessalonicenses 5:18' },
  { titulo: 'Paz', categoria: '📖 Versículos', conteudo: "{Nome}, 'Deixo-vos a paz, dou-vos a minha paz' (Jo 14:27). Recebe a paz de Jesus hoje! 🕊️", versiculo_ref: 'João 14:27' },
  { titulo: 'Esperança', categoria: '📖 Versículos', conteudo: "'Porque eu sei os planos que tenho para vós' (Jr 29:11). {Nome}, há esperança para o teu futuro! 🌅", versiculo_ref: 'Jeremias 29:11' },
  { titulo: 'Fé', categoria: '📖 Versículos', conteudo: "'Ora, a fé é a certeza daquilo que esperamos' (Hb 11:1). {Nome}, continua a crer! Deus é fiel. 🙏", versiculo_ref: 'Hebreus 11:1' },
  { titulo: 'Amor', categoria: '📖 Versículos', conteudo: "'Deus é amor' (1Jo 4:8). {Nome}, és profundamente amado(a) pelo Pai! ❤️", versiculo_ref: '1 João 4:8' },
  // 🎂 Aniversários (3)
  { titulo: 'Aniversário', categoria: '🎂 Aniversários', conteudo: 'Feliz aniversário, {Nome}! 🎉 Que Deus te abençoe ricamente neste novo ano de vida. Oramos por ti! — {Nome_Igreja}' },
  { titulo: 'Aniversário com versículo', categoria: '🎂 Aniversários', conteudo: "'Este é o dia que o Senhor fez; regozijemo-nos nele' (Sl 118:24). Parabéns, {Nome}! 🎂🥳", versiculo_ref: 'Salmos 118:24' },
  { titulo: 'Aniversário de conversão', categoria: '🎂 Aniversários', conteudo: '{Nome}, celebramos contigo mais um ano de fé! 🙌 Que o Senhor continue a guiar os teus passos.' },
  // 💌 Boas-vindas (3)
  { titulo: 'Boas-vindas visitante', categoria: '💌 Boas-vindas', conteudo: 'Foi uma alegria ter-te connosco, {Nome}! 💛 Esperamos ver-te novamente no próximo culto da {Nome_Igreja}.' },
  { titulo: 'Novo convertido', categoria: '💌 Boas-vindas', conteudo: 'Bem-vindo(a) à família, {Nome}! 🎉 Estamos muito felizes pela tua decisão. O {Lider} gostaria de orar contigo esta semana.' },
  { titulo: 'Segunda visita', categoria: '💌 Boas-vindas', conteudo: 'Olá {Nome}! Notámos que já nos visitaste. Queres que te reservemos um lugar no próximo culto? 😊 — {Nome_Igreja}' },
  // 🤒 Enfermos e Apoio (3)
  { titulo: 'Enfermo', categoria: '🤒 Enfermos e Apoio', conteudo: "{Nome}, estamos a orar pela tua saúde! 'Eu sou o Senhor que te sara'. Deus está contigo! 💙 — {Lider}", versiculo_ref: 'Êxodo 15:26' },
  { titulo: 'Luto / conforto', categoria: '🤒 Enfermos e Apoio', conteudo: "'Bem-aventurados os que choram, porque serão consolados' (Mt 5:4). {Nome}, estamos contigo em oração. 🤍", versiculo_ref: 'Mateus 5:4' },
  { titulo: 'Dificuldade financeira', categoria: '🤒 Enfermos e Apoio', conteudo: "'O meu Deus suprirá todas as vossas necessidades' (Fp 4:19). {Nome}, confia — estamos a orar por ti! 🙏", versiculo_ref: 'Filipenses 4:19' },
  // 😢 Ausência (3)
  { titulo: 'Ausência', categoria: '😢 Ausência', conteudo: 'Sentimos a tua falta, {Nome}! 🥺 Esperamos ver-te no próximo culto. Está tudo bem? — {Lider}, {Nome_Igreja}' },
  { titulo: 'Ausente há tempo', categoria: '😢 Ausência', conteudo: 'Olá {Nome}, já há algum tempo que não te vemos. Gostaríamos de saber como estás. Podemos orar por algo? 🙏' },
  { titulo: 'Regresso', categoria: '😢 Ausência', conteudo: '{Nome}, há sempre um lugar à tua espera na {Nome_Igreja}! 🏠 Volta — sentimos a tua falta.' },
  // 🙏 Pedidos de Oração (3)
  { titulo: 'Pedido de oração', categoria: '🙏 Pedidos de Oração', conteudo: 'Olá {Nome}! 🙏 Há algum motivo de oração pelo qual possamos interceder esta semana? Responde a esta mensagem.' },
  { titulo: 'Após pedido', categoria: '🙏 Pedidos de Oração', conteudo: '{Nome}, continuamos a orar pelo teu pedido. 🙌 Crê — Deus está a agir! Mantém-nos atualizados.' },
  { titulo: 'Vigília de oração', categoria: '🙏 Pedidos de Oração', conteudo: '{Nome}, teremos vigília de oração sexta-feira às 22h. 🕯️ Vem orar connosco na {Nome_Igreja}!' },
  // 🎉 Datas Especiais (4)
  { titulo: 'Natal', categoria: '🎉 Datas Especiais', conteudo: 'Feliz Natal, {Nome}! 🎄 Que o nascimento de Jesus encha o teu lar de paz e alegria. — {Nome_Igreja}' },
  { titulo: 'Páscoa', categoria: '🎉 Datas Especiais', conteudo: "'Ele ressuscitou!' (Mt 28:6). Feliz Páscoa, {Nome}! ✝️ Celebra connosco no culto de domingo.", versiculo_ref: 'Mateus 28:6' },
  { titulo: 'Dia da Mãe / Pai', categoria: '🎉 Datas Especiais', conteudo: 'Feliz Dia da Mãe/Pai, {Nome}! 💐 Agradecemos a Deus pela tua vida. Que Ele te recompense!' },
  { titulo: 'Ano Novo', categoria: '🎉 Datas Especiais', conteudo: 'Feliz Ano Novo, {Nome}! 🎆 Que este ano seja de bênçãos, saúde e fé. Caminhamos juntos na {Nome_Igreja}!' },
  // 💰 Ofertas e Dízimos (2)
  { titulo: 'Dízimo com gratidão', categoria: '💰 Ofertas e Dízimos', conteudo: "'Deus ama ao que dá com alegria' (2Co 9:7). {Nome}, obrigado pela tua fidelidade! 🙌", versiculo_ref: '2 Coríntios 9:7' },
  { titulo: 'Projeto / oferta especial', categoria: '💰 Ofertas e Dízimos', conteudo: 'Olá {Nome}! 🏗️ Estamos a angariar ofertas para o projeto da igreja. Toda a ajuda conta. Obrigado por semeares!' },
  // 🕊️ Encerramento de Culto (2)
  { titulo: 'Obrigado pela presença', categoria: '🕊️ Encerramento de Culto', conteudo: 'Obrigado por estares connosco hoje, {Nome}! 🕊️ Que a bênção do Senhor te acompanhe durante a semana.' },
  { titulo: 'Partilha / testemunho', categoria: '🕊️ Encerramento de Culto', conteudo: '{Nome}, o culto de hoje foi bênção! 🙌 Se Deus tocou no teu coração, partilha connosco o teu testemunho.' },
];
