import type { Settings, SettingKey } from '../lib/settings';
import { formatTime } from '../lib/format';
import { totalDuration } from '../lib/timer';
import DragInput from './DragInput';

interface Props {
  settings: Settings;
  starting: boolean;
  onChange: (settings: Settings) => void;
  onStart: () => void;
}

const plain = (v: number) => String(v);

export default function SetupScreen({ settings, starting, onChange, onStart }: Props) {
  const set = (key: SettingKey) => (value: number) => onChange({ ...settings, [key]: value });
  return (
    <main className="screen setup-screen">
      <p className="crumbs">
        <a href="/">bitai</a> / laikmatis
      </p>
      <h1 className="title">Sporto laikmatis</h1>

      <DragInput label="Intervalai" setting="intervals" value={settings.intervals} format={plain} onChange={set('intervals')} />
      <DragInput label="Darbas" setting="active" value={settings.active} format={formatTime} onChange={set('active')} />
      <DragInput label="Poilsis" setting="rest" value={settings.rest} format={formatTime} onChange={set('rest')} />
      <DragInput label="Atgalinis skaičiavimas" setting="countdown" value={settings.countdown} format={plain} onChange={set('countdown')} />

      <p className="drag-hint">Tempkite aukštyn arba žemyn, kad pakeistumėte reikšmę</p>
      <p className="total" data-testid="total">
        Iš viso {formatTime(totalDuration(settings))}
      </p>

      <button type="button" className="start-btn" onClick={onStart} disabled={starting}>
        {starting ? 'RUOŠIAMA…' : 'PRADĖTI'}
      </button>
    </main>
  );
}
