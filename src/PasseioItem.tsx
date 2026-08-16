import React, { useState } from 'react';

interface PasseioItemProps {
  passo: number;
  valor: string;
  placeholder: string;
  isPreenchido: boolean;
  isProximo: boolean;
  isDesabilitado: boolean;
  onChange: (val: string) => void;
  onPreencherAgora: () => void;
  onApagar: () => void;
}

export const PasseioItem: React.FC<PasseioItemProps> = ({
  passo,
  valor,
  placeholder,
  isPreenchido,
  isProximo,
  isDesabilitado,
  onChange,
  onPreencherAgora,
  onApagar,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const currentType = isFocused || valor ? 'time' : 'text';

  return (
    <div
      className={`input-group ${isDesabilitado ? 'grupo-desabilitado' : ''}`}
    >
      <div className="input-linha">
        <label className={isProximo ? 'proximo' : ''}>{passo}º Passeio</label>
        <input
          type={currentType}
          className={isPreenchido ? 'preenchido' : ''}
          placeholder={placeholder}
          value={valor}
          disabled={isDesabilitado}
          onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            try {
              (e.target as any).showPicker();
            } catch (err) {}
          }}
          onBlur={() => setIsFocused(false)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
        />

        {/* ✨ MÁGICA AQUI: O botão do raiozinho (⚡) agora só aparece se for o "próximo" */}
        <button
          className="btn-icone"
          onClick={onPreencherAgora}
          disabled={isDesabilitado}
          type="button"
          style={{ display: isProximo ? 'flex' : 'none' }}
        >
          ⚡
        </button>

        <button
          className="btn-icone btn-apagar"
          onClick={onApagar}
          disabled={isDesabilitado}
          style={{ display: isPreenchido ? 'flex' : 'none' }}
          type="button"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};
