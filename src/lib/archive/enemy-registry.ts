/**
 * 敌人注册表（孤胆枪手1怪物底板 · 立绘后续换，机制不动）
 * ─────────────────────────────────────────────────────────────
 * 设计定稿（2026-10-08 用户口述）：
 *  · 底板 = Alien Shooter 1 (Sigma Team, 2003) 怪物体系
 *  · 斜45°俯视 2.5D、固定视角
 *  · 立绘/美术后续换，怪物机制大概率不换——节省工作量
 *  · 压缩后的场景→地图映射中，API 只填槽不发明机制
 *     （怪物、Boss 全部由本注册表预设，API 只管"这场用人哪几个"）
 * ─────────────────────────────────────────────────────────────
 */

export type EnemyRole = "grunt" | "elite" | "boss";
export type EnemyBehavior = "melee" | "ranged" | "explode" | "swarm";

export type EnemyEntry = {
    id: string;
    /** 中文显示名 */
    name: string;
    /** 角色定位：杂兵 / 精英 / Boss */
    role: EnemyRole;
    /** 行为模式 */
    behavior: EnemyBehavior;
    /** 特征描述（供 API 理解该敌人的战术定位） */
    traits: readonly string[];
    /** 推荐出现的场景氛围标签 */
    vibeTags: readonly string[];
};

export type BossSlot = {
    id: string;
    /** Boss 名 */
    enemyId: string;
    /** 关卡编号（1-10） */
    level: number;
    /** Boss 出现条件描述（给 API 参考） */
    conditionHint: string;
};

/**
 * 孤胆枪手1 怪物注册表。
 * API 在填场景→地图映射时，从本表选怪；不得发明新怪物类型。
 */
export const ENEMY_REGISTRY: readonly EnemyEntry[] = [
    {
        id: "mutant-frog",
        name: "变异蛙",
        role: "grunt",
        behavior: "swarm",
        traits: ["速度最快", "攻击时判定框变大", "成群出现", "低血量", "近战撕咬"],
        vibeTags: ["下水道", "实验室", "孵化场", "废土"],
    },
    {
        id: "tall-biped",
        name: "异形步行者",
        role: "grunt",
        behavior: "melee",
        traits: ["中等移速", "攻击前摇较长", "血量中等", "近战挥击"],
        vibeTags: ["走廊", "仓库", "军营", "废墟"],
    },
    {
        id: "armed-biped",
        name: "武装步行者",
        role: "elite",
        behavior: "ranged",
        traits: ["巡逻时与步行者同速", "交战模式移速变慢", "间歇射击", "中远程"],
        vibeTags: ["军事基地", "研究设施", "指挥中心", "堡垒"],
    },
    {
        id: "rhino",
        name: "犀牛巨怪",
        role: "elite",
        behavior: "melee",
        traits: ["移速慢", "高伤害（≈25点/次）", "高血量", "攻击冷却长", "近战冲撞"],
        vibeTags: ["工业区", "地下洞穴", "货仓", "废土"],
    },
    {
        id: "rhino-bullet",
        name: "子弹犀牛",
        role: "elite",
        behavior: "ranged",
        traits: ["移速慢", "交战模式几乎静止", "自动射击", "高血量", "中远程压制"],
        vibeTags: ["军事基地", "防御工事", "要塞", "前线"],
    },
    {
        id: "rhino-rocket",
        name: "火箭犀牛",
        role: "elite",
        behavior: "ranged",
        traits: ["移速慢", "火箭弹攻击", "范围伤害", "高血量", "远距离轰炸"],
        vibeTags: ["露天战场", "废墟", "码头", "桥梁"],
    },
    {
        id: "rhino-plasma",
        name: "等离子犀牛",
        role: "elite",
        behavior: "ranged",
        traits: ["移速慢", "等离子炮攻击", "穿甲伤害", "高血量", "远距离狙击"],
        vibeTags: ["研究设施", "核心区域", "飞船", "实验室"],
    },
    {
        id: "lurker",
        name: "潜伏者",
        role: "grunt",
        behavior: "melee",
        traits: ["高移速", "敏捷", "从背后/侧面突袭", "血量低", "可被爆炸物晕眩"],
        vibeTags: ["暗区", "通风管道", "地下隧道", "废墟"],
    },
    {
        id: "burster",
        name: "自爆体",
        role: "elite",
        behavior: "explode",
        traits: ["体型大", "移速中等", "死亡时爆炸", "范围高伤害", "需远程击杀"],
        vibeTags: ["封闭空间", "走廊", "孵化场", "实验室"],
    },
    {
        id: "spider",
        name: "巨蛛",
        role: "grunt",
        behavior: "melee",
        traits: ["四足爬行", "移速≈玩家移速", "低血量", "成群", "近战穿刺"],
        vibeTags: ["洞穴", "下水道", "阴暗区域", "管道间"],
    },
];

/**
 * Boss 槽位：10 关，每关预设 Boss。
 * API 按关卡编号选 Boss；其余敌人按场景氛围从 ENEMY_REGISTRY 中选。
 */
export const BOSS_SLOTS: readonly BossSlot[] = [
    {
        id: "boss-01",
        enemyId: "rhino",
        level: 1,
        conditionHint: "关卡末尾封闭房间内出现，需击杀后解锁出口",
    },
    {
        id: "boss-02",
        enemyId: "rhino-bullet",
        level: 2,
        conditionHint: "军营深处，触发警报后从后方闸门破墙而出",
    },
    {
        id: "boss-03",
        enemyId: "burster",
        level: 3,
        conditionHint: "孵化场核心，大量自爆体+母体同时激活",
    },
    {
        id: "boss-04",
        enemyId: "armed-biped",
        level: 4,
        conditionHint: "研究设施控制室，精英集群守卫",
    },
    {
        id: "boss-05",
        enemyId: "rhino-rocket",
        level: 5,
        conditionHint: "废墟广场，远距离轰炸型犀牛+杂兵潮",
    },
    {
        id: "boss-06",
        enemyId: "rhino-plasma",
        level: 6,
        conditionHint: "地下实验室核心区，等离子犀牛+自爆体",
    },
    {
        id: "boss-07",
        enemyId: "rhino-bullet",
        level: 7,
        conditionHint: "前线要塞，双子弹犀牛+武装步行者编队",
    },
    {
        id: "boss-08",
        enemyId: "rhino",
        level: 8,
        conditionHint: "工业区深处，犀牛巨怪×2+变异蛙潮",
    },
    {
        id: "boss-09",
        enemyId: "rhino-rocket",
        level: 9,
        conditionHint: "码头终点，火箭犀牛+潜伏者群+自爆体",
    },
    {
        id: "boss-10",
        enemyId: "rhino-plasma",
        level: 10,
        conditionHint: "最终关卡：所有精英类型混编+等离子犀牛镇守终点",
    },
];

/**
 * 按 id 查找敌人条目。
 */
export function getEnemyById(id: string): EnemyEntry | undefined {
    return ENEMY_REGISTRY.find((e) => e.id === id);
}

/**
 * 按氛围标签推荐敌人列表。
 */
export function getEnemiesByVibe(vibe: string): EnemyEntry[] {
    return ENEMY_REGISTRY.filter((e) => e.vibeTags.includes(vibe));
}

/**
 * 获取指定关卡 Boss。
 */
export function getBossByLevel(level: number): BossSlot | undefined {
    return BOSS_SLOTS.find((b) => b.level === level);
}