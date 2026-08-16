import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PasseioItem } from './PasseioItem';
import './App.css';

type Tutor = 'Leticia' | 'Nassar' | null;

interface StatusState {
  text: string;
  class: string;
}

interface RegistroHistorico {
  data_registro: string;
  p1: string;
  p2: string;
  p3: string;
  p4: string;
  observacoes: string;
}

interface AlertaState {
  show: boolean;
  text: string;
  class: string;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [showTabela, setShowTabela] = useState(false);
  const [historico, setHistorico] = useState<RegistroHistorico[]>([]);
  const [loadingTabela, setLoadingTabela] = useState(false);

  const sanitize = (val: string | null): string =>
    val ? val.replace(/[<>]/g, '') : '';
  const isValidTime = (val: string): boolean =>
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val);

  const [diaHoje] = useState<string>(() =>
    new Date().toLocaleDateString('pt-BR')
  );

  const carregarHistorico = async () => {
    setLoadingTabela(true);
    setShowTabela(true);
    try {
      const response = await fetch('/api/passeios');
      if (response.ok) {
        const data = await response.json();
        setHistorico(data);
      }
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setLoadingTabela(false);
    }
  };

  const [tutor, setTutor] = useState<Tutor>(() => {
    const t = sanitize(localStorage.getItem('canjica_tutor'));
    return t === 'Leticia' || t === 'Nassar' ? (t as Tutor) : null;
  });

  const [passeios, setPasseios] = useState<string[]>(['', '', '', '']);
  const [status, setStatus] = useState<StatusState>({
    text: '⏳ A carregar da nuvem...',
    class: 'status-salvo status-salvando',
  });
  const [alerta, setAlerta] = useState<AlertaState>({
    show: false,
    text: '',
    class: '',
  });

  // 🕒 1. VIRADA AUTOMÁTICA DO DIA À MEIA-NOITE (00:00)
  useEffect(() => {
    const agora = new Date();
    const meiaNoite = new Date();
    meiaNoite.setHours(24, 0, 0, 0); // Define para a próxima 00:00:00
    const msAteMeiaNoite = meiaNoite.getTime() - agora.getTime();

    const timer = setTimeout(() => {
      // Quando der meia-noite, recarrega a página automaticamente para sincronizar o novo dia
      window.location.reload();
    }, msAteMeiaNoite);

    return () => clearTimeout(timer);
  }, [diaHoje]);

  // 🔄 2. CARREGA OS DADOS DA PLANILHA AO ABRIR A APP
  useEffect(() => {
    setIsLoading(true);
    const scriptOculto =
      'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J6bG9Qd09SMzgyVVpWNEJYWVBqb012M2tnZm5kcXZINXJ6UXdGSGJSdm01RjlNRWE2RVgwMDBWbXJ6LUVVakNwV3gvZXhlYw==';
    const url = `${atob(scriptOculto)}?data=${encodeURIComponent(diaHoje)}`;

    setStatus({
      text: '⏳ A carregar da nuvem...',
      class: 'status-salvo status-salvando',
    });

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.erro) {
          const novosPasseios = [
            data.p1 || '',
            data.p2 || '',
            data.p3 || '',
            data.p4 || '',
          ];
          setPasseios(novosPasseios);
          novosPasseios.forEach((p, i) =>
            localStorage.setItem(`canjica_p${i + 1}`, p)
          );
          setStatus({ text: 'Nuvem atualizada ✔️', class: 'status-salvo' });
          setIsLoading(false);
        } else {
          setIsLoading(false);
          throw new Error('Sem registro');
        }
      })
      .catch(() => {
        const local = [1, 2, 3, 4].map(
          (i) => sanitize(localStorage.getItem(`canjica_p${i}`)) || ''
        );
        setPasseios(local);
        setStatus({ text: 'Nuvem atualizada ✔️', class: 'status-salvo' });
        setIsLoading(false);
      });
  }, [diaHoje]);

  const checkXixiStatus = useCallback((currentPasseios: string[]) => {
    const ultimoOntem = sanitize(localStorage.getItem('canjica_ultimo_ontem'));
    const ultimoPasseio =
      currentPasseios
        .slice()
        .reverse()
        .find((p) => p !== '') || ultimoOntem;

    if (!ultimoPasseio || !isValidTime(ultimoPasseio)) {
      setAlerta({ show: false, text: '', class: '' });
      return;
    }

    const [h, m] = ultimoPasseio.split(':').map(Number);
    const agora = new Date();
    const dataUltimo = new Date();
    dataUltimo.setHours(h, m, 0, 0);

    if (dataUltimo > agora && !ultimoOntem) {
      setAlerta({ show: false, text: '', class: '' });
      return;
    }
    if (dataUltimo > agora) {
      const diff = (dataUltimo.getTime() - agora.getTime()) / (1000 * 60 * 60);
      if (diff > 12) dataUltimo.setDate(dataUltimo.getDate() - 1);
      else return setAlerta({ show: false, text: '', class: '' });
    }

    const horasPassadas =
      (agora.getTime() - dataUltimo.getTime()) / (1000 * 60 * 60);

    if (horasPassadas > 10) {
      setAlerta({
        show: true,
        text: '🚨 URGENTE: Risco de problemas urinários! Passaram de 10h!',
        class: 'caixa-alerta alerta-vermelho',
      });
    } else if (horasPassadas >= 8 && horasPassadas <= 10) {
      setAlerta({
        show: true,
        text: '⚠️ Atenção: A Canjica está a segurar o xixi há muito tempo, tem que sair!',
        class: 'caixa-alerta alerta-laranja',
      });
    } else {
      setAlerta({ show: false, text: '', class: '' });
    }
  }, []);

  useEffect(() => {
    passeios.forEach((p, i) => localStorage.setItem(`canjica_p${i + 1}`, p));
    checkXixiStatus(passeios);
    const interval = setInterval(() => checkXixiStatus(passeios), 60000);
    return () => clearInterval(interval);
  }, [passeios, checkXixiStatus]);

  useEffect(() => {
    const bloquearBotaoDireito = (e: MouseEvent) => e.preventDefault();
    const bloquearAtalhos = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', bloquearBotaoDireito);
    document.addEventListener('keydown', bloquearAtalhos);

    return () => {
      document.removeEventListener('contextmenu', bloquearBotaoDireito);
      document.removeEventListener('keydown', bloquearAtalhos);
    };
  }, []);

  const enviarPlanilha = (
    novosPasseios: string[],
    passoApagado: number | null = null
  ) => {
    setStatus({
      text: '⏳ Salvando...',
      class: 'status-salvo status-salvando',
    });
    setIsLoading(true)
    const dataOntem = sanitize(localStorage.getItem('canjica_data_ontem'));
    const ultimoOntem = sanitize(localStorage.getItem('canjica_ultimo_ontem'));
    let obsOntem = '';

    if (novosPasseios[0] && dataOntem && ultimoOntem) {
      const [h1, m1] = novosPasseios[0].split(':').map(Number);
      const [hO, mO] = ultimoOntem.split(':').map(Number);
      const d1 = new Date();
      d1.setHours(h1, m1, 0);
      const dO = new Date();
      dO.setHours(hO, mO, 0);
      dO.setDate(dO.getDate() - 1);

      const diff = (d1.getTime() - dO.getTime()) / (1000 * 60 * 60);
      if (diff > 10) {
        obsOntem = `⚠️ A Canjica ultrapassou o limite e segurou o xixi por ${Math.floor(
          diff
        )}h e ${Math.round((diff - Math.floor(diff)) * 60)}m durante a noite!`;
      }
    }

    if (formRef.current) {
      const form = formRef.current;
      const scriptOculto =
        'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J6bG9Qd09SMzgyVVpWNEJYWVBqb012M2tnZm5kcXZINXJ6UXdGSGJSdm01RjlNRWE2RVgwMDBWbXJ6LUVVakNwV3gvZXhlYw==';

      form.action = atob(scriptOculto);

      (form.elements.namedItem('data') as HTMLInputElement).value = diaHoje;
      (form.elements.namedItem('tutor') as HTMLInputElement).value =
        tutor || '';

      novosPasseios.forEach((val, idx) => {
        const finalVal =
          passoApagado === idx + 1 ? 'APAGAR' : isValidTime(val) ? val : '';
        (form.elements.namedItem(`p${idx + 1}`) as HTMLInputElement).value =
          finalVal;
      });

      (form.elements.namedItem('data_ontem') as HTMLInputElement).value =
        dataOntem || '';
      (form.elements.namedItem('obs_ontem') as HTMLInputElement).value =
        obsOntem;

      form.submit();

      setTimeout(() => {
        setStatus({ text: 'Salvo na nuvem ✔️', class: 'status-salvo' });
        setIsLoading(false)
      }, 1200);
    }
  };

  const handleTimeChange = (index: number, val: string) => {
    const newP = [...passeios];
    newP[index] = val;
    setPasseios(newP);
    if (isValidTime(val) || val === '')
      enviarPlanilha(newP, val === '' ? index + 1 : null);
  };

  const preencherAgora = (index: number) => {
    const agora = new Date();
    const val = `${String(agora.getHours()).padStart(2, '0')}:${String(
      agora.getMinutes()
    ).padStart(2, '0')}`;
    handleTimeChange(index, val);
  };

  const apagar = (index: number) => {
    const newP = [...passeios];
    newP[index] = '';
    setPasseios(newP);
    enviarPlanilha(newP, index + 1);
  };

  const addTime = (
    timeStr: string | null,
    hAdd: number,
    mAdd: number
  ): string => {
    if (!timeStr || !isValidTime(timeStr)) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h + hAdd, m + mAdd, 0);
    return `${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

  const ultimoOntem = sanitize(localStorage.getItem('canjica_ultimo_ontem'));
  const ideal1 = ultimoOntem
    ? addTime(ultimoOntem, 8, 30)
    : 'Horário de acordar...';
  const base1 = passeios[0] || ideal1;
  const ideal2 = base1 ? addTime(base1, 6, 30) : 'Aguardando 1º passeio...';
  const base2 = passeios[1] || ideal2;
  const ideal3 = base2 ? addTime(base2, 3, 30) : 'Aguardando...';
  const base3 = passeios[2] || ideal3;
  const ideal4 = base3 ? addTime(base3, 5, 30) : 'Aguardando...';

  const placeholders = [ideal1, ideal2, ideal3, ideal4];
  const indexProximo = passeios.findIndex((p) => p === '');

  const abrirPlanilhaOculta = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const codigoOculto =
      'aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvMVJhSXM2eTRnNHI2VlRBYmM4RWFha0ZvRHNuRkpqRmhxLVg3UE91S3B0SUEvZWRpdD91c3A9ZHJpdmVfd2Vi';
    window.open(atob(codigoOculto), '_blank', 'noopener,noreferrer');
  };

  const salvarTutor = (nome: Tutor) => {
    setTutor(nome);
    if (nome) localStorage.setItem('canjica_tutor', nome);
  };

  if (!tutor) {
    return (
      <div className="container">
        <h2>Pipi Time da Canjica 🐾</h2>
        <div className="tela-tutor">
          <p style={{ marginTop: 0 }}>Quem está neste App?</p>
          <button className="btn-tutor" onClick={() => salvarTutor('Leticia')}>
            Letícia
          </button>
          <button className="btn-tutor" onClick={() => salvarTutor('Nassar')}>
            Nassar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <iframe
        name="hidden_iframe"
        id="hidden_iframe"
        style={{ display: 'none' }}
      ></iframe>
      <form
        ref={formRef}
        method="POST"
        target="hidden_iframe"
        style={{ display: 'none' }}
      >
        <input type="hidden" name="data" />
        <input type="hidden" name="tutor" />
        <input type="hidden" name="p1" />
        <input type="hidden" name="p2" />
        <input type="hidden" name="p3" />
        <input type="hidden" name="p4" />
        <input type="hidden" name="data_ontem" />
        <input type="hidden" name="obs_ontem" />
      </form>

      <div className="container">
        <h2>Pipi Time da Canjica 🐾</h2>

        <div className="barra-topo">
          <div className={status.class}>{status.text}</div>
          <div className="dia-hoje">{diaHoje}</div>
        </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

        {alerta.show && <div className={alerta.class}>{alerta.text}</div>}

        {[1, 2, 3, 4].map((passo, i) => (
          <PasseioItem
            key={passo}
            passo={passo}
            valor={passeios[i]}
            placeholder={placeholders[i]}
            isPreenchido={passeios[i] !== ''}
            isProximo={i === indexProximo}
            isDesabilitado={i > indexProximo && indexProximo !== -1}
            onChange={(val) => handleTimeChange(i, val)}
            onPreencherAgora={() => preencherAgora(i)}
            onApagar={() => apagar(i)}
          />
        ))}

        <button
          onClick={abrirPlanilhaOculta}
          className="btn-planilha"
          type="button"
        >
          Link para a planilha
        </button>
        <button 
        type="button" 
        className="btn-planilha" 
        onClick={carregarHistorico}
      >
        📊 Ver Tabela de Registros
      </button>

      {showTabela && (
        <div className="modal-overlay" onClick={() => setShowTabela(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Histórico de Passeios 🐾</h3>
              <button className="btn-fechar" onClick={() => setShowTabela(false)}>✕</button>
            </div>

            {loadingTabela ? (
              <div className="modal-loading">
                <div className="spinner"></div>
                <p>A carregar histórico...</p>
              </div>
            ) : (
              <div className="tabela-wrapper">
                <table className="tabela-historico">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>1º</th>
                      <th>2º</th>
                      <th>3º</th>
                      <th>4º</th>
                      <th>Observações</th> {/* <-- Cabeçalho adicionado */}
                    </tr>
                  </thead>
                  <tbody>
                    {historico.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center' }}>
                          Nenhum registro encontrado.
                        </td>
                      </tr>
                    ) : (
                      historico.map((row, index) => (
                        <tr key={index}>
                          <td>{row.data_registro}</td>
                          <td>{row.p1 || '-'}</td>
                          <td>{row.p2 || '-'}</td>
                          <td>{row.p3 || '-'}</td>
                          <td>{row.p4 || '-'}</td>
                          <td style={{ textAlign: 'left', fontSize: '0.85em', minWidth: '140px' }}>
                            {row.observacoes || '-'} {/* <-- Coluna com as observações */}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </>
  );
}
