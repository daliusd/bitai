export type Icon = 'water' | 'food' | 'broom' | 'heart' | 'pencil' | 'hamster' | 'sleeping';

export interface Task {
  icon: Icon;
  title: string;
  text: string;
  /** n: days since the schedule started, weekday: 0 = Monday. */
  due: (n: number, weekday: number) => boolean;
}

// Water+food and play alternate: water+food on the start day, play the day after, and so on.
const waterDay = (n: number) => n % 2 === 0;
const playDay = (n: number) => n % 2 === 1;

export const TASKS: Task[] = [
  { icon: 'water', title: 'Šviežias vanduo', text: 'Išpilk seną vandenį, išskalauk gertuvę ir įpilk šviežio.', due: waterDay },
  { icon: 'food', title: 'Maistas', text: 'Patikrink dubenėlį – ar yra maisto? Jei mažai, įberk.', due: waterDay },
  {
    icon: 'broom',
    title: 'Narvo ir tualeto valymas',
    text: 'Šeštadienį su suaugusiuoju: tualeto kampelis, kraikas, dubenėliai.',
    due: (_n, weekday) => weekday === 5,
  },
  { icon: 'heart', title: 'Paglostyk ir pažaisk', text: 'Vakare pakalbink, paglostyk ir leisk pabėgioti.', due: playDay },
];

export interface Day {
  day: number;
  /** 0 = Monday. */
  weekday: number;
  /** One flag per task: does this day get a checkbox? */
  due: boolean[];
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** month is 1-12. Days before `start` get no checkboxes. */
export function buildDays(year: number, month: number, start = 1): Day[] {
  return Array.from({ length: daysInMonth(year, month) }, (_, i) => {
    const day = i + 1;
    const weekday = (new Date(year, month - 1, day).getDay() + 6) % 7;
    return { day, weekday, due: TASKS.map((t) => day >= start && t.due(day - start, weekday)) };
  });
}

/** The schedule starts today when printing the current month, otherwise on the 1st. */
export function startDay(year: number, month: number, today = new Date()): number {
  return year === today.getFullYear() && month === today.getMonth() + 1 ? today.getDate() : 1;
}
