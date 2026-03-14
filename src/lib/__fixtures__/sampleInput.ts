// === UraChara AI - Test Fixtures ===
// テスト用のサンプルデータ（リアルな日本語ユーザーデータ）

import type { AnalysisResult, UserInput } from "@/types/shared";

// === Sample 1: High Gap Score User ===
// 表: キラキラSNS投稿のアクティブ系
// 裏: インドア廃人

export const highGapUserInput: UserInput = {
  snsContent:
    "今日はおしゃれカフェで作業DAY☕✨ 集中できる〜！/ 週末は友達と渋谷でランチ🍽️ 新しいお店開拓するの楽しい！/ 朝活始めました💪 5時起きで白湯飲んでヨガ。最高の朝！/ この映画マジで泣いた😭 みんな絶対観て！/ ジム行ってきた🏋️ 今日は脚の日。追い込んだ〜！/ 週末のBBQめっちゃ楽しかった🍖 やっぱりアウトドア最高！",
  hobbies:
    "カフェ巡り、筋トレ、ヨガ、映画鑑賞。最近はソロキャンプにも興味あり。あと実はアニメもけっこう見てて、深夜アニメは毎クール3本くらいチェックしてる。Vtuberの配信も寝る前に見てる。",
  schedule:
    "7時起床（本当は二度寝して8時）→カフェで作業（SNS投稿用の写真撮ってからダラダラ）→14時くらいに帰宅→YouTube見ながらゴロゴロ→18時ジム（週2くらい、サボりがち）→帰宅→アニメ→深夜2時就寝",
  musicTaste:
    "SNSではYOASOBI、King Gnu、藤井風あたりをシェアしてるけど、実際一番聴いてるのはアニソンとボカロ。深夜はCity PopとLo-fi Hip Hopでまったり。",
  firstImpression:
    "よく「アクティブだね」「いつもキラキラしてる」って言われる。でも実は週末ほぼ家にいるし、友達との予定は月2くらい。",
};

