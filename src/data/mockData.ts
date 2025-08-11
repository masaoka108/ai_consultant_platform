import { TalentCard, ConversationHistory } from '../types';

export const mockTalents: TalentCard[] = [
  {
    id: '1',
    name: '中村 智也',
    company: '株式会社テックソリューション',
    skills: ['AI・機械学習', 'Python', 'データ分析', 'プロジェクトマネジメント'],
    introduction: 'AI分野で5年の経験を持つエンジニア。大手企業のDX推進プロジェクトを多数手がけ、技術的な課題解決に定評があります。',
    avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=300'
  },
  {
    id: '2',
    name: '林 美穂',
    company: 'デジタルイノベーション株式会社',
    skills: ['UI/UX設計', 'フロントエンド開発', 'React', 'デザイン思考'],
    introduction: 'ユーザー体験設計のスペシャリスト。スタートアップから大企業まで幅広いプロダクト開発に携わり、使いやすいシステム構築が得意です。',
    avatar: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=300'
  },
  {
    id: '3',
    name: '加藤 雄一',
    company: 'クラウドテック株式会社',
    skills: ['クラウドインフラ', 'AWS', 'DevOps', 'セキュリティ'],
    introduction: 'インフラエンジニアとして10年の経験。大規模システムの構築・運用に精通し、セキュアで安定したシステム基盤の構築を得意としています。',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=300'
  }
];

export const mockConversationHistory: ConversationHistory[] = [
  {
    id: '1',
    consultantId: '1',
    consultantName: '五味田 匡功',
    date: new Date('2024-01-15'),
    messages: [
      {
        id: '1',
        type: 'consultant',
        content: '本日はどのようなお悩みでしょうか？',
        timestamp: new Date('2024-01-15T10:00:00'),
        isAudio: true
      },
      {
        id: '2',
        type: 'user',
        content: 'IT企業への新規営業で苦戦しています',
        timestamp: new Date('2024-01-15T10:01:00'),
        isAudio: true
      }
    ],
    recommendedTalents: mockTalents.slice(0, 2)
  }
];

// 質問フローのモックデータ
export const questionFlow = [
  "こんにちは！五味田と申します。まずは現状のヒアリングをさせていただきたいと思います。御社の事業内容について教えていただけますか？どのような製品やサービスを提供されていますか？",
  "承知しました。御社の従業員数や年間売上規模はおおよそどれくらいでしょうか？",
  "ありがとうございます。開発にかかったコストや今後想定している投資額はいかがですか？",
  "よく、わかりました。最後に助成金や補助金についてすでに知識がおありでしょうか？",
  "わかりました。色々教えてくださりありがとうございます。では御社で活用できそうな補助金や助成金について簡単に案内しますね。"
];

export const hotReadingResponses = [
  "試作を既に進められている点、素晴らしいですね！実際に手を動かして検証されていることは強みです。"
];

export const coldReadingResponses = [
  "ただ、申請では\"事業計画の実現可能性\"と\"自己負担比率\"が厳しく見られますので、その点を押さえましょう。"
];

export const subsidyRecommendations = [
  "御社のような中小企業で、設備投資や試作品開発を支援する『ものづくり補助金』が適しています。\n- 【対象】製造業、情報サービス業など\n- 【補助率】最大2/3（上限1,000万円）\n- 【ポイント】試作品の開発費用、機械設備費、人件費を経費として計上可能\n\n申請書では、\n1. 試作段階から量産フェーズへのロードマップ\n2. 市場ニーズの裏付けデータ\n3. 自己資金・外部資金の出所\nを明確にすると採択率が上がります。",
  "また、介護施設向けセンサーは業務効率化を促進するITツールとして認められる可能性が高く、『IT導入補助金』もご検討ください。\n- 【対象】ITツール導入にかかるソフト・ハード費用\n- 【補助率】1/2（上限450万円）\n- 【ポイント】導入効果（工数削減やBCP強化など）を数値で示すと有利です。",
  "さらに、地域創生や先端技術導入を支援する『地域未来投資促進法』の枠組みもあります。\n- 【対象】地域課題解決型の先端技術\n- 【補助率】1/2～2/3\n- 【ポイント】地域自治体との連携体制やフォロー体制を明示しましょう。"
];

export const finalSummary = "本日はまず３つの補助金・助成金をご紹介しました。\n1. ものづくり補助金\n2. IT導入補助金\n3. 地域未来投資促進法枠組み\n\n次回は、それぞれの申請要件やスケジュール、具体的な書類のポイントを深掘りしていきましょう。";
export const userResponses = [
  "高齢者向けの見守りセンサーを開発していて、主に介護施設向けに提供したいと考えています。",
  "従業員は10名以下で、年間売上は約2,000万円です。",
  "試作費で約30万円、人件費を含めると50万円ほどです。今後は量産に向けてさらに200万円程度を見込んでいます。",
  "いえ、ものずくり補助金とか名前を知っている程度です",
  "今は試作段階で、センサーを５台作成し、社内で動作確認を行っただけです。",
];