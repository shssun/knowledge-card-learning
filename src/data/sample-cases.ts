/**
 * 预置快捷案例
 * 覆盖 AI基础 领域内的典型场景
 */
import { SampleCase } from '../types/caseAnalysis.types'

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: 'case-1',
    title: '房价下跌，中介连环催单',
    description: '市场价从500万跌到350万，中介说"今天不定明天就涨回去"，你心里开始慌。',
    content: `链家中介打来电话："王先生，您关注的那套房东诚家园，房东同意降到350万了，比上个月便宜了150万。但这套房特别抢手，我今天带看了3组客户，您要是不定，明后天肯定就被人定了。而且国家刚出了救市政策，房价马上要涨回来了！"

你心里很纠结：这套房确实比之前便宜了很多，但350万也不是小数目。而且你隐约感觉中介在催你，但又说不出哪里不对。`,
    keywords: ['锚定效应', '损失厌恶', 'Agent', '幻觉', '神经网络'],
  },
  {
    id: 'case-2',
    title: '奶茶店选址：用感觉还是用数据',
    description: '你打算开一家奶茶店，在两个候选地址之间犹豫：A商场人流大但租金贵，B社区门口租金便宜但人流不确定。',
    content: `我打算开一家奶茶店，选址遇到难题：

候选地址A：商场一楼主通道，日均客流约2000人（目测），租金8万/月，转让费20万。商场刚开业半年，人流还不稳定，但合同可以签3年。

候选地址B：社区底商，租金3万/月，无转让费。小区有2000户，入住率约70%。门口有公交站，但距地铁站800米。

我凭直觉更喜欢B——租金便宜、现金流压力小。但老婆说A更稳妥，毕竟商场人流大。我俩争了一晚上没有结论。`,
    keywords: ['机器学习', 'Embedding', '用户画像', '神经网络', 'Agent'],
  },
  {
    id: 'case-3',
    title: 'AI助手推荐股票，说得很自信',
    description: '你问ChatGPT"帮我看看某某股票能不能买"，它给出了详细分析，还给了具体价位和目标价，听起来很有说服力。',
    content: `我打开ChatGPT问："帮我分析一下某某科技股票，目前股价68块，值得买吗？"

它回答得很详细：
"根据我的分析，某某科技当前PE为28倍，低于行业平均的35倍，具备估值优势。公司Q3营收同比增长23%，净利润增速超过营收增速，说明利润率在改善。技术面上，股价在60-70区间震荡整理，68元处于区间中下部，是不错的入场点。建议在65-68元区间分批建仓，目标价85元，止损位58元。"

它说得头头是道，语气很自信。我要不要信？`,
    keywords: ['幻觉', 'RAG', '大语言模型', 'Agent', '损失厌恶'],
  },
  {
    id: 'case-4',
    title: '团队开会：某人说了算',
    description: '你参与一个产品方案讨论会，技术Leader一开始就定了调子，其他人虽然有不同意见但都附和了。',
    content: `产品方案评审会上，技术Leader老张说："我觉得这个功能用单体架构就够了，不用搞微服务，没必要过度设计。"然后他详细阐述了几个理由，语气很坚定。

你其实有不同看法——这个系统未来扩展性要求很高，单体架构可能埋坑。但看着其他人都点头附和老张，你也犹豫了，想着"他是技术Leader，肯定比我懂"，就没说话。

最后方案就按老张说的定了。过了3个月，果然遇到了扩展性问题，要大改。`,
    keywords: ['锚定效应', '社会认同', '损失厌恶', 'Prompt工程'],
  },
  {
    id: 'case-5',
    title: 'Fine-tuning还是Prompt工程',
    description: '你的客服AI用通用大模型，回答不够专业。你在考虑是花大钱微调模型，还是优化Prompt。',
    content: `我们公司用通用大模型做客服，发现它在回答专业问题（比如保险条款、医疗咨询）时经常出错、说不清楚。

现在有两个方案：

方案A（Prompt工程）：精心设计Prompt，给模型设定角色、加知识背景、加回答格式约束。成本低、见效快，但感觉是"糊弄"，不确定长期效果。

方案B（Fine-tuning）：收集3万条我们公司的客服对话数据，花2周时间微调模型。效果可能更好，但成本高（大概要花8万），而且不确定值不值。

老板问我意见，我不知道该推荐哪个。`,
    keywords: ['Fine-tuning', 'Prompt工程', 'RAG', 'Agent', '幻觉'],
  },
]

/**
 * 根据案例关键词，模糊匹配相关概念
 * 初期用关键词包含匹配，后续可升级为Embedding语义匹配
 */
export function findRelatedConcepts(
  caseKeywords: string[],
  allConcepts: Array<{ term: string; domain: string; keywords?: string[] }>
): string[] {
  const related: string[] = []
  for (const concept of allConcepts) {
    const term = concept.term
    const conceptKeywords = concept.keywords || []
    // 关键词命中（支持中文术语）
    if (
      caseKeywords.some(
        (k) =>
          term.includes(k) ||
          k.includes(term) ||
          conceptKeywords.some((ck) => term.includes(ck) || ck.includes(term))
      )
    ) {
      related.push(term)
    }
  }
  return related
}
