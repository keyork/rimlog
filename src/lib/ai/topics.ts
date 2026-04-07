/**
 * Daily Behavior Topic Library for Freeform Observation Generation
 *
 * Topics relatable to Chinese internet/office workers.
 * Each topic includes the Chinese keyword and a brief English description
 * to help the AI understand context.
 */

export interface DailyTopic {
  keyword: string;
  description: string;
}

export const DAILY_TOPICS: DailyTopic[] = [
  { keyword: '通勤', description: 'daily commute, squeezing into subway/bus, traffic jams, cycling to work' },
  { keyword: '开会', description: 'endless meetings, meetings that could have been emails, staring blankly in conference rooms' },
  { keyword: '加班', description: 'working overtime, staying late at the office, the glow of monitors at night' },
  { keyword: '奶茶', description: 'ordering bubble tea/milk tea, afternoon sugar craving, choosing toppings' },
  { keyword: '外卖', description: 'ordering takeout food, waiting for delivery, the ritual of unpacking lunch boxes' },
  { keyword: '健身', description: 'going to the gym, paying for unused membership, the struggle of exercise' },
  { keyword: '刷手机', description: 'doom scrolling, swiping through social media feeds, losing track of time on the phone' },
  { keyword: '熬夜', description: 'staying up late, revenge bedtime procrastination, midnight screen glow' },
  { keyword: '摸鱼', description: 'slacking off at work, pretending to be busy, creative ways to waste office time' },
  { keyword: '绩效考核', description: 'performance review, KPI anxiety, self-evaluation forms, quarterly assessment' },
  { keyword: '团建', description: 'company team building, awkward social events, mandatory fun activities' },
  { keyword: '年假', description: 'annual leave, planning vacation, the guilt of taking days off' },
  { keyword: '996', description: 'the 996 work culture, working 9am to 9pm six days a week, hustle culture' },
  { keyword: '周五', description: 'Friday feeling, the collective mood shift, weekend anticipation' },
  { keyword: '周一', description: 'Monday blues, the collective dread, resetting the work cycle' },
  { keyword: '深夜emo', description: 'late-night emotional moments, existential thoughts at 2am, sudden sadness' },
  { keyword: '相亲', description: 'blind dates, parental pressure to marry, awkward matchmaking encounters' },
  { keyword: '租房', description: 'renting an apartment, dealing with landlords, moving, housing anxiety' },
  { keyword: '还房贷', description: 'paying mortgage, the 30-year commitment, financial pressure of homeownership' },
  { keyword: '午休', description: 'lunch break nap, folding bed under the desk, the office sleep ritual' },
  { keyword: '同事关系', description: 'navigating office politics, workplace friendships, passive-aggressive interactions' },
  { keyword: '购物狂欢', description: 'online shopping festivals, impulse buying, the thrill of clicking purchase' },
  { keyword: '减肥', description: 'attempting to lose weight, failed diet plans, the eternal conflict with food' },
  { keyword: '养宠物', description: 'keeping cats or dogs, pet parenting, talking to animals' },
  { keyword: '学英语', description: 'trying to learn English, abandoned language apps, the dream of fluency' },
  { keyword: '副业', description: 'side hustle, trying to earn extra income, the gig economy dream' },
  { keyword: '社恐', description: 'social anxiety, avoiding phone calls, dodging small talk, preferring solitude' },
  { keyword: '通勤音乐', description: 'listening to music/podcasts during commute, the playlist as emotional armor' },
  { keyword: '装修', description: 'home renovation, arguing over design choices, the endless project' },
  { keyword: '存钱', description: 'trying to save money, watching the bank balance, financial anxiety' },
  { keyword: '微信工作群', description: 'WeChat work groups, messages after hours, the notification anxiety' },
  { keyword: '抽烟', description: 'smoking breaks, the social ritual of stepping outside, the 5-minute escape' },
];

/**
 * Randomly select N unique topics from the library.
 */
export function pickRandomTopics(count: number): DailyTopic[] {
  const shuffled = [...DAILY_TOPICS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
