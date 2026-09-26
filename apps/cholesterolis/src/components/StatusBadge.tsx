import type { Status } from '../lib/reference';
import { STATUS_LABELS } from '../lib/reference';

export default function StatusBadge({ status }: { status: Status }) {
  return <span className={`status status-${status}`}>{STATUS_LABELS[status]}</span>;
}
