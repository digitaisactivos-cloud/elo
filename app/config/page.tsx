'use client';
import { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import { useStore } from '@/lib/store';
import { Button, Card, Input, Label, Textarea } from '@/components/ui/primitives';
import { toast } from '@/components/ui/toaster';
import { Upload, Download, Trash2, Church, FileSpreadsheet, Database, Cloud, CloudOff } from 'lucide-react';
import { uid } from '@/lib/utils';
import type { Membro } from '@/lib/types';
import { exportarMembrosExcel, exportarRelatorioExcel, descarregarModeloExcel, lerMembrosDeExcel, type LinhaMembroExcel } from '@/lib/excel';

interface LinhaCSV { nome?: string; telefone?: string; aniversario?: string; tags?: string; status?: string; responsavel?: string; notas?: string; proximo_contato?: string; [k: string]: string | undefined }

export default function Config() {
  const { membros, templates, envios, config, setConfig, setMembros, setTemplates, setEnvios, loaded, supabaseAtivo, aSincronizar, erroSync } = useStore();
  const [form, setForm] = useState(config);
  const [prev, setPrev] = useState<Array<LinhaCSV | LinhaMembroExcel>>([]);
  const [ficheiro, setFicheiro] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const excelRef = useRef<HTMLInputElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);

  // sincronizar form quando config carrega
  useEffect(() => {
    if (loaded) setForm(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const escolherCSV = (f: File | undefined) => {
    if (!f) return;
    setFicheiro(f);
    Papa.parse<LinhaCSV>(f, {
      header: true, skipEmptyLines: true, encoding: 'UTF-8',
      complete: (res) => {
        const linhas = (res.data as LinhaCSV[]).slice(0, 2000);
        setPrev(linhas);
      },
    });
  };

  const escolherExcel = async (f: File | undefined) => {
    if (!f) return;
    try {
      setFicheiro(f);
      const linhas = await lerMembrosDeExcel(f);
      setPrev(linhas.slice(0, 2000));
      toast(`Excel lido: ${linhas.length} linhas. 📊`);
    } catch {
      toast('Não consegui ler o Excel. ⚠️');
    }
  };

  const importarLinhas = (linhas: (LinhaCSV | LinhaMembroExcel)[]) => {
    let add = 0, upd = 0, ign = 0;
    const mapa = new Map(membros.map((m) => [m.telefone.replace(/[\s-]/g, ''), m]));
    const novos: Membro[] = [];
    const atualizados = new Map<string, Membro>();
    for (const l of linhas) {
      const nome = (l.nome || '').trim();
      const tel = (l.telefone || '').trim();
      if (!nome || !tel) { ign++; continue; }
      const base = {
        nome,
        telefone: tel,
        aniversario: (l.aniversario || '').trim() || undefined,
        tags: (l.tags || '').split(/[;|]/).map((s) => s.trim()).filter(Boolean),
        status: (['nao_contatado', 'tentativa_feita', 'contatado', 'em_oracao', 'concluido'].includes((l.status || '').trim()) ? (l.status as Membro['status']) : 'nao_contatado') as Membro['status'],
        responsavel: (l.responsavel || '').trim() || undefined,
        notas: (l.notas || '').trim() || undefined,
        proximo_contato: (l.proximo_contato || '').trim() || undefined,
      };
      const existente = mapa.get(tel) ?? atualizados.get(tel);
      if (existente) {
        atualizados.set(tel, { ...existente, ...base });
        if (!mapa.has(tel)) mapa.set(tel, existente);
        upd++;
      } else {
        const nm: Membro = { ...base, id: uid('mem'), criado_em: new Date().toISOString() };
        novos.push(nm);
        mapa.set(tel, nm);
        add++;
      }
    }
    setMembros((p) => {
      const porTel = new Map(p.map((m) => [m.telefone, m]));
      for (const [tel, m] of atualizados) porTel.set(tel, m);
      return [...novos, ...[...porTel.values()]];
    });
    toast(`Importação concluída: ${add} adicionados, ${upd} atualizados, ${ign} ignorados. ✅`);
    setPrev([]);
    setFicheiro(null);
    if (excelRef.current) excelRef.current.value = '';
  };

  const importar = () => importarLinhas(prev);

  const descarregar = (nome: string, conteudo: string, tipo: string) => {
    const blob = new Blob([conteudo], { type: tipo });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportarMembrosCSV = () => {
    const csv = Papa.unparse(membros.map((m) => ({
      nome: m.nome, telefone: m.telefone, aniversario: m.aniversario ?? '',
      tags: m.tags.join(';'), status: m.status, responsavel: m.responsavel ?? '',
      notas: m.notas ?? '', proximo_contato: m.proximo_contato ?? '',
    })));
    descarregar('membros-acompanha.csv', '﻿' + csv, 'text/csv;charset=utf-8');
    toast('Membros exportados em CSV. 📥');
  };

  const exportarEnviosCSV = () => {
    const csv = Papa.unparse(envios.map((e) => ({ ...e })));
    descarregar('historico-envios.csv', '﻿' + csv, 'text/csv;charset=utf-8');
    toast('Histórico exportado. 📥');
  };

  const exportarJSON = () => {
    descarregar('backup-acompanha.json', JSON.stringify({ membros, templates, envios, config, exportado_em: new Date().toISOString() }, null, 2), 'application/json');
    toast('Backup JSON exportado. 💾');
  };

  const importarBackup = (f: File | undefined) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(String(r.result));
        if (d.membros) setMembros(() => d.membros);
        if (d.templates) setTemplates(() => d.templates);
        if (d.envios) setEnvios(() => d.envios);
        if (d.config) setConfig(d.config);
        toast('Backup restaurado! ✅');
      } catch { toast('Ficheiro inválido. ⚠️'); }
    };
    r.readAsText(f);
  };

  const guardarIgreja = () => { setConfig(form); toast('Dados da igreja guardados! ⛪'); };

  return (
    <div className="space-y-4">
      <div><h1 className="text-[22px] font-bold tracking-tight">Ajustes</h1><p className="text-[13px] text-slate-500">Supabase, Excel, importação e backups</p></div>

      <Card>
        <h2 className="mb-2 flex items-center gap-2 font-bold"><Database size={18} /> ☁️ Supabase — armazenamento na nuvem</h2>
        {supabaseAtivo ? (
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2 text-green-700"><Cloud size={16} /> Ligado à nuvem ✅ {aSincronizar ? '(a sincronizar…)' : '(sincronizado)'}</p>
            <p className="text-slate-600">{membros.length} membros · {envios.length} envios · {templates.length} modelos na nuvem/local.</p>
            {erroSync && <p className="text-xs text-red-600">Erro sync: {erroSync}</p>}
            <p className="text-xs text-slate-500">Os dados são guardados no Supabase automaticamente e ficam em cache local para offline.</p>
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2 text-amber-700"><CloudOff size={16} /> Modo local (sem Supabase)</p>
            <p className="text-slate-600">Para ativar a nuvem:</p>
            <ol className="list-decimal pl-5 text-slate-600">
              <li>Cria projeto em supabase.com → copia URL + anon key.</li>
              <li>No SQL Editor, executa o ficheiro <code>supabase-schema.sql</code> do projeto.</li>
              <li>Cria <code>.env.local</code> a partir de <code>.env.example</code> e reinicia.</li>
              <li>Na Vercel: Project → Settings → Environment Variables → adiciona as 2 vars.</li>
            </ol>
            {erroSync && <p className="text-xs text-red-600">Erro: {erroSync}</p>}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 flex items-center gap-2 font-bold"><FileSpreadsheet size={18} /> 📊 Relatório Excel</h2>
        <p className="mb-2 text-sm text-slate-600">Gera o relatório completo (.xlsx) com abas Membros, Envios e Resumo — pronto a guardar/partilhar.</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button onClick={() => { exportarRelatorioExcel(membros, envios, config); toast('Relatório Excel gerado! 📊'); }}>
            <Download size={16} /> Relatório completo (.xlsx)
          </Button>
          <Button variant="outline" onClick={() => { exportarMembrosExcel(membros); toast('Membros exportados em Excel. 📥'); }}>
            <Download size={16} /> Só membros (.xlsx)
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 font-bold">📤 Importar membros via CSV / Excel</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div
            className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); escolherCSV(e.dataTransfer.files?.[0]); }}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mx-auto text-slate-400" />
            <p className="mt-1 text-sm">CSV — arrasta ou <span className="font-bold text-blue-600">clica</span></p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { escolherCSV(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
          <div
            className="rounded-2xl border-2 border-dashed border-green-300 bg-green-50/50 p-6 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); escolherExcel(e.dataTransfer.files?.[0]); }}
            onClick={() => excelRef.current?.click()}
          >
            <FileSpreadsheet className="mx-auto text-green-600" />
            <p className="mt-1 text-sm">Excel — arrasta .xlsx ou <span className="font-bold text-green-700">clica</span></p>
            <input ref={excelRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { escolherExcel(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
        </div>
        {ficheiro && <p className="mt-1 text-xs text-slate-500">📄 {ficheiro.name}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={() => descarregar('modelo-membros.csv', 'nome,telefone,aniversario,tags,status,responsavel,notas,proximo_contato\nMaria Nhaca,+258841234567,1990-05-14,Visitante;Jovem,nao_contatado,Pr. João,Primeira visita,2026-10-05\n', 'text/csv;charset=utf-8')} className="text-sm font-medium text-blue-600">
            <Download size={14} className="mr-1 inline" /> 📥 Modelo CSV
          </button>
          <button onClick={() => descarregarModeloExcel()} className="text-sm font-medium text-green-700">
            <Download size={14} className="mr-1 inline" /> 📊 Modelo Excel
          </button>
        </div>
        {prev.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-semibold">Pré-visualização (primeiros 5 de {prev.length})</p>
            <div className="mt-1 overflow-x-auto rounded-xl border">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-100">{Object.keys(prev[0]).map((k) => <th key={k} className="px-2 py-1 text-left">{k}</th>)}</tr></thead>
                <tbody>{prev.slice(0, 5).map((l, i) => <tr key={i} className="border-t">{Object.values(l).map((v, j) => <td key={j} className="px-2 py-1">{String(v ?? '')}</td>)}</tr>)}</tbody>
              </table>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => { setPrev([]); setFicheiro(null); }}>Cancelar</Button>
              <Button onClick={importar}>Importar {prev.length} registos</Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 flex items-center gap-2 font-bold"><Church size={18} /> 🏥 Dados da igreja</h2>
        <div className="space-y-2">
          <div><Label>Nome da igreja (usa-se em {'{Nome_Igreja}'})</Label><Input value={form.nome_igreja ?? config.nome_igreja} onChange={(e) => setForm({ ...form, nome_igreja: e.target.value })} /></div>
          <div><Label>Nome do líder principal</Label><Input value={form.lider_principal ?? config.lider_principal} onChange={(e) => setForm({ ...form, lider_principal: e.target.value })} /></div>
          <div><Label>Horário dos cultos</Label><Textarea rows={2} value={form.horario_cultos ?? config.horario_cultos} onChange={(e) => setForm({ ...form, horario_cultos: e.target.value })} /></div>
          <div><Label>Endereço (opcional)</Label><Input value={form.endereco ?? config.endereco ?? ''} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></div>
          <Button onClick={guardarIgreja} className="w-full">Guardar ⛪</Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 font-bold">💾 Backup e dados</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={exportarJSON}>Exportar tudo (JSON)</Button>
          <Button variant="outline" onClick={exportarMembrosCSV}>Exportar membros (CSV)</Button>
          <Button variant="outline" onClick={exportarEnviosCSV}>Exportar histórico (CSV)</Button>
          <Button variant="outline" onClick={() => { exportarRelatorioExcel(membros, envios, config); toast('Relatório Excel guardado! 📊'); }}>Guardar relatório (Excel)</Button>
          <Button variant="outline" onClick={() => backupRef.current?.click()}>Importar backup (JSON)</Button>
          <input ref={backupRef} type="file" accept=".json" className="hidden" onChange={(e) => { importarBackup(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        <Button
          variant="danger" className="mt-2 w-full"
          onClick={() => {
            if (confirm('Apagar TODOS os dados? Esta ação não pode ser anulada.')) {
              if (confirm('Confirmação final: apagar mesmo tudo?')) {
                localStorage.clear();
                location.reload();
              }
            }
          }}
        >
          <Trash2 size={16} /> Limpar todos os dados
        </Button>
      </Card>

      <Card>
        <h2 className="mb-1 font-bold">📱 Sobre a app</h2>
        <p className="text-sm text-slate-600">Acompanha+ v1.1.0 — follow-up de membros via SMS manual. {supabaseAtivo ? 'Dados guardados no Supabase (nuvem) com cache local.' : 'Dados apenas neste dispositivo (LocalStorage). Ativa o Supabase para nuvem.'}</p>
        <p className="mt-2 text-sm text-slate-600"><b>Instalar como PWA:</b> no Android (Chrome → ⋮ → «Adicionar ao ecrã principal»); no iPhone (Safari → Partilhar → «Adicionar ao Ecrã Principal»). Depois funciona offline.</p>
        <p className="mt-2 text-xs text-slate-500">Aviso de privacidade: os contactos são dados pessoais. Usa apenas para fins pastorais e com consentimento. Não partilhes o dispositivo sem proteção.</p>
      </Card>
    </div>
  );
}