export const highGapExpectedResult: AnalysisResult = {
  id: "fixture-high-gap-001",
  surface: {
    title: "意識高い系カフェワーカー",
    emoji: "✨",
    summary:
      "SNSではおしゃれカフェでの作業風景を投稿し、週末はジムで自分磨き。周りからは「キラキラしてる」と言われるタイプ。トレンドにも敏感で、新しいものにはすぐ飛びつく行動派。",
    traits: ["社交的", "ポジティブ", "アクティブ", "意識高い", "トレンド敏感"],
    scoredTraits: [
      {
        label: "社交性",
        score: 82,
        description: "友達とのランチやBBQなど、グループ活動を頻繁に投稿。社交的な印象を強く発信。",
      },
      {
        label: "行動力",
        score: 78,
        description: "朝活、ジム、カフェ巡りなどアクティブなライフスタイルを演出。",
      },
      {
        label: "感受性",
        score: 45,
        description: "映画で泣く一面はあるが、基本的にはポジティブでクールな印象。",
      },
      {
        label: "論理性",
        score: 60,
        description: "作業カフェ利用など、効率を意識する姿勢が見える。",
      },
      {
        label: "自己主張",
        score: 71,
        description: "おすすめや感想をはっきり発信。自分の意見を持っている印象。",
      },
    ],
    confidence: 85,
  },
  hidden: {
    title: "布団から出たくないインドア廃人",
    emoji: "🛋️",
    summary:
      "カフェで作業してる風だけど、実はYouTube見てる時間の方が長い。筋トレもサボりがちで、本当の週末は布団の中。深夜アニメとVtuberが生きがい。",
    traits: ["インドア派", "オタク気質", "ズボラ", "夜型", "一人好き"],
    scoredTraits: [
      {
        label: "社交性",
        score: 35,
        description: "友達との予定は月2回程度。実際はほぼ家で一人の時間を過ごしている。",
      },
      {
        label: "行動力",
        score: 28,
        description: "ジムは週2でサボりがち。二度寝常習犯。行動より妄想派。",
      },
      {
        label: "感受性",
        score: 72,
        description: "アニメやVtuberに深く没入。音楽の趣味にも感受性の高さが表れている。",
      },
      {
        label: "論理性",
        score: 55,
        description: "SNS用の写真を先に撮るなど、計算はできるがそこまで論理的ではない。",
      },
      {
        label: "自己主張",
        score: 30,
        description: "本当の趣味（アニメ、Vtuber）は隠しがち。空気を読んで合わせるタイプ。",
      },
    ],
    confidence: 80,
    evidence: [
      "深夜アニメを毎クール3本チェック＋Vtuber視聴 → オタク趣味を隠している",
      "スケジュールの「本当は二度寝して8時」「サボりがち」→ 投稿とのギャップ",
      "音楽：SNSでシェアするのと実際に聴くものが違う",
      "友達との予定は月2回 → 「アクティブ」の印象とは大きなギャップ",
    ],
  },
  gap: {
    overallGapScore: 74,
    gapLevel: "moe",
    gapLevelLabel: "ギャップ萌えタイプ",
    traitComparisons: [
      {
        category: "社交性",
        icon: "🎭",
        surfaceLabel: "みんなでワイワイ派",
        hiddenLabel: "実は一人が好き",
        surfaceScore: 82,
        hiddenScore: 35,
        gap: 47,
      },
      {
        category: "行動力",
        icon: "⚡",
        surfaceLabel: "アクティブ派",
        hiddenLabel: "実はインドア廃人",
        surfaceScore: 78,
        hiddenScore: 28,
        gap: 50,
      },
      {
        category: "感受性",
        icon: "💖",
        surfaceLabel: "クールに見えて",
        hiddenLabel: "実は涙もろい",
        surfaceScore: 45,
        hiddenScore: 72,
        gap: 27,
      },
      {
        category: "論理性",
        icon: "🧠",
        surfaceLabel: "効率重視",
        hiddenLabel: "ほぼ同じ",
        surfaceScore: 60,
        hiddenScore: 55,
        gap: 5,
      },
      {
        category: "自己主張",
        icon: "💬",
        surfaceLabel: "意見はっきり",
        hiddenLabel: "実は空気読みすぎ",
        surfaceScore: 71,
        hiddenScore: 30,
        gap: 41,
      },
    ],
    aiComment:
      "キラキラSNSの裏に隠れた布団民を発見しました。表ではアクティブ全開だけど、中身は深夜アニメとVtuberが生きがいのインドア派。そのギャップがむしろ魅力的！",
    surprisingFinding:
      "音楽の好みが一番本音を表してました。SNSでシェアするのはYOASOBIなのに、実際はアニソンとボカロ。深夜のCity Popにあなたの本当の感受性が出てる。",
  },
  shareCard: {
    surfaceTitle: "意識高い系カフェワーカー",
    hiddenTitle: "布団から出たくないインドア廃人",
    surfaceEmoji: "✨",
    hiddenEmoji: "🛋️",
    gapScore: 74,
    gapLevel: "moe",
    gapLevelLabel: "ギャップ萌えタイプ",
    catchphrase: "キラキラの裏にゴロゴロ",
    shareText:
      "私の裏キャラは「布団から出たくないインドア廃人」でした！ギャップスコア: 74点 #裏キャラAI #裏キャラ診断",
  },
  analyzedAt: "2026-03-14T12:00:00.000Z",
};

// === Sample 2: Low Gap Score User ===
// 表も裏もほぼ同じ素直タイプ

export const lowGapUserInput: UserInput = {
  snsContent:
    "今日も家でゲームしてた。ランク上がった！/ 新しいラーメン屋行ってきた。味噌が最高だった🍜 / 仕事終わり。疲れた。帰ってアニメ見る。/ 週末何もしてない。最高。/ 猫カフェ行った。猫かわいい。それだけ。/ コンビニの新作スイーツうまかった。",
  hobbies:
    "ゲーム（RPGとFPS）、アニメ、漫画、ラーメン巡り。基本インドア。たまに猫カフェ。最近はDead by Daylightにハマってる。",
  schedule:
    "8時起床→9-18時仕事（リモート）→コンビニで夕飯買う→ゲーム→深夜1時就寝。週末はほぼ家。たまにラーメン屋。",
  musicTaste: "アニソン、ゲームのサントラ。最近はチェンソーマンのOP聴いてる。米津玄師も好き。",
  firstImpression: "「静かだね」「マイペースだね」ってよく言われる。自分でもそう思う。",
};

