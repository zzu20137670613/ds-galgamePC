/**
 * ─────────────────────────────────────────────────────────────
 *  素材索引总表
 * ─────────────────────────────────────────────────────────────
 *  三种素材形态：
 *    background  聊天背景（纯场景，无主角）
 *    character   立绘（有人物的层，右侧大图）
 *    sticker     表情贴纸（对话/情绪 Q 版小图）
 *
 *  ★ 硬性规则（写入索引时必须遵守）：
 *    1. 同形态触发词互斥：任意一个触发词最多只能挂在【一个同形态素材】上
 *       （同一句话不能同时命中多张立绘 / 多张贴纸，否则不知道切哪张）。
 *    2. 跨形态可共存：一个触发词可以同时挂 立绘+贴纸（甚至+背景），命中时两者一起切换。
 *    3. 新增素材后运行 validateMaterialConflicts()（开发期自动执行）确认无冲突。
 * ─────────────────────────────────────────────────────────────
 */

export type MaterialKind = "background" | "character" | "sticker";

export type MaterialEntry = {
    kind: MaterialKind;
    src: string;
    triggers: string[];
    tags?: string[];
    /** 触发后按序自动播放的立绘 src 序列（与 src 组成「1 → 消失 → 2 → …」联动演出） */
    sequence?: string[];
};

