import { LogEntry } from './types';

type EntryLike = Pick<LogEntry, 'displayTime' | 'tagLabel' | 'content' | 'observerNote'> & {
  title?: string | null;
};

const TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/外星观察员/g, '记录体'],
  [/观察员/g, '记录体'],
  [/观测站/g, '驻留壳'],
  [/地球/g, '地表'],
  [/人类/g, '地表个体'],
  [/总部/g, '上层系统'],
  [/导师/g, '上级节点'],
  [/实习生/g, '低序列个体'],
  [/同事/g, '并行个体'],
  [/实习岗位/g, '低序列位置'],
  [/星际探索/g, '远距漂移'],
  [/未授权/g, '边缘'],
  [/文明考察/g, '长期采样'],
  [/地球文明/g, '地表群体'],
  [/观察日志/g, '片段记录'],
  [/观察报告/g, '记录文本'],
  [/报告/g, '记录文本'],
  [/观察数据/g, '采样结果'],
  [/会议纪要/g, '围聚残留文本'],
  [/会议室/g, '围聚空间'],
  [/会议/g, '同步围聚'],
  [/开会/g, '进入同步围聚'],
  [/居住单元/g, '夜间停留区'],
  [/居家办公/g, '停留区内产出'],
  [/居住空间/g, '停留空间'],
  [/居住形态/g, '停留形态'],
  [/工作空间/g, '产出空间'],
  [/工作场所/g, '集中产出区'],
  [/工作区域/g, '产出区'],
  [/工作时间/g, '产出时段'],
  [/工作日/g, '产出日'],
  [/工作内容/g, '产出事项'],
  [/工作初期/g, '产出开始阶段'],
  [/工作城市/g, '集中产出区所在结构群'],
  [/工作/g, '产出'],
  [/工位/g, '固定输出位'],
  [/办公室/g, '集中产出区'],
  [/公司/g, '集中产出区'],
  [/同事关系/g, '并行个体关系'],
  [/同事/g, '并行个体'],
  [/团队建设/g, '强制同频活动'],
  [/团建/g, '强制同频'],
  [/绩效评估/g, '产出评估'],
  [/绩效考核/g, '产出校准'],
  [/绩效/g, '产出评分'],
  [/年终奖/g, '周期额外配给'],
  [/月薪/g, '周期配给'],
  [/工资/g, '周期配给'],
  [/房贷/g, '长期空间偿付'],
  [/租房/g, '短期停留权'],
  [/公寓/g, '封闭停留结构'],
  [/卧室/g, '低照度停留角落'],
  [/办公室/g, '集中产出区'],
  [/房间/g, '封闭空间'],
  [/城市/g, '高密度硬质结构群'],
  [/社交对象/g, '亲近对象'],
  [/社交关系/g, '联结关系'],
  [/社交活动/g, '相互靠近活动'],
  [/社交网络/g, '联结网络'],
  [/社交/g, '联结'],
  [/用餐/g, '营养补充'],
  [/吃饭/g, '补充营养'],
  [/午休/g, '正午短暂停摆'],
  [/吃什么/g, '补充什么'],
  [/吃了什么/g, '摄入了什么'],
  [/午餐/g, '正午补充'],
  [/晚餐/g, '夜间补充'],
  [/早餐/g, '晨间补充'],
  [/外卖机器人/g, '配送单元'],
  [/外卖员/g, '配送个体'],
  [/外卖/g, '延迟送达营养'],
  [/回到家/g, '回到夜间停留区'],
  [/家里/g, '停留区内'],
  [/\b在家\b/g, '在停留区内'],
  [/回家/g, '返回停留区'],
  [/房子/g, '停留结构'],
  [/住房/g, '停留结构'],
  [/电梯/g, '垂直运输舱'],
  [/上班/g, '进入产出时段'],
  [/下班/g, '退出产出时段'],
  [/通勤/g, '定向迁移'],
  [/手机/g, '掌中发光板'],
  [/屏幕/g, '发光面'],
  [/闹钟/g, '唤醒声源'],
  [/咖啡/g, '苦味黑液'],
  [/奶茶/g, '甜乳混合液'],
  [/健身/g, '肌束驱动'],
  [/锻炼/g, '肌束驱动'],
  [/新年/g, '新周期'],
  [/春节/g, '周期回迁'],
  [/论文/g, '长篇记录文本'],
  [/宗教/g, '信念结构'],
  [/请来一趟/g, '立刻回传'],
  [/团队/g, '局部群'],
  [/周会/g, '周期围聚'],
  [/周报/g, '周期记录'],
  [/邮件/g, '异步文本'],
  [/礼物/g, '关系确认物'],
  [/心理援助/g, '内在波动支援'],
  [/心理/g, '内在'],
  [/人类社会/g, '群体结构'],
  [/文明/g, '群体结构'],
];

function normalizeContrastPhrasing(text: string): string {
  return text
    .replace(/不是因为([^，。；]+?)，而是因为([^。；]+)/g, '原因更接近$2，与$1无关')
    .replace(/不是因为([^，。；]+?)，是因为([^。；]+)/g, '原因更接近$2，与$1无关')
    .replace(/不是([^，。；]+?)，而是([^。；]+)/g, '更接近$2，不归入$1')
    .replace(/不是([^，。；]+?)，是([^。；]+)/g, '$2，不归入$1')
    .replace(/不是([^。；]+?)。而是([^。；]+)/g, '更接近$2，不归入$1')
    .replace(/不是([^。；]+?)，随后/g, '没有转向$1，随后')
    .replace(/不是([^。；]+?)。/g, '不归入$1。');
}

export function normalizeDisplayText(text: string): string {
  const replaced = TEXT_REPLACEMENTS.reduce((current, [pattern, replacement]) => {
    return current.replace(pattern, replacement);
  }, text);

  return normalizeContrastPhrasing(replaced);
}

export function normalizeEntryCopy<T extends EntryLike>(entry: T): T {
  return {
    ...entry,
    displayTime: normalizeDisplayText(entry.displayTime),
    tagLabel: normalizeDisplayText(entry.tagLabel),
    title: entry.title ? normalizeDisplayText(entry.title) : entry.title,
    content: normalizeDisplayText(entry.content),
    observerNote: normalizeDisplayText(entry.observerNote),
  };
}