export const lowGapExpectedResult: AnalysisResult = {
  id: "fixture-low-gap-002",
  surface: {
    title: "マイペース・インドア職人",
    emoji: "🎮",
    summary:
      "自分のペースを大事にするインドア派。ゲームとアニメが好きで、SNSでもそれを隠さない。飾らない投稿スタイルが特徴。",
    traits: ["マイペース", "インドア派", "正直", "穏やか", "こだわり"],
    scoredTraits: [
      {
        label: "社交性",
        score: 30,
        description: "基本一人行動。SNSでも誰かと一緒の投稿が少ない。",
      },
      {
        label: "行動力",
        score: 35,
        description: "行動範囲は狭めだが、好きなこと（ラーメン巡り）には動く。",
      },
      {
        label: "感受性",
        score: 55,
        description: "猫カフェやスイーツへの反応から、感性は普通に豊か。",
      },
      { label: "論理性", score: 50, description: "ゲームでのランク上昇など、攻略には論理的。" },
      { label: "自己主張", score: 25, description: "静か。意見より感想を述べるタイプ。" },
    ],
    confidence: 75,
  },
  hidden: {
    title: "裏も表もゲーマーな正直者",
    emoji: "🕹️",
    summary:
      "裏も表もほぼ同じ。ゲームが好きで、アニメが好きで、ラーメンが好き。飾らないのが最大の魅力。自分に正直に生きている。",
    traits: ["素直", "自分に正直", "ゲーマー", "穏やか", "低燃費"],
    scoredTraits: [
      { label: "社交性", score: 25, description: "表と同じく一人が好き。無理に人付き合いしない。" },
      { label: "行動力", score: 30, description: "表よりやや省エネ。でもそれが心地いいスタイル。" },
      {
        label: "感受性",
        score: 60,
        description: "好きなものへの愛は深い。猫への反応に優しさが出ている。",
      },
      { label: "論理性", score: 55, description: "ゲーム攻略への集中力は裏でも健在。" },
      {
        label: "自己主張",
        score: 20,
        description: "主張しないのは表裏一貫。空気というより風のような存在。",
      },
    ],
    confidence: 70,
    evidence: [
      "SNSの投稿内容と実際の過ごし方がほぼ一致",
      "趣味を隠さず公開している",
      "第一印象と自己認識が一致（「静か」「マイペース」）",
    ],
  },
  gap: {
    overallGapScore: 12,
    gapLevel: "honest",
    gapLevelLabel: "素直タイプ",
    traitComparisons: [
      {
        category: "社交性",
        icon: "🎭",
        surfaceLabel: "一人が好き",
        hiddenLabel: "やっぱり一人が好き",
        surfaceScore: 30,
        hiddenScore: 25,
        gap: 5,
      },
      {
        category: "行動力",
        icon: "⚡",
        surfaceLabel: "省エネ派",
        hiddenLabel: "さらに省エネ",
        surfaceScore: 35,
        hiddenScore: 30,
        gap: 5,
      },
      {
        category: "感受性",
        icon: "💖",
        surfaceLabel: "穏やかな感性",
        hiddenLabel: "実は優しい",
        surfaceScore: 55,
        hiddenScore: 60,
        gap: 5,
      },
      {
        category: "論理性",
        icon: "🧠",
        surfaceLabel: "攻略脳",
        hiddenLabel: "やっぱり攻略脳",
        surfaceScore: 50,
        hiddenScore: 55,
        gap: 5,
      },
      {
        category: "自己主張",
        icon: "💬",
        surfaceLabel: "静かな人",
        hiddenLabel: "やっぱり静か",
        surfaceScore: 25,
        hiddenScore: 20,
        gap: 5,
      },
    ],
    aiComment:
      "表も裏もほぼ同じ！自分に正直に生きてる素直タイプ。飾らないのが逆にレア。そのままのあなたでいてください。",
    surprisingFinding:
      "ギャップが少なすぎて逆にびっくり。SNSで自分を盛らないのは今の時代むしろ珍しい才能かも。",
  },
  shareCard: {
    surfaceTitle: "マイペース・インドア職人",
    hiddenTitle: "裏も表もゲーマーな正直者",
    surfaceEmoji: "🎮",
    hiddenEmoji: "🕹️",
    gapScore: 12,
    gapLevel: "honest",
    gapLevelLabel: "素直タイプ",
    catchphrase: "表も裏も、ただのゲーマー",
    shareText:
      "私の裏キャラは「裏も表もゲーマーな正直者」でした！ギャップスコア: 12点 #裏キャラAI #裏キャラ診断",
  },
  analyzedAt: "2026-03-14T12:00:00.000Z",
};
