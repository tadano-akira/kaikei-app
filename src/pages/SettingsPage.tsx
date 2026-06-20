import { useState, useEffect } from 'react';
import { Settings, ConsumptionTaxCategory } from '../types';

interface Props {
  settings: Settings;
  loading: boolean;
  onSave: (data: Omit<Settings, 'updatedAt'>) => Promise<void>;
}

const CATEGORIES: { value: ConsumptionTaxCategory; label: string }[] = [
  { value: '第1種', label: '第1種 - 卸売業（90%）' },
  { value: '第2種', label: '第2種 - 小売業（80%）' },
  { value: '第3種', label: '第3種 - 製造業等（70%）' },
  { value: '第4種', label: '第4種 - その他（60%）' },
  { value: '第5種', label: '第5種 - サービス業等（50%）' },
  { value: '第6種', label: '第6種 - 不動産業（40%）' },
];

export const SettingsPage = ({ settings, loading, onSave }: Props) => {
  const [targetExpenseRate, setTargetExpenseRate] = useState('');
  const [residentialTaxRate, setResidentialTaxRate] = useState('');
  const [consumptionTaxCategory, setConsumptionTaxCategory] = useState<ConsumptionTaxCategory>('第5種');
  const [consumptionTaxSpecialRate, setConsumptionTaxSpecialRate] = useState('');
  const [healthInsurance, setHealthInsurance] = useState('');
  const [pension, setPension] = useState('');
  const [dependentDeduction, setDependentDeduction] = useState('');
  const [lifeInsuranceDeduction, setLifeInsuranceDeduction] = useState('');
  const [idecoDeduction, setIdecoDeduction] = useState('');
  const [smallBusinessDeduction, setSmallBusinessDeduction] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    setTargetExpenseRate(settings.targetExpenseRate.toString());
    setResidentialTaxRate(settings.residentialTaxRate.toString());
    setConsumptionTaxCategory(settings.consumptionTaxCategory);
    setConsumptionTaxSpecialRate(settings.consumptionTaxSpecialRate.toString());
    setHealthInsurance(settings.healthInsurance.toString());
    setPension(settings.pension.toString());
    setDependentDeduction(settings.dependentDeduction.toString());
    setLifeInsuranceDeduction(settings.lifeInsuranceDeduction.toString());
    setIdecoDeduction(settings.idecoDeduction.toString());
    setSmallBusinessDeduction(settings.smallBusinessDeduction.toString());
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      targetExpenseRate: parseFloat(targetExpenseRate) || 0,
      residentialTaxRate: parseFloat(residentialTaxRate) || 10,
      consumptionTaxCategory,
      consumptionTaxSpecialRate: parseFloat(consumptionTaxSpecialRate) || 0,
      healthInsurance: parseInt(healthInsurance) || 0,
      pension: parseInt(pension) || 0,
      dependentDeduction: parseInt(dependentDeduction) || 0,
      lifeInsuranceDeduction: parseInt(lifeInsuranceDeduction) || 0,
      idecoDeduction: parseInt(idecoDeduction) || 0,
      smallBusinessDeduction: parseInt(smallBusinessDeduction) || 0,
    });
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 14, paddingTop: 40 }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* 会計設定 */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>会計設定</h2>
        <FieldRow label="目標経費率" hint="売上に対する経費の目標比率">
          <NumberInputWithUnit
            value={targetExpenseRate}
            onChange={setTargetExpenseRate}
            unit="%" min={0} max={100} step={1}
          />
        </FieldRow>
      </section>

      {/* 税金設定 */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>税金設定</h2>
        <FieldRow label="住民税率" hint="所得に対する住民税率（通常10%）">
          <NumberInputWithUnit
            value={residentialTaxRate}
            onChange={setResidentialTaxRate}
            unit="%" min={0} max={20} step={0.1}
          />
        </FieldRow>
        <div style={dividerStyle} />
        <FieldRow label="消費税事業区分" hint="簡易課税のみなし仕入率">
          <select
            value={consumptionTaxCategory}
            onChange={e => setConsumptionTaxCategory(e.target.value as ConsumptionTaxCategory)}
            style={selectStyle}
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </FieldRow>
        <div style={dividerStyle} />
        <FieldRow label="消費税特例係数" hint="インボイス特例適用時（例：2026年=0.3）">
          <NumberInputWithUnit
            value={consumptionTaxSpecialRate}
            onChange={setConsumptionTaxSpecialRate}
            unit="" min={0} max={1} step={0.01}
            placeholder="0.3"
          />
        </FieldRow>
      </section>

      {/* 所得控除 */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>所得控除（年間）</h2>
        {([
          { label: '健康保険料', value: healthInsurance, onChange: setHealthInsurance },
          { label: '年金保険料', value: pension, onChange: setPension },
          { label: '扶養控除', value: dependentDeduction, onChange: setDependentDeduction },
          { label: '生命保険料控除', value: lifeInsuranceDeduction, onChange: setLifeInsuranceDeduction },
          { label: 'iDeCo控除', value: idecoDeduction, onChange: setIdecoDeduction },
          { label: '小規模企業共済控除', value: smallBusinessDeduction, onChange: setSmallBusinessDeduction },
        ] as { label: string; value: string; onChange: (v: string) => void }[]).map((f, i) => (
          <div key={f.label}>
            {i > 0 && <div style={dividerStyle} />}
            <FieldRow label={f.label}>
              <YenInput value={f.value} onChange={f.onChange} />
            </FieldRow>
          </div>
        ))}
      </section>

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          ...saveBtnStyle,
          background: savedMsg ? '#dcfce7' : '#2563eb',
          color: savedMsg ? '#16a34a' : '#ffffff',
        }}
      >
        {saving ? '保存中...' : savedMsg ? '✓ 保存しました' : '保存する'}
      </button>
    </div>
  );
};

const FieldRow = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div style={{ padding: '10px 0' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  </div>
);

const NumberInputWithUnit = ({
  value, onChange, unit, min, max, step, placeholder
}: {
  value: string; onChange: (v: string) => void; unit: string;
  min?: number; max?: number; step?: number; placeholder?: string;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      min={min} max={max} step={step}
      placeholder={placeholder ?? '0'}
      style={numInputStyle}
    />
    {unit && <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{unit}</span>}
  </div>
);

const YenInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>¥</span>
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      min={0} step={1000}
      placeholder="0"
      style={yenInputStyle}
    />
  </div>
);

const sectionStyle: React.CSSProperties = {
  background: 'var(--color-background-secondary)',
  borderRadius: 12,
  padding: '12px 16px',
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  marginBottom: 4,
};
const dividerStyle: React.CSSProperties = {
  height: '0.5px',
  background: 'var(--color-border-tertiary)',
  margin: '0 -16px',
};
const yenInputStyle: React.CSSProperties = {
  width: 140,
  padding: '6px 8px',
  borderRadius: 8,
  border: '0.5px solid #d0d0d0',
  background: '#f5f5f5',
  color: '#1a1a1a',
  fontSize: 14,
  textAlign: 'right',
};
const numInputStyle: React.CSSProperties = {
  width: 80,
  padding: '6px 8px',
  borderRadius: 8,
  border: '0.5px solid #d0d0d0',
  background: '#f5f5f5',
  color: '#1a1a1a',
  fontSize: 14,
  textAlign: 'right',
};
const selectStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 8,
  border: '0.5px solid #d0d0d0',
  background: '#f5f5f5',
  color: '#1a1a1a',
  fontSize: 12,
  maxWidth: 180,
};
const saveBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 0',
  border: 'none',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 500,
  cursor: 'pointer',
};
