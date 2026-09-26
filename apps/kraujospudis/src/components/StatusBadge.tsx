import type { Category } from '../lib/reference';
import { CATEGORY_LABELS, CATEGORY_TONE } from '../lib/reference';

export default function StatusBadge({ category }: { category: Category }) {
  return <span className={`status status-${CATEGORY_TONE[category]}`}>{CATEGORY_LABELS[category]}</span>;
}
