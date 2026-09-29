'use client';

import { STATUS_LABEL, type Config, type Envio, type Membro } from './types';
import { isoParaData } from './utils';

type XLSXMod = typeof import('xlsx');
async function xlsx(): Promise<XLSXMod> {
  return import('xlsx');
}

export interface LinhaMembroExcel {
  nome: string;
  telefone: string;
  aniversario?: string;
  tags?: string;
  status?: string;
  responsavel?: string;
  notas?: string;
  proximo_contato?: string;
}

function membrosParaLinhas(membros: Membro[]) {
  return membros.map((m) => ({
    Nome: m.nome,
    Telefone: m.telefone,
    Aniversario: m.aniversario ?? '',
    Tags: m.tags.join('; '),
    Status: STATUS_LABEL[m.status] ?? m.status,
    status_codigo: m.status,
    Responsavel: m.responsavel ?? '',
    Notas: m.notas ?? '',
    Proximo_Contato: m.proximo_contato ?? '',
    Ultima_Interacao: m.ultima_interacao ?? '',
    Criado_Em: m.criado_em,
    ID: m.id,
  }));
}

function descarregarXLSX(XLSX: XLSXMod, wb: import('xlsx').WorkBook, nome: string) {
  XLSX.writeFile(wb, nome);
}

/** Relatório completo multi-abas: Membros, Envios, Resumo */
export async function exportarRelatorioExcel(
  membros: Membro[],
  envios: Envio[],
  config: Config,
  nomeFicheiro = `relatorio-acompanha-${new Date().toISOString().slice(0, 10)}.xlsx`
) {
  const XLSX = await xlsx();
  const wb = XLSX.utils.book_new();

  // Aba 1: Membros
  const wsMembros = XLSX.utils.json_to_sheet(membrosParaLinhas(membros));
  wsMembros['!cols'] = [
    { wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 24 }, { wch: 18 },
    { wch: 16 }, { wch: 20 }, { wch: 30 }, { wch: 16 }, { wch: 20 }, { wch: 22 }, { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMembros, 'Membros');

  // Aba 2: Envios / Histórico
  const porMembro = new Map(membros.map((m) => [m.id, m]));
  const linhasEnvios = envios.map((e) => ({
    Data: e.enviado_em ? new Date(e.enviado_em).toLocaleString('pt-MZ') : '',
    Membro: porMembro.get(e.membro_id)?.nome ?? e.membro_id,
    Telefone: porMembro.get(e.membro_id)?.telefone ?? '',
    Conteudo: e.conteudo_final,
    Respondido: e.respondido ? 'Sim' : 'Não',
    ID_Envio: e.id,
    ID_Membro: e.membro_id,
  }));
  const wsEnvios = XLSX.utils.json_to_sheet(linhasEnvios);
  wsEnvios['!cols'] = [{ wch: 20 }, { wch: 28 }, { wch: 18 }, { wch: 60 }, { wch: 12 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsEnvios, 'Envios');

  // Aba 3: Resumo
  const pendentes = membros.filter((m) => m.status === 'nao_contatado' || m.status === 'tentativa_feita').length;
  const porStatus = Object.entries(STATUS_LABEL).map(([cod, label]) => ({
    Status: label,
    Quantidade: membros.filter((m) => m.status === cod).length,
  }));
  const resumo = [
    { Campo: 'Igreja', Valor: config.nome_igreja },
    { Campo: 'Líder', Valor: config.lider_principal },
    { Campo: 'Gerado em', Valor: new Date().toLocaleString('pt-MZ') },
    { Campo: 'Total membros', Valor: membros.length },
    { Campo: 'Total envios', Valor: envios.length },
    { Campo: 'Pendentes', Valor: pendentes },
    { Campo: '', Valor: '' },
    { Campo: '--- Por status ---', Valor: '' },
    ...porStatus.map((s) => ({ Campo: s.Status, Valor: s.Quantidade })),
  ];
  const wsResumo = XLSX.utils.json_to_sheet(resumo);
  wsResumo['!cols'] = [{ wch: 24 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

  descarregarXLSX(XLSX, wb, nomeFicheiro);
}

/** Exportação simples só de membros (compatível com importação) */
export async function exportarMembrosExcel(membros: Membro[]) {
  const XLSX = await xlsx();
  const wb = XLSX.utils.book_new();
  const linhas = membros.map((m) => ({
    nome: m.nome,
    telefone: m.telefone,
    aniversario: m.aniversario ?? '',
    tags: m.tags.join(';'),
    status: m.status,
    responsavel: m.responsavel ?? '',
    notas: (m.notas ?? '').replace(/\r?\n/g, ' '),
    proximo_contato: m.proximo_contato ?? '',
  }));
  const ws = XLSX.utils.json_to_sheet(linhas);
  ws['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 24 }, { wch: 16 }, { wch: 20 }, { wch: 30 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Membros');
  descarregarXLSX(XLSX, wb, `membros-acompanha-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/** Modelo Excel para importação */
export async function descarregarModeloExcel() {
  const XLSX = await xlsx();
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([
    { nome: 'Maria Nhaca', telefone: '+258841234567', aniversario: '1990-05-14', tags: 'Visitante;Jovem', status: 'nao_contatado', responsavel: 'Pr. João', notas: 'Primeira visita', proximo_contato: '2026-10-05' },
  ]);
  ws['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 24 }, { wch: 16 }, { wch: 20 }, { wch: 30 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Membros');
  descarregarXLSX(XLSX, wb, 'modelo-membros.xlsx');
}

/** Lê ficheiro .xlsx/.xls/.csv e devolve linhas normalizadas */
export async function lerMembrosDeExcel(file: File): Promise<LinhaMembroExcel[]> {
  const XLSX = await xlsx();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = reader.result;
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const nomeAba = wb.SheetNames.includes('Membros') ? 'Membros' : wb.SheetNames[0];
        const ws = wb.Sheets[nomeAba];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: true });
        const linhas: LinhaMembroExcel[] = json.map((r) => {
          // aceita cabeçalhos PT (Nome/Telefone) ou minúsculos (nome/telefone) ou com status por extenso
          const get = (...keys: string[]) => {
            for (const k of keys) {
              if (r[k] !== undefined && r[k] !== '') return String(r[k]).trim();
              const low = Object.keys(r).find((kk) => kk.toLowerCase() === k.toLowerCase());
              if (low && r[low] !== '') return String(r[low]).trim();
            }
            return '';
          };
          let status = get('status', 'status_codigo', 'Status');
          // converte rótulo ("Não Contatado") -> código
          const inv: Record<string, string> = Object.fromEntries(
            Object.entries(STATUS_LABEL).map(([cod, label]) => [label.toLowerCase(), cod])
          );
          if (inv[status.toLowerCase()]) status = inv[status.toLowerCase()];
          const fmtData = (v: string) => {
            if (!v) return '';
            // xlsx pode devolver Date
            const d = new Date(v);
            if (!isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(v) === false && v.includes('/') ) {
              return d.toISOString().slice(0, 10);
            }
            return v.slice(0, 10);
          };
          return {
            nome: get('nome', 'Nome'),
            telefone: get('telefone', 'Telefone'),
            aniversario: fmtData(get('aniversario', 'Aniversario')),
            tags: get('tags', 'Tags'),
            status,
            responsavel: get('responsavel', 'Responsavel'),
            notas: get('notas', 'Notas'),
            proximo_contato: fmtData(get('proximo_contato', 'Proximo_Contato')),
          };
        });
        resolve(linhas);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export { isoParaData };