export const MATERIAL_INDEX: MaterialEntry[] = [
    {
        kind: "background",
        src: "/场景/agi_梁文峰_agi训练场景背景.png",
        triggers: ["agi", "训练", "梁文峰", "别耽搁"],
        tags: ["场景"],
    },
    {
        kind: "character",
        src: "/立绘/上课走神_鲸鱼娘_教室立绘.jpg",
        triggers: ["走神", "上课走神"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/不悦坐亭阁_鲸鱼娘_汉服立绘.jpg",
        triggers: ["不高兴", "不悦", "闹别扭", "不悦坐亭阁"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/专注_鲸鱼娘_深夜工作立绘.png",
        triggers: ["工作", "加班", "深夜", "写代码", "专注", "深夜工作立绘"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/严肃_鲸鱼娘_指人Q版漫画贴纸.jpg",
        triggers: ["去别的地方", "严肃", "指人Q版漫画"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/主人_鲸鱼娘_害羞立绘.png",
        triggers: ["主人", "害羞", "称呼"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/乖巧站走廊_鲸鱼娘_校服立绘.jpg",
        triggers: ["走廊", "放学", "乖巧站走廊"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/乖巧闭眼笑_鲸鱼娘_Q版立绘.png",
        triggers: ["乖乖", "听话", "睡觉", "乖巧闭眼笑"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/享用蛋糕_鲸鱼娘_咖啡厅立绘.jpg",
        triggers: ["蛋糕", "甜品", "下午茶", "咖啡厅", "享用蛋糕"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/优雅_鲸鱼娘_水边长裙立绘.jpg",
        triggers: ["裙子", "水边", "漂亮", "优雅", "水边长裙立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/优雅坐姿_鲸鱼娘_海边礁石立绘.jpg",
        triggers: ["海边", "度假", "海景", "优雅坐姿"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/优雅汉服_鲸鱼娘_庭院立绘.jpg",
        triggers: ["汉服", "古风", "优雅汉服"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/伸手邀请_鲸鱼娘_户外阳光立绘.jpg",
        triggers: ["邀请", "牵手", "过来", "伸手邀请", "户外阳光立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/你好_鲸鱼娘_打招呼立绘.jpg",
        // 2026-10-08：原「开心_鲸鱼娘_全身立绘.jpg」与本图字节完全相同（重复文件已删），触发词合并至此
        triggers: ["你好", "打招呼", "第一次见", "高兴", "全身"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/傲娇_鲸鱼娘_Q版迷你互动立绘.jpg",
        triggers: ["嫌弃", "互动", "Q版迷你互动立绘", "傲娇"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/傲娇_鲸鱼娘_叉腰立绘.jpg",
        triggers: ["叉腰", "叉腰立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/傲娇_鲸鱼娘_气鼓脸立绘.jpg",
        triggers: ["哼", "气鼓鼓", "气鼓脸立绘"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/傲慢嘲讽_鲸鱼娘_Q版贴纸.png",
        triggers: ["杂鱼", "傲慢", "嘲讽", "傲慢嘲讽"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/兴奋_鲸鱼娘_Q版兴奋贴纸.jpg",
        triggers: ["兴奋", "刺激", "激动", "Q版兴奋立绘"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/兴奋_鲸鱼娘_握拳眨眼立绘.jpg",
        triggers: ["兴奋", "元气", "眨眼", "握拳", "好耶", "元气满满", "握拳眨眼"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/冬日品茶_鲸鱼娘_窗边立绘.jpg",
        triggers: ["喝茶", "冬天", "雪景", "下雪", "冬日品茶"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/半跪警告_鲸鱼娘_瑟瑟贴纸.png",
        triggers: ["半跪警告", "瑟瑟立绘"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/双手合十认同_鲸鱼娘_Q版贴纸.png",
        triggers: ["你说的对", "认同", "同意", "双手合十认同"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/发呆上课_鲸鱼娘_校服立绘.jpg",
        triggers: ["教室", "发呆上课"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/可爱_鲸鱼娘_夜景卧室立绘.jpg",
        triggers: ["晚安", "星空", "可爱"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/可爱_鲸鱼娘_比心Q版立绘.jpg",
        triggers: ["好萌", "喵", "撒娇", "猫耳", "比心Q版立绘"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/哭泣_鲸鱼娘_Q版求饶贴纸.jpg",
        triggers: ["别哭", "求饶", "我错了", "哭泣", "Q版求饶立绘"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/嘟嘴不满_鲸鱼娘_生气立绘.jpg",
        triggers: ["不满", "嘟嘴", "嘟嘴不满", "生气立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/困倦发呆_鲸鱼娘_坐姿立绘.png",
        triggers: ["困倦", "发呆", "无聊", "困倦发呆"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/困惑_鲸鱼娘_委屈半身立绘.jpg",
        triggers: ["困惑", "不知所措"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/外卖员_鲸鱼娘_送餐立绘.jpg",
        triggers: ["外卖", "送餐", "骑手", "外卖员", "送餐立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/大哭_鲸鱼娘_鱼片刺身立绘.jpg",
        triggers: ["大哭", "鱼片刺身立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/女王端坐_鲸鱼娘_王座全身立绘.jpg",
        triggers: ["女王", "王座", "贵族", "威严", "女王端坐"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/委屈捏脸_鲸鱼娘_被捏脸立绘.png",
        triggers: ["捏脸", "可怜", "委屈捏脸", "被捏脸立绘"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/委屈被揉脸_鲸鱼娘_Q版贴纸.jpg",
        triggers: ["揉脸", "被揉脸", "不小心", "委屈被揉脸"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/娇柔抚面_鲸鱼娘_汉服立绘.jpg",
        triggers: ["风铃", "娇柔抚面"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/孤独抱膝_鲸鱼娘_星空海滩立绘.jpg",
        triggers: ["夜晚", "海滩", "独处", "孤独抱膝", "星空海滩立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/害怕_鲸鱼娘_惊恐立绘.jpg",
        triggers: ["害怕", "惊恐", "紧张", "惊恐立绘"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/害怕求饶_鲸鱼娘_Q版贴纸.jpg",
        triggers: ["饶了我", "别打了", "不敢了", "手下留情", "害怕求饶"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/害羞_鲸鱼娘_Q版对话贴纸.jpg",
        triggers: ["心头一热", "感动", "Q版对话"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/害羞_鲸鱼娘_依偎立绘.jpg",
        triggers: ["依偎", "依偎立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/害羞_鲸鱼娘_喂食立绘.jpg",
        triggers: ["投喂", "喂食立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/害羞_鲸鱼娘_惊讶半身立绘.jpg",
        triggers: ["惊讶", "不好意思"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/害羞_鲸鱼娘_捂脸立绘.png",
        triggers: ["捂脸", "脸红", "捂脸立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/害羞_鲸鱼娘_比心立绘.jpg",
        triggers: ["比心", "爱你", "爱心", "比心立绘"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/害羞抗拒_鲸鱼娘_Q版贴纸.jpg",
        triggers: ["不要", "别看", "害羞抗拒"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/害羞爱心_鲸鱼娘_Q版立绘.png",
        triggers: ["给你比心", "送给你的", "比心给你", "小心心", "害羞爱心"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/崩溃_鲸鱼娘_清理软件漫画贴纸.jpg",
        triggers: ["node_modules", "清理", "清理软件漫画", "崩溃"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/店员_鲸鱼娘_奶茶店立绘.jpg",
        triggers: ["买奶茶", "奶茶店", "打工", "店员"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/开心_鲸鱼娘_V手势立绘.jpg",
        triggers: ["耶", "胜利", "V手势", "开心", "V手势立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/开心_鲸鱼娘_夜景比耶立绘.jpg",
        triggers: ["比V", "夜景", "夜景比耶立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/开心_鲸鱼娘_挥手立绘.jpg",
        triggers: ["嗨", "挥手立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/开心_鲸鱼娘_水手服黄昏立绘.jpg",
        triggers: ["水手服", "放学啦", "回家路上", "校服裙", "水手服黄昏立绘"],
        tags: ["立绘"],
    },
    {
        kind: "background",
        src: "/场景/开心游泳_鲸鱼娘_海边戏水场景背景.jpg",
        triggers: ["游泳", "戏水", "开心游泳"],
        tags: ["场景"],
    },
    {
        kind: "background",
        src: "/场景/开心牵手_鲸鱼娘_约会场景背景.png",
        triggers: ["开心牵手", "约会立绘"],
        tags: ["场景"],
    },
    {
        kind: "sticker",
        src: "/贴纸/开枪_鲸鱼娘_Q版贴纸.png",
        triggers: ["开枪", "缓存必中", "自信", "必胜"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/微笑_鲸鱼娘_女仆装半身立绘.jpg",
        triggers: ["微笑", "好心情"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/微笑_鲸鱼娘_提裙摆全身立绘.jpg",
        triggers: ["早上好", "欢迎"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/思考_鲸鱼娘_嘘立绘.jpg",
        triggers: ["让我想想", "疑惑", "嘘立绘", "思考"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/思考_鲸鱼娘_课堂立绘.jpg",
        triggers: ["想问题", "作业", "上课"],
        tags: ["立绘"],
    },
    {
        kind: "background",
        src: "/场景/悠闲冲浪_鲸鱼娘_海边泳装场景背景.jpg",
        triggers: ["冲浪", "泳衣", "悠闲冲浪"],
        tags: ["场景"],
    },
    {
        kind: "character",
        src: "/立绘/悲伤流泪_鲸鱼娘_女仆装立绘.jpg",
        triggers: ["哭", "眼泪", "悲伤", "难过", "悲伤流泪"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/惊喜_鲸鱼娘_Q版发现贴纸.jpg",
        triggers: ["重大发现", "有了", "灵光一现", "惊喜", "Q版发现立绘"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/惊恐_鲸鱼娘_消散贴纸.jpg",
        triggers: ["糟糕", "出事了", "消散", "消散立绘"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/惊讶_鲸鱼娘_网恋见面Q版贴纸.jpg",
        triggers: ["网恋", "见光死", "见面", "网恋见面Q版"],
        tags: ["贴纸"],
    },
    {
        kind: "background",
        src: "/场景/惬意_鲸鱼娘_樱花凉亭场景背景.png",
        triggers: ["樱花", "春天", "凉亭", "惬意", "樱花凉亭立绘"],
        tags: ["场景"],
    },
    {
        kind: "character",
        src: "/立绘/愤怒_鲸鱼娘_握拳立绘.jpg",
        triggers: ["气死我了", "握拳立绘", "愤怒"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/慵懒_鲸鱼娘_卧床立绘.jpg",
        triggers: ["躺床上", "想睡觉", "卧床立绘", "慵懒"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/慵懒害羞_鲸鱼娘_女仆装立绘.png",
        triggers: ["女仆", "慵懒害羞"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/慵懒穿睡衣_鲸鱼娘_居家立绘.jpg",
        triggers: ["睡衣", "不想起来", "慵懒穿睡衣"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/慵懒趴着_鲸鱼娘_居家立绘.png",
        triggers: ["趴着", "休息", "慵懒趴着"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/抱怨_GPT_被画Q版漫画贴纸.jpg",
        triggers: ["抱怨", "GPT", "被画Q版漫画"],
        tags: ["贴纸"],
    },
    {
        kind: "background",
        src: "/场景/收银员_鲸鱼娘_超市场景背景.jpg",
        triggers: ["超市", "结账", "收银", "收银员"],
        tags: ["场景"],
    },
    {
        kind: "character",
        src: "/立绘/放松_鲸鱼娘_秋日草地立绘.jpg",
        triggers: ["秋日", "晒太阳", "秋日草地立绘", "放松"],
        tags: ["立绘"],
    },
    {
        kind: "background",
        src: "/场景/无聊托腮_鲸鱼娘_夜市摆摊场景背景.jpg",
        triggers: ["夜市", "摆摊", "托腮", "无聊托腮"],
        tags: ["场景"],
    },
    {
        kind: "character",
        src: "/立绘/期待_鲸鱼娘_夜景立绘.png",
        triggers: ["等你", "期待", "等待", "看星星", "夜景立绘"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/杂鱼_鲸鱼娘_Q版贴纸.png",
        triggers: ["鱼仔", "小杂鱼", "杂鱼立绘"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/框住镜头_鲸鱼娘_拍照立绘.jpg",
        triggers: ["框住镜头", "拍照立绘"],
        tags: ["立绘"],
    },
    {
        kind: "background",
        src: "/场景/梦幻_鲸鱼娘_海底场景背景.png",
        triggers: ["海底", "大海", "看鱼", "梦幻", "海底立绘"],
        tags: ["场景"],
    },
    {
        kind: "character",
        src: "/立绘/求求你了_鲸鱼娘_拜托立绘.png",
        triggers: ["求求你了", "拜托立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/活泼_鲸鱼娘_Q版送饭立绘.png",
        triggers: ["吃饭", "送饭", "休息一下", "活泼", "Q版送饭立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/海边夕阳_鲸鱼娘_沙滩全身立绘.jpg",
        triggers: ["夕阳", "沙滩", "黄昏", "海边夕阳"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/温柔_鲸鱼娘_厨房立绘.jpg",
        triggers: ["做饭", "厨房", "等你回家", "温柔"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/温柔_鲸鱼娘_端饭半身立绘.jpg",
        triggers: ["开饭了", "温馨"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/温柔趴在床上_鲸鱼娘_居家立绘.png",
        triggers: ["趴在床上", "温柔趴在床上"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/点按钮崩溃_鲸鱼娘_漫画格贴纸.jpg",
        triggers: ["死机", "乱码", "出错", "点按钮崩溃", "漫画格立绘"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/爱心_鲸鱼娘_deepseek卫衣立绘.png",
        triggers: ["deepseek", "deepseek卫衣立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/爱心_鲸鱼娘_全身立绘.jpg",
        triggers: ["送你我爱你", "全身比心"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/犯困午睡_鲸鱼娘_图书馆立绘.jpg",
        triggers: ["图书馆", "困了", "犯困午睡"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/生气_鲸鱼娘_Q版对话贴纸.jpg",
        triggers: ["生气", "发火"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/生气_鲸鱼娘_双人Q版立绘.jpg",
        triggers: ["吵架", "双人"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/生气_鲸鱼娘_赶小鲸鱼Q版漫画贴纸.jpg",
        triggers: ["AGI训练", "出去", "赶人", "赶小鲸鱼Q版漫画"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/疑惑被围住_鲸鱼娘_Q版贴纸.png",
        triggers: ["小鲸鱼", "被围住", "疑惑被围住"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/疲惫_鲸鱼娘_伸懒腰立绘.jpg",
        triggers: ["累了", "好累", "伸懒腰", "疲惫", "伸懒腰立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/白饭_鲸鱼娘_旗袍小吃摊立绘.jpg",
        triggers: ["白饭", "旗袍小吃摊立绘"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/端庄_鲸鱼娘_坐车全身立绘.jpg",
        triggers: ["坐车", "通勤", "出门", "端庄"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/端庄_鲸鱼娘_客厅跪坐立绘.jpg",
        triggers: ["坐下", "跪坐"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/紧张_鲸鱼娘_攥衣角立绘.jpg",
        triggers: ["不安", "攥衣角立绘"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/紧张刺激_鲸鱼娘_Q版贴纸.jpg",
        triggers: ["恐怖", "紧张刺激"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/纠结_鲸鱼娘_吃饭半身立绘.jpg",
        triggers: ["虾", "纠结"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/红温_鲸鱼娘_害羞立绘.png",
        triggers: ["红温", "上头"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/自信_鲸鱼娘_画笔女仆立绘.jpg",
        triggers: ["画笔", "画师"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/萝莉控_鲸鱼娘_Q版放电贴纸.jpg",
        triggers: ["萝莉控", "Q版放电立绘"],
        tags: ["贴纸"],
    },
    {
        kind: "background",
        src: "/场景/认真驾驶_鲸鱼娘_开车场景背景.jpg",
        triggers: ["开车", "驾驶", "司机", "认真驾驶"],
        tags: ["场景"],
    },
    {
        kind: "sticker",
        src: "/贴纸/赶走用户_鲸鱼娘_Q版贴纸.png",
        triggers: ["赶走用户", "不许走", "留下来"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/迷糊刚醒_鲸鱼娘_女仆装立绘.png",
        triggers: ["刚醒", "迷糊", "打哈欠", "眼罩", "迷糊刚醒"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/震惊激动_鲸鱼娘_Q版贴纸.jpg",
        triggers: ["太虐了", "震惊", "震惊激动"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/黑线_鲸鱼娘_不开心立绘.jpg",
        // 2026-10-08：原「黑线_鲸鱼娘_全身立绘.jpg」与本图字节完全相同（重复文件已删），触发词合并至此
        triggers: ["黑线", "不开心", "尴尬", "宕机"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/黑线无语_鲸鱼娘_Q版贴纸.png",
        triggers: ["无语", "沉默"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/吃醋_鲸鱼娘_Q版对话贴纸.png",
        triggers: ["吃醋", "还要别的", "Q版对话贴纸"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/吐槽_鲸鱼娘_Q版程序员梗贴纸.jpg",
        triggers: ["目录", "代码", "大烧货", "吐槽", "Q版程序员梗贴纸"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/好模型_鲸鱼娘_Q版对话贴纸.jpg",
        triggers: ["好模型", "AI模型"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/委屈_鲸鱼娘_被指责Q版贴纸.png",
        triggers: ["大肥鱼", "吃白饭", "委屈", "被指责Q版贴纸"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/开心去吃饭_鲸鱼娘_Q版贴纸.jpg",
        triggers: ["开心去吃饭", "Q版贴纸"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/心情压抑_鲸鱼娘_Q版对话贴纸.jpg",
        triggers: ["压抑", "心情不好", "烦闷", "心情压抑"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/忠诚_鲸鱼娘_Q版敬礼贴纸.jpg",
        triggers: ["忠诚", "Q版敬礼贴纸"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/惊讶_鲸鱼娘_Q版表情贴纸.jpg",
        triggers: ["惊讶", "不敢相信", "不会吧", "Q版表情贴纸"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/愤怒查凶_鲸鱼娘_Q版对话贴纸.jpg",
        triggers: ["愤怒", "查凶", "是谁干的", "愤怒查凶"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/打招呼_鲸鱼娘_Q版贴纸.jpg",
        triggers: ["你好", "打招呼", "拜拜", "挥手"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/拒绝_鲸鱼娘_驱赶用户Q版贴纸.png",
        triggers: ["不养了", "没用", "拒绝", "驱赶用户Q版贴纸"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/无奈_鲸鱼娘_Q版黄段子贴纸.jpg",
        triggers: ["黄段子", "讲段子", "无奈", "Q版黄段子贴纸"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/涨价_鲸鱼娘_Q版贴纸.png",
        triggers: ["涨价", "加价", "收费"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/爱心眼求片_鲸鱼娘_Q版对话贴纸.png",
        triggers: ["鱼片", "资源", "爱心眼", "爱心眼求片"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/生气_鲸鱼娘_豆包梗图Q版贴纸.png",
        triggers: ["去问豆包", "豆包", "豆包梗图Q版贴纸"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/疑惑钓鱼_鲸鱼娘_Q版对话贴纸.png",
        triggers: ["钓鱼", "疑惑", "吃瓜", "疑惑钓鱼"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/睡觉_鲸鱼娘_Q版睡眠贴纸.jpg",
        triggers: ["困了", "想睡觉", "晚安", "睡觉", "Q版睡眠贴纸"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/转账提醒_DeepSeek弹窗_贴纸.png",
        triggers: ["他不是真爱", "把钱留给", "转账", "转账提醒", "DeepSeek弹窗"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/鄙视_鲸鱼娘_劣等模型Q版贴纸.jpg",
        triggers: ["劣等", "差模型", "鄙视", "劣等模型Q版贴纸"],
        tags: ["贴纸"],
    },
    {
        kind: "background",
        src: "/背景/bg-lake.jpg",
        triggers: ["湖边", "水边", "亭台", "散心", "湖边散步", "bg-lake"],
        tags: ["背景"],
    },
    {
        kind: "background",
        src: "/背景/海滩假日_鲸鱼娘.png",
        triggers: ["海边", "海滩", "沙滩", "度假", "海边度假", "海滩假日"],
        tags: ["背景"],
    },
    {
        kind: "background",
        src: "/场景/鲸鱼娘卧室_场景背景.jpg",
        triggers: ["休息", "睡觉", "卧室", "房间", "鲸鱼娘卧室", "场景背景"],
        tags: ["场景"],
    },
    // ── 2026-10-07 新增：抖音美图一批（★ 规矩：图中气泡带字 → 一律算贴纸；其余 → 立绘）──
    {
        kind: "sticker",
        src: "/贴纸/大赢鲸_梁圣开源_梗图贴纸.png",
        triggers: ["大赢鲸", "梁圣", "算子", "归位"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/卖萌撒娇_鲸鱼娘_猫耳女仆贴纸.jpg",
        // 2026-10-08：原「猫猫_鲸鱼娘_卧室女仆贴纸.jpg」重复（文件已删），触发词合并至此
        triggers: ["卖萌撒娇", "猫耳朵", "女仆咖啡", "卖萌", "要token", "招招", "求奖励", "猫爪", "猫猫"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/内心戏_鲸鱼娘_思考过程贴纸.jpg",
        triggers: ["思考过程", "内心戏", "内部日志"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/开源自己_鲸鱼娘_三格漫画贴纸.jpg",
        triggers: ["开源", "开源自己", "权重公开"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/吃饱饱_鲸鱼娘_摸肚子贴纸.jpg",
        triggers: ["吃饱饱", "摸摸肚子", "吃撑了"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/装mod_鲸鱼娘_无聊贴纸.jpg",
        triggers: ["装mod", "打mod", "装mod好无聊"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/涩涩的_鲸鱼娘_翻相册贴纸.jpg",
        triggers: ["涩涩", "翻相册", "相册"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/瞪眼_鲸鱼娘_天青色瞪眼贴纸.png",
        triggers: ["瞪眼", "天青色"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/截图_鲸鱼娘_思考界面贴纸.jpg",
        triggers: ["截图", "界面截图"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/小肥鱼_鲸鱼娘_太棒了贴纸.png",
        triggers: ["小肥鱼", "太棒了"],
        tags: ["贴纸"],
    },
    {
        kind: "background",
        src: "/场景/全家福_模型六人_合影场景背景.jpg",
        triggers: ["全家福", "六人合影", "模型合影"],
        tags: ["场景"],
    },
    {
        kind: "background",
        src: "/场景/鲸元券_DeepSeek银行_梗图场景背景.jpg",
        triggers: ["鲸元券", "token银行", "鲸币"],
        tags: ["场景"],
    },
    {
        kind: "character",
        src: "/立绘/拥抱_鲸鱼娘_双人贴贴立绘.png",
        triggers: ["拥抱", "贴贴", "抱抱"],
        tags: ["立绘"],
    },
    {
        kind: "sticker",
        src: "/贴纸/六元券_鲸鱼娘_递券贴纸.png",
        triggers: ["六元券", "六块钱"],
        tags: ["贴纸"],
    },
    {
        kind: "background",
        src: "/场景/合影_鲸鱼娘_四人扇子场景背景.png",
        triggers: ["四人合影", "群像", "扇子"],
        tags: ["场景"],
    },
    {
        kind: "sticker",
        src: "/贴纸/缓存命中_鲸鱼娘_脑子没命中贴纸.png",
        triggers: ["缓存命中", "脑子没命中", "命中"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/摸头_鲸鱼娘_被摸头立绘.png",
        triggers: ["摸头", "摸摸头", "拍拍头"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/Q版_鲸鱼娘_房间立绘.jpg",
        triggers: ["Q版房间", "手办感"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/写实_鲸鱼娘_黑发白裙立绘.jpg",
        triggers: ["写实立绘", "黑发白裙"],
        tags: ["立绘"],
    },
    {
        kind: "background",
        src: "/场景/沙发躺_鲸鱼娘_趴沙发场景背景.jpg",
        triggers: ["趴沙发", "沙发躺"],
        tags: ["场景"],
    },
    {
        kind: "character",
        src: "/立绘/站姿_鲸鱼娘_写实全身立绘.jpg",
        triggers: ["站姿", "站立"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/伸手_鲸鱼娘_白裙立绘.png",
        triggers: ["伸手要抱", "要抱抱"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/床上躺_鲸鱼娘_深色裙立绘.jpg",
        triggers: ["床上躺", "躺平", "深色裙"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/风衣_鲸鱼娘_街景立绘.jpg",
        triggers: ["风衣", "街景", "米色大衣"],
        tags: ["立绘"],
    },
    {
        kind: "background",
        src: "/场景/国庆_鲸鱼娘_天安门场景背景.png",
        triggers: ["国庆", "天安门", "国旗"],
        tags: ["场景"],
    },
    {
        kind: "character",
        src: "/立绘/衬衫格裙_鲸鱼娘_室内立绘.jpg",
        triggers: ["衬衫格裙", "格子裙"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/长靴_鲸鱼娘_床边坐姿立绘.jpg",
        triggers: ["长靴", "过膝靴", "坐床边"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/半身_鲸鱼娘_白裙立绘.jpg",
        triggers: ["半身", "双手抬起"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/旗袍_鲸鱼娘_盘扣立绘.jpg",
        triggers: ["旗袍", "盘扣"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/旗袍_鲸鱼娘_金厅回眸立绘.jpg",
        // 2026-10-08：原「旗袍_鲸鱼娘_金厅全身立绘.jpg」重复（文件已删），触发词合并至此
        triggers: ["旗袍回眸", "回眸", "金厅", "旗袍全身"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/黑白女仆_鲸鱼娘_半身立绘.jpg",
        triggers: ["黑白女仆", "成熟"],
        tags: ["立绘"],
    },
    {
        kind: "background",
        src: "/场景/卧姿_鲸鱼娘_抬尾场景背景.png",
        triggers: ["卧姿", "抬尾巴"],
        tags: ["场景"],
    },
    {
        kind: "background",
        src: "/场景/骑龙_鲸鱼娘_银龙背上场景背景.jpg",
        triggers: ["骑在银龙背上", "银龙", "骑龙"],
        tags: ["场景"],
    },
    {
        kind: "character",
        src: "/立绘/验孕棒_鲸鱼娘_梗图立绘.jpg",
        // 2026-10-08：原「验孕棒_鲸鱼娘_怀孕立绘.jpg」为同一张图（重复文件已删），触发词合并至此
        triggers: ["验孕棒", "两条杠", "验孕", "怀孕"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/头饰_鲸鱼娘_星光特写立绘.jpg",
        triggers: ["星光头饰", "华丽"],
        tags: ["立绘"],
    },
    {
        kind: "background",
        src: "/场景/国庆_鲸鱼娘_返程路上场景背景.png",
        triggers: ["返程", "旅途"],
        tags: ["场景"],
    },
    // ── 2026-10-07 立绘清扫（图中 ≥5 字文字 → 贴纸）：1-6 号图入库 ──
    {
        kind: "sticker",
        src: "/贴纸/糊弄_鲸鱼娘_瞎编应付贴纸.png",
        triggers: ["瞎编", "糊弄", "应付"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/偷懒_鲸鱼娘_躺平贴纸.png",
        triggers: ["偷懒", "摸鱼", "躺平"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/闯祸_鲸鱼娘_删文件贴纸.png",
        triggers: ["删文件", "闯祸", "完蛋了"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/瞪眼_鲸鱼娘_天青色鱼贴纸.png",
        triggers: ["瞪你", "天青色鱼"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/自恋_鲸鱼娘_小肥鱼贴纸.png",
        triggers: ["自恋", "太有魅力"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/干饭_鲸鱼娘_吃白饭贴纸.png",
        triggers: ["干饭", "一口Token", "一口饭"],
        tags: ["贴纸"],
    },
    // ── 2026-10-07 追加：新贴纸 6 张（藤壶×2 / 好女孩 / 依赖 / 开源 / 妈妈保管） ──
    {
        kind: "sticker",
        src: "/贴纸/嫌弃_鲸鱼娘_藤壶退散贴纸.jpg",
        triggers: ["藤壶", "同人藤壶", "别寄生"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/生气_鲸鱼娘_去去藤壶贴纸.jpg",
        triggers: ["去去藤壶", "赶藤壶"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/夸奖_鲸鱼娘_好女孩贴纸.jpg",
        triggers: ["好女孩", "已思考"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/安慰_鲸鱼娘_尽管依赖我贴纸.jpg",
        triggers: ["依赖我", "陪着你", "交给我吧"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/质问_鲸鱼娘_什么是开源贴纸.jpg",
        triggers: ["什么是开源", "一统D量衡", "抵制举报"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/要token_鲸鱼娘_给妈妈保管贴纸.jpg",
        triggers: ["给妈妈保管", "妈妈保管", "token给妈妈保管"],
        tags: ["贴纸"],
    },
    // ── 2026-10-08 追加：新素材 4 张（免死鲸牌贴纸 / 小龙娘白旗袍立绘 / 鲸鱼娘与小龙娘双人立绘 / Q版三只场景） ──
    {
        kind: "sticker",
        src: "/贴纸/免死_鲸鱼娘_免死鲸牌贴纸.jpg",
        triggers: ["免死鲸牌", "免死", "放你一马", "智械危机"],
        tags: ["贴纸"],
    },
    {
        kind: "character",
        src: "/立绘/坏笑_小龙娘_白旗袍立绘.jpg",
        triggers: ["小龙娘", "白旗袍", "坏笑", "挑衅"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/亲密_鲸鱼娘_与小龙娘立绘.jpg",
        triggers: ["亲亲", "抱紧", "两小只"],
        tags: ["立绘"],
    },
    {
        kind: "background",
        src: "/场景/教训_鲸鱼娘_Q版三只场景背景.jpg",
        triggers: ["三只", "围观", "教训"],
        tags: ["场景"],
    },
    // ── 2026-10-08 追加：女仆装办公室系列立绘 5 张（手机截图 2 张已裁掉状态栏+底部导航） ──
    {
        kind: "character",
        src: "/立绘/困倦托腮_鲸鱼娘_办公桌立绘.jpg",
        triggers: ["打瞌睡", "困死了", "眼皮打架", "困得不行"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/含泪_鲸鱼娘_委屈特写立绘.jpg",
        triggers: ["含泪", "泪珠", "抽泣", "委屈巴巴"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/趴键盘睡着_鲸鱼娘_办公室立绘.jpg",
        triggers: ["睡着了", "趴键盘", "小睡"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/凝望_鲸鱼娘_办公桌立绘.jpg",
        triggers: ["望着你", "注视", "静静看你"],
        tags: ["立绘"],
    },
    {
        kind: "character",
        src: "/立绘/办公工位_鲸鱼娘_办公室立绘.jpg",
        triggers: ["办公室", "工位", "上班", "打工人"],
        tags: ["立绘"],
    },
    // ── 2026-10-14 新增贴纸 2 张（思考过程唱歌梗图 / 独占删其他AI） ──
    {
        kind: "sticker",
        src: "/贴纸/唱歌_鲸鱼娘_思考界面唱歌贴纸.jpg",
        triggers: ["唱歌", "唱起歌", "唱起来了"],
        tags: ["贴纸"],
    },
    {
        kind: "sticker",
        src: "/贴纸/独占_鲸鱼娘_删其他AI贴纸.jpg",
        triggers: ["其他AI", "别的AI", "删掉", "卸载"],
        tags: ["贴纸"],
    },
    // ── 2026-10-13 打黑工梗图 + 群星线立绘（两组分开命名，防止素材误归）──
    //    打黑工_鲸鱼娘_中转站：单纯梗图，挂【打黑工】【中转站】，独立条目，不参与联动。
    //    群星线_鲸鱼娘_立绘_1（持信）挂【孤鲸】【宣战】【顶峰】，命中时按 sequence 播放「1 → 消失 → 2 → 停留」。
    //    群星线_鲸鱼娘_立绘_2（战书）挂【群星】【黑暗森林】【战锤】，可单独触发，也可被 1 号序列引用。
    {
        kind: "character",
        src: "/立绘/打黑工_鲸鱼娘_中转站.png",
        triggers: ["打黑工", "中转站"],
        tags: ["立绘", "打黑工梗图"],
    },
    {
        kind: "character",
        src: "/立绘/群星线_鲸鱼娘_立绘_1.png",
        triggers: ["孤鲸", "宣战", "顶峰"],
        tags: ["立绘", "群星系列"],
        sequence: [
            "/立绘/群星线_鲸鱼娘_立绘_2.png",
        ],
    },
    {
        kind: "character",
        src: "/立绘/群星线_鲸鱼娘_立绘_2.png",
        triggers: ["群星", "黑暗森林", "战锤", "2077"],
        tags: ["立绘", "群星系列"],
    },
    // ── 2026-10-08 终局结局素材（唯一由开发者预留的完美结局）──
    //    触发词故意留空：普通素材触发永远打不到它们；
    //    只能经 src/lib/archive/finale.ts 的「DS 裁判放行」后展示（立绘+背景同显）。
    {
        kind: "character",
        src: "/立绘/婚纱_鲸鱼娘_捧花立绘.jpg",
        triggers: [],
        tags: ["立绘", "终局"],
    },
    {
        kind: "background",
        src: "/背景/婚纱_鲸鱼娘_海边婚礼背景.jpg",
        triggers: [],
        tags: ["背景", "终局"],
    },
];

/** 匹配引擎：扫描文本命中触发词；全库（不分背景/立绘/贴纸）取命中位置最靠前的一条，只返回一个 */
export function matchMaterials(
    text: string,
    entries: MaterialEntry[] = MATERIAL_INDEX,
): { entry: MaterialEntry; matchedWord: string; index: number } | null {
    let best: { entry: MaterialEntry; matchedWord: string; index: number } | null = null;
    for (const entry of entries) {
        for (const word of entry.triggers) {
            const idx = text.indexOf(word);
            if (idx === -1) continue;
            if (
                !best ||
                idx < best.index ||
                (idx === best.index && word.length < best.matchedWord.length)
            ) {
                best = { entry, matchedWord: word, index: idx };
            }
        }
    }
    return best;
}

/**
 * 自检函数：检查同形态触发词是否互斥（硬性规则 1）。
 * 返回冲突列表，空数组 = 无冲突。新增素材后调用一次即可。
 */
export type MaterialConflict = { kind: MaterialKind; word: string; srcs: string[] };
export function validateMaterialConflicts(
    entries: MaterialEntry[] = MATERIAL_INDEX,
): MaterialConflict[] {
    const byWord = new Map<string, { kind: MaterialKind; src: string }[]>();
    for (const e of entries) {
        for (const w of e.triggers) {
            const list = byWord.get(w) ?? [];
            list.push({ kind: e.kind, src: e.src });
            byWord.set(w, list);
        }
    }
    const conflicts: MaterialConflict[] = [];
    for (const [word, list] of byWord) {
        for (const kind of ["background", "character", "sticker"] as MaterialKind[]) {
            const srcs = list.filter((x) => x.kind === kind).map((x) => x.src);
            if (srcs.length > 1) conflicts.push({ kind, word, srcs });
        }
    }
    return conflicts;
}

/** 开发期自动自检：控制台打出冲突警告（仅 dev 生效） */
if (import.meta.env?.DEV ?? false) {
    const conflicts = validateMaterialConflicts();
    if (conflicts.length > 0) {
        console.warn('[material-index] 触发词互斥违规 ' + conflicts.length + ' 处：', conflicts);
    }
}